import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
// Tambahkan REFERRAL_BONUSES di import
import { PLANS, GAME_CONFIG, REFERRAL_BONUSES } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, planId } = req.body;
    
    // 1. Validasi Input
    const targetPlan = PLANS[planId];
    if (!targetPlan) throw new Error("Plan tidak valid.");
    
    if (planId === 'FREE') throw new Error("Tidak bisa downgrade ke Free.");

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // Cek Plan
      if (userData.plan === planId) throw new Error("Anda sudah berada di Plan ini!");

      // 2. HITUNG HARGA (USDT -> PTS)
      const rateUsdToPts = GAME_CONFIG.WITHDRAW?.RATE || 100000; 
      const priceInPts = targetPlan.priceUsdt * rateUsdToPts;

      // 3. CEK SALDO
      if ((userData.balance || 0) < priceInPts) {
         throw new Error("SALDO_KURANG"); 
      }

      // ============================================================
      // [LOGIC BARU] BONUS REFERRAL (HIGH TICKET)
      // ============================================================
      const bonusAmount = REFERRAL_BONUSES?.PLAN_UPGRADE?.[planId] || 0;
      let bonusGiven = false;

      // Jika ada bonus di config & user punya upline
      if (bonusAmount > 0 && userData.uplineId) {
          const uplineRef = getUserRef(userData.uplineId);
          const uplineDoc = await t.get(uplineRef);
          
          if (uplineDoc.exists) {
              const uData = uplineDoc.data();
              
              // Ambil statistik teman (agar tidak reset data lama)
              const currentReferrals = uData.referrals || {};
              const myStats = currentReferrals[userId] || { 
                  username: userData.username || 'Farmer', 
                  totalBonusGiven: 0, 
                  joinDate: Date.now() 
              };

              // Update Upline: Tambah Saldo & Catat Sejarah
              t.update(uplineRef, {
                  balance: (uData.balance || 0) + bonusAmount,
                  affiliateEarnings: (uData.affiliateEarnings || 0) + bonusAmount,
                  // Catat spesifik bahwa user ini baru saja menyumbang bonus besar
                  [`referrals.${userId}`]: {
                      ...myStats,
                      totalBonusGiven: (myStats.totalBonusGiven || 0) + bonusAmount
                  }
              });
              bonusGiven = true;
          }
      }
      // ============================================================

      // 4. LOGIC SLOT BARU (Base Plan + Extra Slot)
      // (Kode asli Anda tetap dipertahankan disini)
      const extraSlotsPurchased = userData.extraSlotsPurchased || 0;
      const basePlanSlots = targetPlan.plots; 

      const totalSlots = basePlanSlots + extraSlotsPurchased;
      
      const newSlotsArray = [];
      for (let i = 1; i <= totalSlots; i++) {
          newSlotsArray.push(i);
      }
      
      if (newSlotsArray.length > 12) newSlotsArray.length = 12;

      // 5. UPDATE DATABASE USER (Potong saldo, ganti plan)
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
        bonusToUpline: bonusGiven // Info tambahan untuk debug/notif
      };
    });

    return sendSuccess(res, result, `Upgrade Berhasil! Membership naik ke ${PLANS[planId].id}.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}