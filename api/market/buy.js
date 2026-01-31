import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { EXTRA_SLOT_PRICE, CONSUMABLES, STORAGE_UPGRADES, PLANS } from '../../src/config/gameConstants.js';

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

      // --- 1. LOGIKA BELI EXTRA SLOT PERMANEN ---
      if (itemId === 'EXTRA_LAND_1') {
          // Cek apakah user sudah beli extra slot ke-1?
          const currentExtra = userData.extraSlotsPurchased || 0;
          if (currentExtra >= 1) throw new Error("Anda sudah memiliki Extra Slot #1");
          
          cost = EXTRA_SLOT_PRICE[1];
          type = 'EXTRA_SLOT';
      } 
      else if (itemId === 'EXTRA_LAND_2') {
          const currentExtra = userData.extraSlotsPurchased || 0;
          if (currentExtra < 1) throw new Error("Beli Extra Slot #1 dulu!");
          if (currentExtra >= 2) throw new Error("Anda sudah memiliki Extra Slot #2");

          cost = EXTRA_SLOT_PRICE[2];
          type = 'EXTRA_SLOT';
      }
      // --- 2. LOGIKA BELI UPGRADE GUDANG ---
      else if (itemId === 'STORAGE_20') {
          const upgradeItem = STORAGE_UPGRADES[itemId];
          if (!upgradeItem) throw new Error("Item tidak valid");
          
          cost = upgradeItem.price;
          type = 'STORAGE_UPGRADE';
          value = upgradeItem.capacity;
      }
      // --- 3. LOGIKA BELI CONSUMABLES (ALAT) ---
      else if (CONSUMABLES[itemId]) {
        cost = CONSUMABLES[itemId].price;
        type = 'ITEM_TOOL';
        value = itemId;
      } else {
        throw new Error("Item tidak valid: " + itemId);
      }

      // 4. CEK SALDO
      if ((userData.balance || 0) < cost) {
        throw new Error(`Saldo kurang. Butuh ${cost.toLocaleString()} PTS.`);
      }

      // 5. PROSES UPDATE DATA
      const newBalance = (userData.balance || 0) - cost;
      let updateData = { balance: newBalance };

      if (type === 'EXTRA_SLOT') {
          // Increment counter slot extra
          const newExtraCount = (userData.extraSlotsPurchased || 0) + 1;
          updateData.extraSlotsPurchased = newExtraCount;

          // REGENERASI ARRAY SLOTS
          // Rumus: Slot Plan + Slot Extra
          const currentPlan = PLANS[userData.plan || 'FREE'];
          const baseSlots = currentPlan.plots; // 1, 4, 7, atau 10
          const totalSlots = baseSlots + newExtraCount;

          // Buat array baru [1, 2, ... total]
          const newSlotsArray = [];
          for(let i=1; i<=totalSlots; i++) newSlotsArray.push(i);
          
          updateData.slots = newSlotsArray;
      }
      else if (type === 'STORAGE_UPGRADE') {
          // Tambah limit gudang permanen
          const currentLimit = userData.storageLimit || 50;
          updateData.storageLimit = currentLimit + value;
      }
      else if (type === 'ITEM_TOOL') {
        const currentQty = (userData.inventory && userData.inventory[value]) || 0;
        updateData[`inventory.${value}`] = currentQty + 1;
      }

      t.update(userRef, updateData);
    });

    return sendSuccess(res, { itemId }, "Pembelian Berhasil!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}