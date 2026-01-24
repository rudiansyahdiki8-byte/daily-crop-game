import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// Konfigurasi Tugas (ID, Reward)
const DAILY_TASKS = {
  1: { reward: 50, label: 'Login Harian' },
  2: { reward: 100, label: 'Tanam Pohon' }, // Nanti bisa divalidasi logicnya
  3: { reward: 100, label: 'Panen Hasil' },
  4: { reward: 150, label: 'Tonton Iklan' },
  5: { reward: 200, label: 'Undang Teman' }
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, taskId } = req.body;
    const taskConfig = DAILY_TASKS[taskId];
    
    if (!taskConfig) throw new Error("Tugas tidak valid");

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. CEK APAKAH SUDAH KLAIM HARI INI?
      // Format Tanggal Hari Ini (YYYY-MM-DD)
      const todayStr = new Date().toISOString().split('T')[0];
      
      const userTasks = userData.dailyTasks || {}; // Struktur: { '1': '2026-01-24', '2': '...' }
      const lastClaimDate = userTasks[taskId];

      if (lastClaimDate === todayStr) {
        throw new Error("Tugas ini sudah diklaim hari ini!");
      }

      // 2. VALIDASI SYARAT (OPSIONAL TAPI BAGUS)
      // Contoh: Untuk Task 5 (Undang Teman), cek apakah friendsCount > 0
      if (taskId === 5 && (userData.friendsCount || 0) === 0) {
        throw new Error("Anda belum mengundang teman!");
      }

      // 3. BERI HADIAH
      const newBalance = (userData.balance || 0) + taskConfig.reward;

      // 4. SIMPAN DATA
      t.update(userRef, {
        balance: newBalance,
        [`dailyTasks.${taskId}`]: todayStr // Kunci dengan tanggal hari ini
      });

      return { 
        taskId, 
        reward: taskConfig.reward, 
        newBalance 
      };
    });

    return sendSuccess(res, result, "Reward Berhasil Diklaim!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}