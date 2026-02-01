import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData, calculateYield } from '../_services/farmService.js';
import { isStorageFull } from '../_services/inventoryService.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. Validate Crop (Ready?)
      const slotData = userData.farm?.[slotId];
      if (!slotData) throw new Error("Slot is empty!");
      if (Date.now() < slotData.harvestAt) throw new Error("Crop not ready to harvest!");

      // 2. Validate Storage (using service)
      const inventory = userData.inventory || {};
      const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
      const limit = userData.storageLimit || 50;

      if (isStorageFull(currentTotal, userData.plan, limit)) {
        // Track storage full event
        const storageStats = userData.storageStats || { maxReached: 0, timesFull: 0, upgradesPurchased: 0 };
        storageStats.timesFull = (storageStats.timesFull || 0) + 1;

        t.update(userRef, { storageStats });
        throw new Error("Storage Full! Sell items first.");
      }

      // 3. CALCULATE YIELD (Call Service)
      // Yield Booster logic is handled here
      const { amount, isDouble } = calculateYield(userData.buffs || {});

      // 4. AUTO REPLANT (Call Service Again)
      // Immediately generate new crop with same RNG & Buffs
      const nextCrop = rollCropData(userData.buffs || {});

      // 5. Update DB (Harvest & Replant at once)
      const cropName = slotData.cropName;
      const newQty = (inventory[cropName] || 0) + amount;

      // 6. Update Crop Analytics
      const cropStats = userData.cropStats || {
        totalHarvests: 0,
        byRarity: { COMMON: 0, UNCOMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 },
        totalEarnings: 0
      };

      cropStats.totalHarvests += 1;
      cropStats.byRarity[slotData.rarity] = (cropStats.byRarity[slotData.rarity] || 0) + 1;

      t.update(userRef, {
        [`inventory.${cropName}`]: newQty, // Add stock
        [`farm.${slotId}`]: nextCrop,      // Overwrite slot with new crop
        cropStats: cropStats               // Update analytics
      });

      return {
        harvested: cropName,
        amount,
        isDouble,
        nextCrop // Send new crop data so Frontend can update image immediately
      };
    });

    return sendSuccess(res, result, `Harvested ${result.amount}x ${result.harvested}!`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}