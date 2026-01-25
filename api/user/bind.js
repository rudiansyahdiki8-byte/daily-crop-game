import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, uplineId } = req.body;

    if (userId == uplineId) throw new Error("Tidak bisa mengundang diri sendiri!");

    const userRef = getUserRef(userId);
    const uplineRef = getUserRef(uplineId);

    await userRef.firestore.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const uplineDoc = await t.get(uplineRef);

      if (!uplineDoc.exists) throw new Error("ID Teman tidak ditemukan.");
      const userData = userDoc.data();

      // Cek apakah sudah punya upline? [cite: 74]
      if (userData.uplineId) {
        throw new Error("Anda sudah terikat dengan teman lain.");
      }

      // Ikat Permanen
      t.update(userRef, { uplineId: uplineId });
      
      // Update Counter Teman di Upline
      const currentFriends = uplineDoc.data().friendsCount || 0;
      t.update(uplineRef, { friendsCount: currentFriends + 1 });
    });

    return sendSuccess(res, { uplineId }, "Berhasil terikat dengan teman!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}