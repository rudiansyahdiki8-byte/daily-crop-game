import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS, LAND_PLOTS } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, planId } = req.body;
    const targetPlan = PLANS[planId];

    if (!targetPlan) return sendError(res, 400, "Plan tidak valid");

    const userRef = getUserRef(userId);

    // Gunakan Transaksi Database
    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. Cek apakah user mencoba downgrade? (Harus upgrade berurutan [cite: 16])
      // Urutan: FREE -> MORTGAGE -> TENANT -> OWNER
      const levels = ['FREE', 'MORTGAGE', 'TENANT', 'OWNER'];
      const currentLevel = levels.indexOf(userData.plan);
      const targetLevel = levels.indexOf(planId);

      if (targetLevel <= currentLevel) {
        throw new Error("Anda sudah memiliki plan ini atau lebih tinggi.");
      }
      if (targetLevel > currentLevel + 1) {
        throw new Error("Upgrade harus berurutan (Tidak bisa lompat).");
      }

      // 2. SIMULASI PEMBAYARAN USDT
      // Di real production, di sini kita cek Hash Transaksi Blockchain.
      // Untuk dev sekarang, kita anggap pembayaran SUKSES.

      // 3. Update Hak Akses User
      // - Tambah Slot 
      // - Update Storage Limit 
      
      let newSlots = [...userData.slots];
      
      // Logika Unlock Slot berdasarkan Plan
      if (planId === 'MORTGAGE') {
        // Mortgage buka sampai 4 plot (Slot 1-4)
        if (!newSlots.includes(4)) newSlots.push(4);
      }
      if (planId === 'TENANT' || planId === 'OWNER') {
        // Tenant buka sampai 7 plot, Owner 8 plot
        const max = targetPlan.plots; // 7 atau 8
        for (let i = 1; i <= max; i++) {
            if (!newSlots.includes(i)) newSlots.push(i);
        }
      }

      // Update DB
      t.update(userRef, {
        plan: planId,
        storageLimit: targetPlan.storage,
        slots: newSlots, // Simpan array slot yang baru
        // Reset iklan jika perlu, dll
      });
    });

    return sendSuccess(res, { plan: planId }, "Upgrade Berhasil!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}