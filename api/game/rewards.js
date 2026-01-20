// api/game/rewards.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';

// Mapping ID Task ke Key di GameConfig agar reward tidak rata 100
const TASK_MAPPING = {
    'daily_login': 'Login',
    'visit_farm': 'Visit',
    'free_reward': 'Gift',
    'clean_farm': 'Clean',
    'water_plants': 'Water',
    'fertilizer': 'Fertilize',
    'kill_pests': 'Pest',
    'harvest_once': 'Harvest',
    'sell_item': 'Sell'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, action, payload } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const serverNow = Date.now();

    try {
        // KUNCI PERBAIKAN: Simpan hasil transaksi ke variabel, lalu kirim res.json di luar
        const transactionResult = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const userData = doc.data();
            
            // --- LOGIKA LUCKY SPIN ---
            if (action === 'SPIN') {
                const spinType = payload.type;
                const lastSpin = userData.user.spin_free_cooldown || 0;
                const cost = GameConfig.Spin.CostPaid;
                const cooldown = GameConfig.Spin.CooldownFree;

                if (spinType === 'free') {
                    if (serverNow - lastSpin < cooldown) throw new Error("Spin masih cooldown!");
                    userData.user.spin_free_cooldown = serverNow;
                } else {
                    if (userData.user.coins < cost) throw new Error("Koin tidak cukup!");
                    userData.user.coins -= cost;
                }

                const result = rollSpinServer(); 
                let rewardMsg = "";

                if (result.type === 'coin') {
                    userData.user.coins += result.val;
                    rewardMsg = `+${result.val} PTS`;
                } else if (result.type === 'herb') {
                    userData.warehouse[result.key] = (userData.warehouse[result.key] || 0) + 1;
                    rewardMsg = `1x ${result.label}`;
                }

                t.update(userRef, userData);
                // Kembalikan data untuk dikirim di luar transaksi
                return { success: true, result, rewardMsg, newBalance: userData.user.coins };
            }

            // --- LOGIKA DAILY TASKS ---
            if (action === 'CLAIM_TASK') {
                const taskId = payload.taskId;
                const cooldowns = userData.user.task_cooldowns || {};
                const lastClaim = cooldowns[taskId] || 0;

                if (serverNow - lastClaim < 86400000) throw new Error("Task sudah diklaim!");

                // Hubungkan ke Config agar reward tidak rata 100
                const configKey = TASK_MAPPING[taskId];
                const reward = (configKey && GameConfig.Tasks[configKey]) ? GameConfig.Tasks[configKey] : 100;
                
                userData.user.coins += reward;
                cooldowns[taskId] = serverNow;

                t.update(userRef, { 
                    "user.coins": userData.user.coins, 
                    "user.task_cooldowns": cooldowns 
                });

                return { success: true, reward, newBalance: userData.user.coins };
            }

            throw new Error("Action tidak dikenali");
        });

        // Kirim respons di sini (Satu kali saja)
        return res.json(transactionResult);

    } catch (error) {
        console.error("Reward Error:", error.message);
        // Cek jika header belum dikirim sebelum mengirim error
        if (!res.headersSent) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
}

function rollSpinServer() {
    const rand = Math.random() * 100;
    if (rand < 40) return { type: 'coin', val: 50, index: 0 }; 
    if (rand < 70) return { type: 'herb', key: 'ginger', label: 'Ginger', index: 1 };
    if (rand < 90) return { type: 'coin', val: 200, index: 2 }; 
    return { type: 'coin', val: 1000, index: 6 }; 
}
