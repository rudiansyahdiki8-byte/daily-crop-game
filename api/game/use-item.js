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

      // 1. CHECK ITEM STOCK
      if (!inventory[itemId] || inventory[itemId] <= 0) {
        throw new Error("Item out of stock!");
      }

      // 2. CHECK ITEM VALIDITY
      if (!CONSUMABLES[itemId]) {
        throw new Error("This item cannot be used (Passive/Error).");
      }

      // 3. CALCULATE DURATION (24 HOURS)
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      let newExpireTime = now + oneDay;

      // If similar buff is active, extend time (Optional: or reset max 24h)
      if (buffs[itemId] && buffs[itemId] > now) {
        newExpireTime = buffs[itemId] + oneDay;
      }

      // 4. UPDATE DB
      const newInventory = { ...inventory };
      newInventory[itemId]--; // Reduce by 1
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

    return sendSuccess(res, result, `Success! ${result.itemName} Activated.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}