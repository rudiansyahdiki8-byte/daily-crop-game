// api/tasks.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Mapping ID Frontend ke Config Backend
const TASK_MAPPING = {
    'daily_login': 'Login',
    'visit_farm': 'Visit',
    'free_reward': 'Gift',
    'clean_farm': 'Clean',
    'water_plants': 'Water',
    'fertilizer': 'Fertilizer',
    'kill_pests': 'Pest',
    'harvest_once': 'Harvest',
    'sell_item': 'Sell'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, taskId } = req.body;

    if (!userId || !taskId) return res.status(400).json({ error: "Missing Data" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const lastClaim = (userData.user.task_cooldowns && userData.user.task_cooldowns[taskId]) || 0;
        const now = Date.now();

        // 1. VALIDASI WAKTU (24 JAM)
        // 86400000 ms = 24 jam
        if (now - lastClaim < 86400000) {
            const timeLeft = Math.ceil((86400000 - (now - lastClaim)) / 3600000);
            return res.status(400).json({ error: `Tunggu ${timeLeft} jam lagi!` });
        }

        // 2. VALIDASI HADIAH
        const configKey = TASK_MAPPING[taskId];
        const rewardAmount = GameConfig.Tasks[configKey] || 50; // Default 50 jika tidak ada di config

        // 3. UPDATE DATABASE
        // Gunakan dot notation untuk update nested field (task_cooldowns.taskId)
        await userRef.update({
            "user.coins": db.FieldValue.increment(rewardAmount),
            [`user.task_cooldowns.${taskId}`]: now,
            "user.totalFreeEarnings": db.FieldValue.increment(rewardAmount)
        });

        // 4. RESPONSE SUKSES
        return res.status(200).json({ 
            success: true, 
            reward: rewardAmount,
            message: "Task Completed!",
            newCooldown: now
        });

    } catch (error) {
        console.error("Task API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
