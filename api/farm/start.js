import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData } from '../_services/farmService.js'; // Import Main Logic

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. Validate Slot
      if (userData.farm?.[slotId]) throw new Error("Slot is occupied!");

      // 2. CALL CENTRAL LOGIC (Service)
      // Service automatically calculates RNG and active Buffs
      const newCrop = rollCropData(userData.buffs || {});

      // 3. Update DB
      t.update(userRef, {
        [`farm.${slotId}`]: newCrop
      });

      return { slotId, ...newCrop };
    });

    return sendSuccess(res, result, "Farming Started!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}