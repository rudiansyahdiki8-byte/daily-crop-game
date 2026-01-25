import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { LAND_PLOTS, CONSUMABLES } from '../../src/config/gameConstants.js';

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

      // 1. CEK CONFIG LAND
      if (itemId === 'SLOT_2') {
        cost = LAND_PLOTS.SLOT_2.cost; type = 'SLOT'; value = 2;
      } else if (itemId === 'SLOT_3') {
        cost = LAND_PLOTS.SLOT_3.cost; type = 'SLOT'; value = 3;
      } 
      // 2. CEK CONFIG CONSUMABLES (TOOLS)
      else if (CONSUMABLES[itemId]) {
        cost = CONSUMABLES[itemId].price;
        type = 'ITEM_TOOL'; // Logic Baru: Masuk Inventory
        value = itemId;
      } else {
        throw new Error("Item tidak valid");
      }

      // 3. CEK SALDO
      if ((userData.balance || 0) < cost) {
        throw new Error(`Saldo kurang. Butuh ${cost} PTS.`);
      }

      // 4. PROSES TRANSAKSI
      const newBalance = userData.balance - cost;
      let updateData = { balance: newBalance };

      if (type === 'SLOT') {
        if (userData.slots.includes(value)) throw new Error("Sudah punya slot ini.");
        updateData.slots = [...userData.slots, value];
      } 
      else if (type === 'ITEM_TOOL') {
        // Masukkan ke Inventory (Gudang Tab Tools)
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