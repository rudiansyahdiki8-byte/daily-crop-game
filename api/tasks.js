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
    // 1. Setup Header CORS
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
        // Ambil data user.task_cooldowns dengan aman (jika undefined, anggap kosong)
        const cooldowns = (userData.user && userData.user.task_cooldowns) ? userData.user.task_cooldowns : {};
        const lastClaim = cooldowns[taskId] || 0;
        const now = Date.now();

        // 2. VALIDASI WAKTU (24 JAM)
        // 86400000 ms = 24 jam
        if (now - lastClaim < 86400000) {
            const timeLeftHours = Math.ceil((86400000 - (now - lastClaim)) / 3600000);
            return res.status(400).json({ error: `Tunggu ${timeLeftHours} jam lagi!` });
        }

        // 3. VALIDASI HADIAH
        // Pastikan GameConfig dan Tasks ada. Jika tidak, pakai default 50.
        let rewardAmount = 50;
        if (GameConfig && GameConfig.Tasks) {
            const configKey = TASK_MAPPING[taskId];
            if (GameConfig.Tasks[configKey]) {
                rewardAmount = GameConfig.Tasks[configKey];
            }
        }

        // 4. UPDATE DATABASE (PAKAI SET MERGE AGAR AMAN)
        // Cara ini akan membuat field 'task_cooldowns' otomatis jika belum ada.
        const updateData = {
            user: {
                coins: (userData.user.coins || 0) + rewardAmount,
                totalFreeEarnings: (userData.user.totalFreeEarnings || 0) + rewardAmount,
                task_cooldowns: {
                    ...cooldowns, // Pertahankan cooldown task lain
                    [taskId]: now // Update task ini
                }
            }
        };

        // Gunakan set({ ... }, { merge: true }) alih-alih update()
        // Ini mencegah error "No document to update" atau "Field path invalid"
        await userRef.set(updateData, { merge: true });

        return res.status(200).json({ 
            success: true, 
            reward: rewardAmount,
            message: "Task Completed!",
            newCooldown: now
        });

    } catch (error) {
        console.error("Task API Error:", error);
        // Kirim pesan error yang jelas ke Frontend
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
}
