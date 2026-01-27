import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// KONFIGURASI TUGAS (Backend Local Config)
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
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, taskId } = req.body;
    
    // 1. Validasi
    const taskConfig = DAILY_TASKS[taskId];
    if (!taskConfig) {
       throw new Error(`Invalid Task ID: ${taskId}`);
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 2. CEK KLAIM (Format Tanggal: YYYY-MM-DD)
      const todayStr = new Date().toISOString().split('T')[0];
      const userTasks = userData.dailyTasks || {}; 
      const lastClaimDate = userTasks[taskId];

      if (lastClaimDate === todayStr) {
        throw new Error("Task already claimed today!");
      }

      // 3. REWARD
      let finalReward = taskConfig.reward;

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
        [`dailyTasks.${taskId}`]: todayStr, // Simpan tanggal hari ini
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