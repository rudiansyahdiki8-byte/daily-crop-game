import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';

// [PERBAIKAN 1] Kamus untuk menerjemahkan ID dari Farm.js ke Config.js
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { initData, action, payload } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const serverNow = Date.now();

    try {
        // [PERBAIKAN 2] Simpan hasil di variabel 'result', jangan kirim res.json di dalam transaction
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const userData = doc.data();
            
            // --- LOGIKA CLAIM TASK ---
            if (action === 'CLAIM_TASK') {
                const taskId = payload.taskId; 
                const cooldowns = userData.user.task_cooldowns || {};
                
                // Cek Cooldown 24 Jam
                if (serverNow - (cooldowns[taskId] || 0) < 86400000) {
                    throw new Error("Tugas sudah diklaim hari ini!");
                }

                // Ambil Nama Config yang Benar menggunakan MAPPING
                const configKey = TASK_MAPPING[taskId]; 
                
                // Ambil Reward dari Config (Jika tidak ketemu, baru pakai 100)
                const reward = (configKey && GameConfig.Tasks[configKey]) 
                               ? GameConfig.Tasks[configKey] 
                               : 100;
                
                userData.user.coins += reward;
                cooldowns[taskId] = serverNow;
                
                // Update Database
                t.update(userRef, { 
                    "user.coins": userData.user.coins, 
                    "user.task_cooldowns": cooldowns 
                });

                return { success: true, reward, newBalance: userData.user.coins };
            }

            // --- LOGIKA LUCKY SPIN (Tetap Dipertahankan) ---
            if (action === 'SPIN') {
                const spinType = payload.type;
                const lastSpin = userData.user.spin_free_cooldown || 0;
                const cost = GameConfig.Spin.CostPaid;
                const cooldown = GameConfig.Spin.CooldownFree;

                if (spinType === 'free') {
                    if (serverNow - lastSpin < cooldown) throw new Error("Free spin still on cooldown");
                    userData.user.spin_free_cooldown = serverNow;
                } else {
                    if (userData.user.coins < cost) throw new Error("Insufficient coins for paid spin");
                    userData.user.coins -= cost;
                }

                const spinResult = rollSpinServer(); 
                let rewardMsg = "";

                if (spinResult.type === 'coin') {
                    userData.user.coins += spinResult.val;
                    rewardMsg = `+${spinResult.val} PTS`;
                } else if (spinResult.type === 'herb') {
                    userData.warehouse[spinResult.key] = (userData.warehouse[spinResult.key] || 0) + 1;
                    rewardMsg = `1x ${spinResult.label}`;
                }

                t.update(userRef, userData);
                return { success: true, result: spinResult, rewardMsg, newBalance: userData.user.coins };
            }

            throw new Error("Action tidak dikenali");
        });

        // [PERBAIKAN 3] Kirim respon satu kali saja di sini agar Vercel tidak crash
        return res.json(result);

    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

// Fungsi Random Spin (Tetap Sama)
function rollSpinServer() {
    const rand = Math.random() * 100;
    if (rand < 40) return { type: 'coin', val: 50, index: 0 }; 
    if (rand < 70) return { type: 'herb', key: 'ginger', label: 'Ginger', index: 1 };
    if (rand < 90) return { type: 'coin', val: 200, index: 2 }; 
    return { type: 'coin', val: 1000, index: 6 }; 
}
