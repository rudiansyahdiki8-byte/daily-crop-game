import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { CONSUMABLES } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, itemId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();
      
      const inventory = userData.inventory || {};
      const buffs = userData.buffs || {};

      // 1. CEK STOK ITEM
      if (!inventory[itemId] || inventory[itemId] <= 0) {
        throw new Error("Stok item habis!");
      }

      // 2. CEK VALIDITAS ITEM
      if (!CONSUMABLES[itemId]) {
         throw new Error("Item ini tidak bisa digunakan (Pasif/Error).");
      }

      // 3. HITUNG DURASI (24 JAM)
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      let newExpireTime = now + oneDay;

      // Jika buff sejenis masih aktif, perpanjang waktunya (Opsional: atau reset max 24jam)
      if (buffs[itemId] && buffs[itemId] > now) {
         newExpireTime = buffs[itemId] + oneDay;
      }

      // 4. UPDATE DB
      const newInventory = { ...inventory };
      newInventory[itemId]--; // Kurangi 1
      if (newInventory[itemId] === 0) delete newInventory[itemId];

      const newBuffs = { ...buffs, [itemId]: newExpireTime };

      t.update(userRef, {
        inventory: newInventory,
        buffs: newBuffs
      });

      return { 
         itemId, 
         itemName: CONSUMABLES[itemId].name, 
         expireAt: newExpireTime 
      };
    });

    return sendSuccess(res, result, `Berhasil! ${result.itemName} Aktif.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}