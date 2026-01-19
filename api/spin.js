// api/spin.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
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

        // 1. CEK SYARAT & POTONG SALDO
        if (type === 'paid') {
            // Ambil harga dari Config (Default 150)
            const cost = GameConfig.Spin?.CostPaid || 150;
            
            if ((user.coins || 0) < cost) {
                return res.status(400).json({ error: "Koin tidak cukup! Butuh " + cost });
            }
            
            // Potong Koin di Server (Aman)
            await userRef.set({ 
                user: { coins: db.FieldValue.increment(-cost) } 
            }, { merge: true });

        } else if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            const cooldown = GameConfig.Spin?.CooldownFree || 3600000;
            
            if (now < lastSpin + cooldown - 5000) { // Toleransi 5 detik
                return res.status(400).json({ error: "Masih Cooldown!" });
            }
            await userRef.set({ 
                user: { spin_free_cooldown: now } 
            }, { merge: true });
        }

        // 2. GACHA (LOGIKA ACAK DI SERVER)
        const rand = Math.random() * 100;
        let targetIndex = 0; 

        // Mapping Index: 0-7 (Sesuai urutan visual di frontend)
        // 0:Low, 1:Herb, 2:High, 3:Herb, 4:Mid, 5:Rare, 6:Jackpot, 7:Low
        if (rand < 40) { targetIndex = (Math.random() < 0.5) ? 0 : 7; } // 40% Zonk
        else if (rand < 70) { targetIndex = (Math.random() < 0.5) ? 1 : 3; } // 30% Herb Common
        else if (rand < 90) { targetIndex = 4; } // 20% Mid Coin
        else if (rand < 99) { targetIndex = (Math.random() < 0.5) ? 2 : 5; } // 9% High/Rare
        else { targetIndex = 6; } // 1% Jackpot

        // 3. BERIKAN HADIAH
        // Definisikan ulang hadiah sesuai index
        const conf = GameConfig.Spin || {};
        const rewards = [
            { type: 'coin', val: conf.RewardCoinLow || 50 },     // 0
            { type: 'herb', rarity: 'Common' },                  // 1
            { type: 'coin', val: conf.RewardCoinHigh || 1000 },  // 2
            { type: 'herb', rarity: 'Common' },                  // 3
            { type: 'coin', val: conf.RewardCoinMid || 200 },    // 4
            { type: 'herb', rarity: 'Rare' },                    // 5
            { type: 'coin', val: conf.Jackpot || 10000 },        // 6
            { type: 'coin', val: conf.RewardCoinLow || 50 }      // 7
        ];

        const selected = rewards[targetIndex];
        let finalReward = { type: 'coin', name: '', value: 0 };

        if (selected.type === 'coin') {
            finalReward.name = `${selected.val} PTS`;
            finalReward.value = selected.val;
            await userRef.set({ user: { coins: db.FieldValue.increment(selected.val) } }, { merge: true });
        } else {
            // Random Herb
            const crops = GameConfig.Crops || {};
            const keys = Object.keys(crops);
            const itemKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'ginger';
            finalReward.type = 'herb';
            finalReward.name = itemKey;
            await userRef.set({ warehouse: { [itemKey]: db.FieldValue.increment(1) } }, { merge: true });
        }

        // 4. KIRIM HASIL KE CLIENT
        const updatedDoc = await userRef.get();
        return res.status(200).json({ 
            success: true, 
            targetIndex: targetIndex,
            reward: finalReward,
            userCoins: updatedDoc.data().user.coins,
            warehouse: updatedDoc.data().warehouse
        });

    } catch (error) {
        console.error("Spin API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
