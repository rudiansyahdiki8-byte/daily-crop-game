import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { telegramId, username } = req.body;

    // VALIDASI KETAT: Cek apakah ID dikirim?
    // Kita cek null, undefined, atau 0
    if (!telegramId) {
      console.error("[LOGIN ERROR] telegramId is missing:", req.body);
      return sendError(res, 400, "ID Telegram Wajib Ada (Client Error)");
    }

    // Panggil getUserRef HANYA jika ID valid
    const userRef = getUserRef(telegramId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // --- REGISTER USER BARU ---
      const newUserData = {
        id: telegramId,
        username: username || `User${telegramId}`,
        balance: 0,
        plan: 'FREE',
        storageLimit: 50,
        inventory: {},
        farm: {},
        slots: [1],
        buffs: {},
        dailyTasks: {},
        friendsCount: 0,
        affiliateEarnings: 0,
        createdAt: Date.now()
      };

      await userRef.set(newUserData);
      return sendSuccess(res, newUserData, "Akun Baru Berhasil Dibuat!");
    }

    // --- LOGIN USER LAMA ---
    const userData = userDoc.data();
    
    // Update username jika berubah
    if (username && userData.username !== username) {
        await userRef.update({ username });
        userData.username = username;
    }

    return sendSuccess(res, userData, "Login Berhasil");

  } catch (error) {
    console.error("[LOGIN CRASH]", error);
    return sendError(res, 500, error.message);
  }
}
