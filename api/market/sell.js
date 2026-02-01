import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef, admin } from '../_utils/firebase.js';
import { PLANS, CONSUMABLES, REFERRAL_BONUSES } from '../../src/config/gameConstants.js';
import { getHourlyPrice } from '../_services/marketService.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, useAdBooster, itemName, qty } = req.body;

    // Validate inputs
    if (qty !== undefined && qty !== null) {
      const parsedQty = parseInt(qty);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw new Error("Invalid quantity");
      }
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      // 1. GET USER DATA
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      const inventory = userData.inventory || {};
      const currentHourSeed = Math.floor(Date.now() / 3600000);

      // 2. DETERMINE ITEMS TO SELL
      let itemsToSell = {};

      if (itemName) {
        // Sell Single (Specific Item)
        const currentStock = inventory[itemName] || 0;
        if (currentStock <= 0) throw new Error(`Stock empty: ${itemName}`);

        if (CONSUMABLES[itemName]) throw new Error("Cannot sell consumables!");

        let sellQty = currentStock;
        if (qty && qty > 0) {
          if (qty > currentStock) throw new Error("Stock not enough!");
          sellQty = parseInt(qty);
        }
        itemsToSell[itemName] = sellQty;

      } else {
        // Sell All - Except Consumables
        for (const [key, val] of Object.entries(inventory)) {
          if (!CONSUMABLES[key]) {
            itemsToSell[key] = val;
          }
        }
      }

      // 3. CALCULATE REVENUE
      let totalItems = 0;
      let totalRevenue = 0;
      const soldDetails = [];

      for (const [item, count] of Object.entries(itemsToSell)) {
        if (count > 0) {
          const price = getHourlyPrice(item, currentHourSeed);
          totalRevenue += price * count;
          totalItems += count;
          soldDetails.push({ name: item, qty: count, price });
        }
      }

      if (totalItems === 0) throw new Error("No items to sell.");

      // 4. CALCULATE BONUS (Plan + Buff + Ads)
      const userPlan = PLANS[userData.plan || 'FREE'];
      let bonusPct = userPlan.bonusSell || 0;

      const buffs = userData.buffs || {};
      if (buffs['TRADE_PERMIT'] && buffs['TRADE_PERMIT'] > Date.now()) {
        bonusPct += 0.10; // +10% from Trade Permit
      }

      if (useAdBooster) {
        const lastBoost = userData.lastAdBoost || 0; // Fix: Add default value
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - lastBoost < oneDay) {
          throw new Error("Booster Cooldown (24h)!");
        }
        bonusPct += 0.20; // +20% from Ads
        t.update(userRef, { lastAdBoost: Date.now() });
      }

      const bonusAmount = Math.floor(totalRevenue * bonusPct);
      const finalRevenue = totalRevenue + bonusAmount;

      // 5. AFFILIATE LOGIC (NEW UPDATE)
      // Record bonus detail to specific friend
      if (userData.uplineId) {
        const uplineRef = getUserRef(userData.uplineId);
        const uplineDoc = await t.get(uplineRef);

        if (uplineDoc.exists) {
          // Get percent from Config (Default 10%)
          const commissionPct = REFERRAL_BONUSES?.SELL_PERCENT || 0.10;
          const commission = Math.floor(finalRevenue * commissionPct);

          if (commission > 0) {
            const uData = uplineDoc.data();

            // Get stats of this friend in upline database
            const currentReferrals = uData.referrals || {};
            const myStats = currentReferrals[userId] || {
              username: userData.username || 'Farmer',
              totalBonusGiven: 0,
              joinDate: Date.now()
            };

            t.update(uplineRef, {
              balance: admin.firestore.FieldValue.increment(commission),
              affiliateEarnings: admin.firestore.FieldValue.increment(commission),
              // Update specific user
              [`referrals.${userId}`]: {
                ...myStats,
                username: userData.username || myStats.username, // Update name if changed
                totalBonusGiven: (myStats.totalBonusGiven || 0) + commission
              }
            });
          }
        }
      }

      // 6. UPDATE USER DATA
      const newInventory = { ...userData.inventory };
      for (const [item, count] of Object.entries(itemsToSell)) {
        newInventory[item] = (newInventory[item] || 0) - count;
        if (newInventory[item] <= 0) delete newInventory[item];
      }

      const logEntry = {
        type: 'SELL',
        amount: finalRevenue,
        desc: `Sold ${totalItems} items (+${(bonusPct * 100).toFixed(0)}%)`,
        date: Date.now()
      };

      const currentHistory = userData.history || [];
      const newHistory = [logEntry, ...currentHistory].slice(0, 50);

      t.update(userRef, {
        inventory: newInventory,
        balance: (userData.balance || 0) + finalRevenue,
        totalSales: (userData.totalSales || 0) + finalRevenue,
        history: newHistory
      });

      return {
        totalReceived: finalRevenue,
        itemsSold: totalItems,
        bonusPct: (bonusPct * 100).toFixed(0),
        soldDetails
      };
    });

    return sendSuccess(res, result, `Sold! +${result.totalReceived} PTS`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}