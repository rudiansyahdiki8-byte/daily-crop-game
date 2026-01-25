import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// KONFIGURASI TUGAS BARU (Total Reward ±1200 PTS)
// ID harus sama persis dengan yang ada di gameConstants.js Frontend
const DAILY_TASKS = {
  'LOGIN':      { reward: 100, label: 'Daily Login' },
  'GIFT':       { reward: 100, label: 'Send Gift' },
  'CLEAN':      { reward: 120, label: 'Clean Farm' },
  'WATER':      { reward: 120, label: 'Water Plants' },
  'FERTILIZER': { reward: 130, label: 'Use Fertilizer' },
  'PEST':       { reward: 140, label: 'Kill Pests' },
  'HARVEST':    { reward: 150, label: 'Harvest Crop' },
  'SELL':       { reward: 160, label: 'Sell Items' },
  'SPIN':       { reward: 180, label: 'Lucky Spin' }
};

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, taskId } = req.body;
    
    // 1. Validasi Config Task
    const taskConfig = DAILY_TASKS[taskId];
    if (!taskConfig) {
       // Ini yang menyebabkan Error 400 sebelumnya (ID tidak dikenal)
       throw new Error(`ID Tugas tidak valid: ${taskId}`);
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 2. CEK APAKAH SUDAH KLAIM HARI INI?
      const todayStr = new Date().toISOString().split('T')[0];
      const userTasks = userData.dailyTasks || {}; 
      const lastClaimDate = userTasks[taskId];

      if (lastClaimDate === todayStr) {
        throw new Error("Tugas ini sudah diklaim hari ini!");
      }

      // 3. TENTUKAN JUMLAH REWARD
      // Opsi A: Pakai nilai tetap dari Config (Lebih aman & konsisten)
      let finalReward = taskConfig.reward;

      // Opsi B: Jika ingin random di backend (misal +/- 10%)
      // const variation = Math.floor(Math.random() * 20) - 10; // -10 sampai +10
      // finalReward += variation;

      // 4. UPDATE DATA USER
      const newBalance = (userData.balance || 0) + finalReward;

      t.update(userRef, {
        balance: newBalance,
        [`dailyTasks.${taskId}`]: todayStr // Tandai task ini selesai hari ini
      });

      return { 
        taskId, 
        reward: finalReward, 
        newBalance,
        serverTime: todayStr
      };
    });

    return sendSuccess(res, result, `Berhasil! +${result.reward} PTS`);

  } catch (error) {
    // Return error 400 agar frontend tahu ada yang salah (misal double claim)
    return sendError(res, 400, error.message);
  }
}