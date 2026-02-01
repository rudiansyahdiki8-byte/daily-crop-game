import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { DAILY_TASKS } from '../../src/config/gameConstants.js';

// Random Range Helper
const getRandomReward = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, taskId } = req.body;

    // 1. Validate Task ID
    const taskConfig = DAILY_TASKS[taskId];
    if (!taskConfig) {
      throw new Error(`Invalid Task ID: ${taskId}`);
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 2. CHECK CLAIM TODAY (Date Format: YYYY-MM-DD)
      // Using server date (UTC) for consistency
      const todayStr = new Date().toISOString().split('T')[0];
      const userTasks = userData.dailyTasks || {};
      const lastClaimDate = userTasks[taskId];

      if (lastClaimDate === todayStr) {
        throw new Error("Task already claimed today!");
      }

      // 3. CALCULATE REWARD (RNG / RANDOM)
      // Matches "Random" label in Frontend
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
        [`dailyTasks.${taskId}`]: todayStr, // Mark as claimed today
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
