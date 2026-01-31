import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/telegramAuth.js'; // Import Satpam

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    // initData = Data Terenkripsi
    // telegramId = Data Mentah (Hanya untuk Dev Mode)
    const { initData, telegramId: devId, username: devUsername } = req.body;

    let userId;
    let userName;

    // A. CEK KEAMANAN (PRODUKSI)
    if (initData) {
        const validatedUser = verifyTelegramWebAppData(initData);
        if (!validatedUser) {
            return sendError(res, 403, "Forbidden: Data Telegram Palsu.");
        }
        userId = validatedUser.id;
        userName = validatedUser.username || validatedUser.first_name;
    } 
    // B. DEV MODE (LOCALHOST)
    else if (devId && process.env.NODE_ENV === 'development') {
        console.warn("⚠️ LOGIN DEV MODE");
        userId = devId;
        userName = devUsername;
    }
    else {
        return sendError(res, 401, "Akses Ditolak: Butuh initData");
    }

    // C. LOGIC DATABASE (Tetap Sama)
    const userRef = getUserRef(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Register
      const newUserData = {
        id: userId,
        username: userName || `User${userId}`,
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
        referrals: {}, 
        uplineId: null,
        createdAt: Date.now()
      };
      await userRef.set(newUserData);
      return sendSuccess(res, newUserData, "Akun Baru!");
    }

    // Login
    const userData = userDoc.data();
    if (userName && userData.username !== userName) {
        await userRef.update({ username: userName });
        userData.username = userName;
    }

    return sendSuccess(res, userData, "Login Sukses");

  } catch (error) {
    console.error("[LOGIN CRASH]", error);
    return sendError(res, 500, error.message);
  }
}
