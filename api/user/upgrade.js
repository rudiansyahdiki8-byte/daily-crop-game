import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, planId } = req.body;
    
    // Validasi Plan
    const targetPlan = PLANS[planId];
    if (!targetPlan) throw new Error("Plan tidak valid.");

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      //const userData = doc.data();

      // 1. Cek apakah user sudah di plan ini?
      // (Kita matikan dulu cek ini supaya Anda bisa re-upgrade untuk memperbaiki akun yang bug)
      // if (userData.plan === planId) throw new Error("Anda sudah di plan ini.");

      // 2. TENTUKAN SLOT YANG WAJIB TERBUKA
      let slotsToAdd = [];
      
      if (planId === 'MORTGAGE') {
        slotsToAdd = [1, 2, 3, 4]; // Mortgage dapat 4 slot
      } else if (planId === 'TENANT') {
        slotsToAdd = [1, 2, 3, 4, 5, 6, 7]; // Tenant dapat 7 slot
      } else if (planId === 'OWNER') {
        slotsToAdd = [1, 2, 3, 4, 5, 6, 7, 8]; // Owner dapat 8 slot
      }

      // 3. GABUNGKAN DENGAN SLOT LAMA (Supaya tidak mereset slot lain jika ada)
      const currentSlots = userData.slots || [1];
      const newSlots = [...currentSlots];

      slotsToAdd.forEach(slotNum => {
        if (!newSlots.includes(slotNum)) {
          newSlots.push(slotNum);
        }
      });

      // Sortir slot biar rapi (1, 2, 3...)
      newSlots.sort((a, b) => a - b);

      // 4. UPDATE DATABASE
      t.update(userRef, {
        plan: planId,
        storageLimit: targetPlan.storage,
        slots: newSlots, // <--- INI KUNCINYA
        bonusSell: targetPlan.bonusSell || 0
      });

      return { plan: planId, newSlots };
    });

    return sendSuccess(res, result, `Upgrade Sukses! Slot ${result.newSlots.join(', ')} kini aktif.`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}