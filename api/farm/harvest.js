import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData, calculateYield } from '../_services/farmService.js'; // Import Main Logic

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

      // 2. Validate Storage (Full?)
      const inventory = userData.inventory || {};
      const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
      const limit = userData.storageLimit || 50;

      // Owner (Unlimited) has no limit
      if (userData.plan !== 'OWNER' && currentTotal >= limit) {
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

      t.update(userRef, {
        [`inventory.${cropName}`]: newQty, // Add stock
        [`farm.${slotId}`]: nextCrop       // Overwrite slot with new crop
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