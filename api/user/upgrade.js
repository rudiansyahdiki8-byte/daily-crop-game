import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS, GAME_CONFIG } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, planId } = req.body;
    
    // 1. Validasi Plan
    const targetPlan = PLANS[planId];
    if (!targetPlan) throw new Error("Plan tidak valid.");
    if (planId === 'FREE') throw new Error("Tidak bisa upgrade ke Free.");

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // Cek apakah sudah di plan ini (atau plan lebih tinggi)
      // Disederhanakan: Cek jika sudah punya slot maksimal plan ini, tolak.
      if (userData.plan === planId) throw new Error("Anda sudah berada di Plan ini!");

      // 2. HITUNG HARGA (KONVERSI USDT -> PTS)
      // Rate: Ambil dari Config Withdraw (misal 1 USDT = 100.000 PTS)
      // Atau jika ingin murah buat testing, ubah angka 100000 di bawah.
      const rateUsdToPts = GAME_CONFIG.WITHDRAW.RATE || 100000; 
      const priceInPts = targetPlan.priceUsdt * rateUsdToPts;

      // 3. CEK & POTONG SALDO
      if ((userData.balance || 0) < priceInPts) {
         throw new Error(`Saldo Kurang! Butuh ${priceInPts.toLocaleString()} PTS ($${targetPlan.priceUsdt})`);
      }
      const newBalance = (userData.balance || 0) - priceInPts;

      // 4. TENTUKAN SLOT YANG WAJIB TERBUKA
      let slotsToAdd = [];
      if (planId === 'MORTGAGE') {
        slotsToAdd = [1, 2, 3, 4]; 
      } else if (planId === 'TENANT') {
        slotsToAdd = [1, 2, 3, 4, 5, 6, 7]; 
      } else if (planId === 'OWNER') {
        slotsToAdd = [1, 2, 3, 4, 5, 6, 7, 8]; 
      }

      // 5. GABUNGKAN DENGAN SLOT LAMA
      const currentSlots = userData.slots || [1];
      const newSlots = [...currentSlots];
      slotsToAdd.forEach(slotNum => {
        if (!newSlots.includes(slotNum)) newSlots.push(slotNum);
      });
      newSlots.sort((a, b) => a - b);

      // 6. UPDATE DATABASE
      t.update(userRef, {
        balance: newBalance, // <--- SALDO BERKURANG
        plan: planId,
        storageLimit: targetPlan.storage,
        slots: newSlots, 
        bonusSell: targetPlan.bonusSell || 0
      });

      return { plan: planId, newSlots, pricePaid: priceInPts, remainingBalance: newBalance };
    });

    return sendSuccess(res, result, `Upgrade Berhasil! Saldo terpotong ${result.pricePaid.toLocaleString()} PTS.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}