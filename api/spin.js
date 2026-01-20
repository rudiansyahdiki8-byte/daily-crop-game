// api/spin.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, type } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || {};
        const now = Date.now();
        const updates = {}; // Kita kumpulkan update di sini

        // 1. VALIDASI & SETUP UPDATE
        if (type === 'paid') {
            const cost = GameConfig.Spin.CostPaid || 150;
            if ((user.coins || 0) < cost) {
                return res.status(400).json({ error: "Insufficient Coins" });
            }
            // Update Saldo (Dot Notation)
            const newCoins = (user.coins || 0) - cost;
            const newSpent = (user.totalSpent || 0) + cost;
            
            user.coins = newCoins; // Update memory untuk respon
            updates['user.coins'] = newCoins; // Update DB
            updates['user.totalSpent'] = newSpent;
        } 
        else if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            const cooldownTime = GameConfig.Spin.CooldownFree || 3600000; // 1 Jam
            
            if (now - lastSpin < cooldownTime) {
                return res.status(400).json({ error: "Free Spin is Cooldown" });
            }
            
            // Update Cooldown (Dot Notation - PENTING)
            user.spin_free_cooldown = now; // Update memory
            updates['user.spin_free_cooldown'] = now; // Update DB Spesifik
        } else {
            return res.status(400).json({ error: "Invalid Spin Type" });
        }

        // 2. LOGIKA RNG (Random)
        const rand = Math.random() * 100;
        let targetIndex = 0;
        let reward = { type: 'coin', val: 0 };

        // Setting Probabilitas (Total 100%)
        if (rand < 50) { 
            targetIndex = (Math.random() < 0.5) ? 0 : 7; 
            reward = { type: 'coin', val: 50 };
        }
        else if (rand < 80) {
            targetIndex = (Math.random() < 0.5) ? 1 : 3;
            reward = { type: 'herb', rarity: 'Common' };
        }
        else if (rand < 95) {
            targetIndex = 4;
            reward = { type: 'coin', val: 200 };
        }
        else if (rand < 99) {
            targetIndex = 5;
            reward = { type: 'herb', rarity: 'Rare' };
        }
        else if (rand < 99.9) {
            targetIndex = 2;
            reward = { type: 'coin', val: 1000 };
        }
        else {
            targetIndex = 6;
            reward = { type: 'coin', val: 10000 };
        }

        // 3. APPLY REWARD
        let message = "";

        if (reward.type === 'coin') {
            const finalCoins = (user.coins || 0) + reward.val;
            user.coins = finalCoins; // Memory
            updates['user.coins'] = finalCoins; // DB
            
            if(type === 'free') {
                const newFreeEarn = (user.totalFreeEarnings || 0) + reward.val;
                updates['user.totalFreeEarnings'] = newFreeEarn;
            }
            message = `${reward.val} PTS`;
        } 
        else if (reward.type === 'herb') {
            const herbList = Object.keys(GameConfig.Crops).filter(k => {
                if(reward.rarity === 'Rare') return ['mint', 'lavender', 'aloeVera'].includes(k);
                return ['ginger', 'turmeric', 'galangal'].includes(k);
            });
            const wonHerb = herbList[Math.floor(Math.random() * herbList.length)] || 'ginger';
            
            const currentStock = (userData.warehouse && userData.warehouse[wonHerb]) ? userData.warehouse[wonHerb] : 0;
            updates[`warehouse.${wonHerb}`] = currentStock + 1;
            
            message = wonHerb.toUpperCase();
            reward.name = wonHerb;
        }

        // 4. EKSEKUSI UPDATE KE DATABASE
        await userRef.update(updates);

        return res.status(200).json({
            success: true,
            targetIndex: targetIndex,
            reward: reward,
            message: message,
            user: user, // User yang dikembalikan sudah punya 'spin_free_cooldown' baru
            warehouse: updates[`warehouse.${reward.name}`] ? { ...userData.warehouse, [reward.name]: (userData.warehouse[reward.name]||0)+1 } : userData.warehouse
        });

    } catch (e) {
        console.error("Spin API Error:", e);
        return res.status(500).json({ error: "Server Error" });
    }
}
