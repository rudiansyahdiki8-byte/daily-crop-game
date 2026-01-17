// api/task.js
const { db, verifyUser } = require('../lib/firebase');
const { GameConfig } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId, taskId } = req.body;
    if (!userId || !taskId) return res.status(400).json({ message: 'Data missing' });

    try {
        const { ref, data } = await verifyUser(userId);

        // 1. Validasi Task & Reward dari Config Server
        const rewardAmount = GameConfig.Tasks[taskId];
        if (!rewardAmount) return res.status(400).json({ success: false, message: 'Invalid Task ID' });

        // 2. Cek Cooldown di Server
        const lastClaim = data.user.task_cooldowns?.[taskId] || 0;
        const now = Date.now();
        // 24 Jam = 86400000 ms
        if ((now - lastClaim) < 86400000) {
            return res.status(400).json({ success: false, message: 'Task is on cooldown!' });
        }

        // 3. Beri Hadiah & Update Cooldown
        await ref.update({
            "user.coins": FieldValue.increment(rewardAmount),
            [`user.task_cooldowns.${taskId}`]: now,
            "user.totalFreeEarnings": FieldValue.increment(rewardAmount)
        });

        return res.status(200).json({ 
            success: true, 
            newCoins: (data.user.coins || 0) + rewardAmount,
            reward: rewardAmount 
        });

    } catch (error) {
        console.error("Task Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};