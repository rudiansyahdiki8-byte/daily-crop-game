import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef, admin } from '../_utils/firebase.js';
// Add REFERRAL_BONUSES in import
import { PLANS, GAME_CONFIG, REFERRAL_BONUSES } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, planId } = req.body;

    // 1. Validate Input
    const targetPlan = PLANS[planId];
    if (!targetPlan) throw new Error("Invalid Plan.");

    if (planId === 'FREE') throw new Error("Cannot downgrade to Free.");

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // Check Plan
      if (userData.plan === planId) throw new Error("You are already on this Plan!");

      // 2. CALCULATE PRICE (USDT -> PTS)
      const rateUsdToPts = GAME_CONFIG.EXCHANGE_RATE || 100000;
      const priceInPts = targetPlan.priceUsdt * rateUsdToPts;

      // 3. CHECK BALANCE
      if ((userData.balance || 0) < priceInPts) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // ============================================================
      // [NEW LOGIC] REFERRAL BONUS (HIGH TICKET)
      // ============================================================
      const bonusAmount = REFERRAL_BONUSES?.PLAN_UPGRADE?.[planId] || 0;
      let bonusGiven = false;

      // If bonus exists in config & user has upline
      if (bonusAmount > 0 && userData.uplineId) {
        const uplineRef = getUserRef(userData.uplineId);
        const uplineDoc = await t.get(uplineRef);

        if (uplineDoc.exists) {
          const uData = uplineDoc.data();

          // Get friend stats (to avoid resetting old data)
          const currentReferrals = uData.referrals || {};
          const myStats = currentReferrals[userId] || {
            username: userData.username || 'Farmer',
            totalBonusGiven: 0,
            joinDate: Date.now()
          };

          // Update Upline: Add Balance & Record History
          t.update(uplineRef, {
            balance: admin.firestore.FieldValue.increment(bonusAmount),
            affiliateEarnings: admin.firestore.FieldValue.increment(bonusAmount),
            // Record specifically that this user just contributed a large bonus
            [`referrals.${userId}`]: {
              ...myStats,
              totalBonusGiven: (myStats.totalBonusGiven || 0) + bonusAmount
            }
          });
          bonusGiven = true;
        }
      }
      // ============================================================

      // 4. NEW SLOT LOGIC (Base Plan + Extra Slot)
      // (Your original code is maintained here)
      const extraSlotsPurchased = userData.extraSlotsPurchased || 0;
      const basePlanSlots = targetPlan.plots;

      const totalSlots = basePlanSlots + extraSlotsPurchased;

      const newSlotsArray = [];
      for (let i = 1; i <= totalSlots; i++) {
        newSlotsArray.push(i);
      }

      if (newSlotsArray.length > 12) newSlotsArray.length = 12;

      // 5. UPDATE USER DATABASE (Deduct balance, change plan)
      const newBalance = (userData.balance || 0) - priceInPts;

      t.update(userRef, {
        balance: newBalance,
        plan: planId,
        storageLimit: targetPlan.storage,
        slots: newSlotsArray,
        adsLevel: targetPlan.ads,
        bonusSell: targetPlan.bonusSell || 0
      });

      return {
        plan: planId,
        slots: newSlotsArray,
        pricePaid: priceInPts,
        remainingBalance: newBalance,
        bonusToUpline: bonusGiven // Extra info for debug/notif
      };
    });

    return sendSuccess(res, result, `Upgrade Successful! Membership upgraded to ${PLANS[planId].id}.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}
