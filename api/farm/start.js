import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData } from '../_services/farmService.js'; // Import Otak Utama

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. Validasi Slot
      if (userData.farm?.[slotId]) throw new Error("Slot sedang dipakai!");

      // 2. PANGGIL LOGIC PUSAT (Service)
      // Service otomatis hitung RNG dan Buff yang sedang aktif
      const newCrop = rollCropData(userData.buffs || {});

      // 3. Update DB
      t.update(userRef, {
        [`farm.${slotId}`]: newCrop
      });

      return { slotId, ...newCrop };
    });

    return sendSuccess(res, result, "Berhasil Menanam!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}