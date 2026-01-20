// api/game/rewards.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, action, payload } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const serverNow = Date.now();

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const userData = doc.data();
            
            // --- LOGIKA LUCKY SPIN ---
            if (action === 'SPIN') {
                const spinType = payload.type; // 'free' atau 'paid'
                const lastSpin = userData.user.spin_free_cooldown || 0;
                const cost = GameConfig.Spin.CostPaid; // 150 PTS [cite: 574]
                const cooldown = GameConfig.Spin.CooldownFree; // 1 Jam [cite: 575]

                if (spinType === 'free') {
                    if (serverNow - lastSpin < cooldown) throw new Error("Free spin still on cooldown");
                    userData.user.spin_free_cooldown = serverNow;
                } else {
                    if (userData.user.coins < cost) throw new Error("Insufficient coins for paid spin");
                    userData.user.coins -= cost;
                }

                // Kalkulasi Hasil di Server (Gacha Aman)
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
                return res.json({ success: true, result, rewardMsg, newBalance: userData.user.coins });
            }

            // --- LOGIKA DAILY TASKS ---
            if (action === 'CLAIM_TASK') {
                const taskId = payload.taskId;
                const cooldowns = userData.user.task_cooldowns || {};
                const lastClaim = cooldowns[taskId] || 0;

                // Cek 24 jam cooldown di server
                if (serverNow - lastClaim < 86400000) throw new Error("Task already claimed today");

                const reward = GameConfig.Tasks[taskId.replace('daily_', '').charAt(0).toUpperCase() + taskId.slice(1).replace('daily_', '').substring(1)] || 100;
                
                userData.user.coins += reward;
                cooldowns[taskId] = serverNow;
                userData.user.task_cooldowns = cooldowns;

                t.update(userRef, { 
                    "user.coins": userData.user.coins, 
                    "user.task_cooldowns": cooldowns 
                });

                return res.json({ success: true, reward, newBalance: userData.user.coins });
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

function rollSpinServer() {
    // Implementasi ulang weighted random dari spin.js ke server [cite: 379, 380, 381]
    const rand = Math.random() * 100;
    if (rand < 40) return { type: 'coin', val: 50, index: 0 }; // Coin Low [cite: 379]
    if (rand < 70) return { type: 'herb', key: 'ginger', label: 'Ginger', index: 1 };
    if (rand < 90) return { type: 'coin', val: 200, index: 2 }; // Coin High [cite: 381]
    return { type: 'coin', val: 1000, index: 6 }; // Jackpot [cite: 384]
}