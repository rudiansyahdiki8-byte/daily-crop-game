// api/tasks.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Mapping: Nama ID di Frontend -> Nama Config di Backend
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
    // 1. Setup Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, taskId } = req.body;
    if (!userId || !taskId) return res.status(400).json({ error: "Missing Information" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const now = Date.now();
        
        // Ambil data user
        const userState = userData.user || {};
        const cooldowns = userState.task_cooldowns || {};
        const lastClaim = cooldowns[taskId] || 0;

        // 2. Cek Cooldown (24 Jam = 86400000 ms)
        if (now - lastClaim < 86400000) {
            const timeLeft = 86400000 - (now - lastClaim);
            const hours = Math.ceil(timeLeft / 3600000);
            return res.status(400).json({ error: `Wait ${hours}h more!` });
        }

        // 3. Ambil Reward dari GameConfig (Pusat Data)
        let rewardAmount = 50; // Default kalau tidak ketemu
        const configKey = TASK_MAPPING[taskId];
        
        if (GameConfig.Tasks && GameConfig.Tasks[configKey]) {
            rewardAmount = GameConfig.Tasks[configKey];
        }

        // 4. Update Database
        await userRef.set({
            user: {
                coins: (userState.coins || 0) + rewardAmount,
                totalFreeEarnings: (userState.totalFreeEarnings || 0) + rewardAmount,
                task_cooldowns: {
                    ...cooldowns,
                    [taskId]: now
                }
            }
        }, { merge: true });

        // 5. Kirim Hasil ke Frontend
        return res.status(200).json({ 
            success: true, 
            reward: rewardAmount,
            message: "Task Completed!",
            newCooldown: now,
            newCoins: (userState.coins || 0) + rewardAmount
        });

    } catch (error) {
        console.error("Task API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
