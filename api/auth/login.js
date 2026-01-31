import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { telegramId, username } = req.body;

    if (!telegramId) {
      return sendError(res, 400, "ID Telegram Wajib Ada (Client Error)");
    }

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
        
        // [PERBAIKAN] Tambahkan Wadah Referral Kosong
        referrals: {}, 
        
        // [PERBAIKAN] Tambahkan Upline ID (Null dulu)
        uplineId: null,

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
