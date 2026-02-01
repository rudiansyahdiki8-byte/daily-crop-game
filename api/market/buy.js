import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { EXTRA_SLOT_PRICE, CONSUMABLES, STORAGE_UPGRADES, PLANS, MAX_STORAGE_UPGRADES } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, itemId } = req.body;
    const userRef = getUserRef(userId);

    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      let cost = 0;
      let type = '';
      let value = null;

      // --- 1. PERMANENT EXTRA SLOT LOGIC ---
      if (itemId === 'EXTRA_LAND_1') {
        // Check if user already bought extra slot #1
        const currentExtra = userData.extraSlotsPurchased || 0;
        if (currentExtra >= 1) throw new Error("You already own Extra Slot #1");

        cost = EXTRA_SLOT_PRICE[1];
        type = 'EXTRA_SLOT';
      }
      else if (itemId === 'EXTRA_LAND_2') {
        const currentExtra = userData.extraSlotsPurchased || 0;
        if (currentExtra < 1) throw new Error("Buy Extra Slot #1 first!");
        if (currentExtra >= 2) throw new Error("You already own Extra Slot #2");

        cost = EXTRA_SLOT_PRICE[2];
        type = 'EXTRA_SLOT';
      }
      // --- 2. STORAGE UPGRADE LOGIC ---
      else if (itemId === 'STORAGE_20') {
        const upgradeItem = STORAGE_UPGRADES[itemId];
        if (!upgradeItem) throw new Error("Invalid Item");

        // Check purchase limit
        const currentUpgrades = userData.storageUpgradesPurchased || 0;
        if (currentUpgrades >= MAX_STORAGE_UPGRADES) {
          throw new Error(`Maximum storage upgrades reached! (${MAX_STORAGE_UPGRADES}/${MAX_STORAGE_UPGRADES})`);
        }

        cost = upgradeItem.price;
        type = 'STORAGE_UPGRADE';
        value = upgradeItem.capacity;
      }
      // --- 3. CONSUMABLES LOGIC (TOOLS) ---
      else if (CONSUMABLES[itemId]) {
        cost = CONSUMABLES[itemId].price;
        type = 'ITEM_TOOL';
        value = itemId;
      } else {
        throw new Error("Invalid Item: " + itemId);
      }

      // 4. CHECK BALANCE
      if ((userData.balance || 0) < cost) {
        throw new Error(`Insufficient Balance. Need ${cost.toLocaleString()} PTS.`);
      }

      // 5. UPDATE DATA PROCESS
      const newBalance = (userData.balance || 0) - cost;
      let updateData = { balance: newBalance };

      if (type === 'EXTRA_SLOT') {
        // Increment extra slot counter
        const newExtraCount = (userData.extraSlotsPurchased || 0) + 1;
        updateData.extraSlotsPurchased = newExtraCount;

        // REGENERATE SLOTS ARRAY
        // Formula: Plan Slot + Extra Slot
        const currentPlan = PLANS[userData.plan || 'FREE'];
        const baseSlots = currentPlan.plots; // 1, 4, 7, or 10
        const totalSlots = baseSlots + newExtraCount;

        // Create new array [1, 2, ... total]
        const newSlotsArray = [];
        for (let i = 1; i <= totalSlots; i++) newSlotsArray.push(i);

        updateData.slots = newSlotsArray;
      }
      else if (type === 'STORAGE_UPGRADE') {
        // Increase warehouse limit permanently
        const currentLimit = userData.storageLimit || 50;
        updateData.storageLimit = currentLimit + value;

        // Track purchase count
        const currentUpgrades = userData.storageUpgradesPurchased || 0;
        updateData.storageUpgradesPurchased = currentUpgrades + 1;

        // Update storage analytics
        const storageStats = userData.storageStats || { maxReached: 0, timesFull: 0, upgradesPurchased: 0 };
        storageStats.upgradesPurchased = (storageStats.upgradesPurchased || 0) + 1;
        updateData.storageStats = storageStats;
      }
      else if (type === 'ITEM_TOOL') {
        const currentQty = (userData.inventory && userData.inventory[value]) || 0;
        updateData[`inventory.${value}`] = currentQty + 1;
      }

      t.update(userRef, updateData);
    });

    return sendSuccess(res, { itemId }, "Purchase Successful!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}