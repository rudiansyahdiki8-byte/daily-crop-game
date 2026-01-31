import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// KONFIGURASI TUGAS (Backend Local Config)
// [UPDATE] Kita ubah jadi Range Min-Max biar seru (Gacha Reward)
const DAILY_TASKS = {
  'LOGIN':      { min: 50,  max: 100, label: 'Daily Login' },
  'GIFT':       { min: 50,  max: 100, label: 'Send Gift' },
  'CLEAN':      { min: 80,  max: 120, label: 'Clean Farm' },
  'WATER':      { min: 80,  max: 120, label: 'Water Plants' },
  'FERTILIZER': { min: 90,  max: 130, label: 'Use Fertilizer' },
  'PEST':       { min: 100, max: 150, label: 'Kill Pests' },
  'HARVEST':    { min: 100, max: 200, label: 'Harvest Crop' },
  'SELL':       { min: 120, max: 200, label: 'Sell Items' },
  'SPIN':       { min: 150, max: 250, label: 'Lucky Spin' }
};

// Helper Random Range
const getRandomReward = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, taskId } = req.body;
    
    // 1. Validasi Task ID
    const taskConfig = DAILY_TASKS[taskId];
    if (!taskConfig) {
       throw new Error(`Invalid Task ID: ${taskId}`);
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 2. CEK KLAIM HARI INI (Format Tanggal: YYYY-MM-DD)
      // Menggunakan tanggal server (UTC) agar konsisten
      const todayStr = new Date().toISOString().split('T')[0];
      const userTasks = userData.dailyTasks || {}; 
      const lastClaimDate = userTasks[taskId];

      if (lastClaimDate === todayStr) {
        throw new Error("Task already claimed today!");
      }

      // 3. HITUNG REWARD (RNG / ACAK)
      // Agar sesuai dengan label "Random" di Frontend
      const finalReward = getRandomReward(taskConfig.min, taskConfig.max);

      // 4. UPDATE USER
      const newBalance = (userData.balance || 0) + finalReward;

      // Log History
      const logEntry = {
          type: 'TASK',
          amount: finalReward,
          desc: `Task: ${taskConfig.label}`,
          date: Date.now()
      };
      
      const currentHistory = userData.history || [];
      const newHistory = [logEntry, ...currentHistory].slice(0, 50);

      t.update(userRef, {
        balance: newBalance,
        [`dailyTasks.${taskId}`]: todayStr, // Tandai sudah klaim hari ini
        history: newHistory
      });

      return { 
        taskId, 
        reward: finalReward, 
        newBalance
      };
    });

    return sendSuccess(res, result, `Success! +${result.reward} PTS`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}
