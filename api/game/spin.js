import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// [IMPORTANT] IMPORT FROM MAIN CONFIG
// So prizes and prices sync with Frontend
import { SPIN_PRIZES, SPIN_CONFIG, REFERRAL_BONUSES } from '../../src/config/gameConstants.js';

// Random Logic (Using Weight)
const getRandomReward = () => {
  const totalWeight = SPIN_PRIZES.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const reward of SPIN_PRIZES) {
    if (random < reward.weight) return reward;
    random -= reward.weight;
  }
  return SPIN_PRIZES[0];
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, mode, step } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();
      const now = Date.now();

      // --- HELPER: REFERRAL BONUS LOGIC (JACKPOT) ---
      // Small function to give bonus to upline if Jackpot won
      const giveJackpotBonusToUpline = async (rewardVal) => {
        if (userData.uplineId) {
          const uplineRef = getUserRef(userData.uplineId);
          const uplineDoc = await t.get(uplineRef);

          if (uplineDoc.exists) {
            // Calculate Bonus (e.g., 10% of 15000 = 1500)
            const bonusPct = REFERRAL_BONUSES?.JACKPOT_PERCENT || 0.10;
            const bonus = Math.floor(rewardVal * bonusPct);

            if (bonus > 0) {
              const uData = uplineDoc.data();
              // Update specific friend stats
              const currentReferrals = uData.referrals || {};
              const myStats = currentReferrals[userId] || {
                username: userData.username || 'Farmer',
                totalBonusGiven: 0,
                joinDate: Date.now()
              };

              t.update(uplineRef, {
                balance: (uData.balance || 0) + bonus,
                affiliateEarnings: (uData.affiliateEarnings || 0) + bonus,
                [`referrals.${userId}`]: {
                  ...myStats,
                  totalBonusGiven: (myStats.totalBonusGiven || 0) + bonus
                }
              });
            }
          }
        }
      };

      // ==========================================
      // 1. FREE SPIN MODE
      // ==========================================
      if (mode === 'FREE') {

        // PHASE A: ROLL (Just spin, Server determines reward)
        if (step === 'ROLL') {
          const lastSpin = userData.lastFreeSpin || 0;
          const cooldownMs = (SPIN_CONFIG?.COOLDOWN_FREE || 3600) * 1000;

          if (now - lastSpin < cooldownMs) {
            throw new Error("Cooldown! Please wait.");
          }

          const reward = getRandomReward();

          // [NEW FEATURE] Check Jackpot Bonus
          if (reward.id === 'JACKPOT') {
            await giveJackpotBonusToUpline(reward.val);
          }

          // Save PENDING REWARD (Not yet in user balance)
          t.update(userRef, {
            lastFreeSpin: now,
            pendingSpinReward: reward
          });

          return { rewardId: reward.id, rewardName: reward.val, type: reward.type };
        }

        // PHASE B: CLAIM (After watching ad)
        if (step === 'CLAIM') {
          const pending = userData.pendingSpinReward;
          if (!pending) throw new Error("No pending reward found or expired.");

          // Execute Reward Distribution
          if (pending.type === 'COIN') {
            t.update(userRef, {
              balance: (userData.balance || 0) + pending.val,
              pendingSpinReward: null
            });
          } else {
            const itemName = pending.val;
            const currentQty = (userData.inventory && userData.inventory[itemName]) || 0;
            t.update(userRef, {
              [`inventory.${itemName}`]: currentQty + 1,
              pendingSpinReward: null
            });
          }
          return { status: 'CLAIMED', reward: pending };
        }
      }

      // ==========================================
      // 2. PAID SPIN MODE (Instant Get)
      // ==========================================
      else if (mode === 'PAID') {
        const cost = SPIN_CONFIG?.COST_PAID || 150;
        if ((userData.balance || 0) < cost) {
          throw new Error("Insufficient Balance!");
        }

        const reward = getRandomReward();
        let newBalance = (userData.balance || 0) - cost;

        // [NEW FEATURE] Check Jackpot Bonus (Paid also gets upline bonus)
        if (reward.id === 'JACKPOT') {
          await giveJackpotBonusToUpline(reward.val);
        }

        if (reward.type === 'COIN') {
          newBalance += reward.val;
          t.update(userRef, { balance: newBalance });
        } else {
          t.update(userRef, { balance: newBalance });
          const itemName = reward.val;
          const currentQty = (userData.inventory && userData.inventory[itemName]) || 0;
          t.update(userRef, { [`inventory.${itemName}`]: currentQty + 1 });
        }

        return { rewardId: reward.id, rewardName: reward.val, type: reward.type };
      }

    });

    return sendSuccess(res, result, "Success");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}