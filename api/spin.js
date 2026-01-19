// api/spin.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, type } = req.body; // type: 'free' atau 'paid'
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || {};
        const now = Date.now();

        // 1. Validasi Cost & Cooldown
        if (type === 'paid') {
            const cost = GameConfig.Spin.CostPaid || 150;
            if ((user.coins || 0) < cost) {
                return res.status(400).json({ error: "Insufficient Coins" });
            }
            // Potong Saldo
            user.coins -= cost;
            user.totalSpent = (user.totalSpent || 0) + cost;
        } 
        else if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            const cooldownTime = GameConfig.Spin.CooldownFree || 3600000; // 1 Jam
            if (now - lastSpin < cooldownTime) {
                return res.status(400).json({ error: "Free Spin is Cooldown" });
            }
            // Update Cooldown
            user.spin_free_cooldown = now;
        } else {
            return res.status(400).json({ error: "Invalid Spin Type" });
        }

        // 2. Logika RNG (Random Number Generator) - Di Server!
        // Index 0-7 (Sesuai visual roda di frontend, searah jarum jam)
        // 0: Coin 50, 1: Common Herb, 2: Coin 1000 (Jackpot), 3: Common Herb
        // 4: Coin 200, 5: Rare Herb, 6: Coin 10000 (Super Jackpot), 7: Coin 50
        
        const rand = Math.random() * 100;
        let targetIndex = 0;
        let reward = { type: 'coin', val: 0 };

        // Setting Probabilitas (Total 100%)
        // 50% = Coin Kecil (50)
        // 30% = Common Herb
        // 15% = Coin Sedang (200)
        // 4%  = Rare Herb
        // 0.9% = Jackpot (1000)
        // 0.1% = Super Jackpot (10000)

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

        // 3. Berikan Hadiah
        let message = "";
        const updates = {};

        if (reward.type === 'coin') {
            user.coins = (user.coins || 0) + reward.val;
            // Statistik
            if(type === 'free') user.totalFreeEarnings = (user.totalFreeEarnings || 0) + reward.val;
            
            message = `${reward.val} PTS`;
            updates['user'] = user;
        } 
        else if (reward.type === 'herb') {
            // Pilih tanaman random sesuai rarity
            // (Sederhana: Kita hardcode listnya atau ambil random dari config)
            const herbList = Object.keys(GameConfig.Crops).filter(k => {
                // Filter sederhana, idealnya baca rarity dari config tapi di config hanya ada chance
                // Kita pakai fallback sederhana
                if(reward.rarity === 'Rare') return ['mint', 'lavender', 'aloeVera'].includes(k);
                return ['ginger', 'turmeric', 'galangal'].includes(k);
            });
            const wonHerb = herbList[Math.floor(Math.random() * herbList.length)] || 'ginger';
            
            const currentStock = (userData.warehouse && userData.warehouse[wonHerb]) ? userData.warehouse[wonHerb] : 0;
            updates[`warehouse.${wonHerb}`] = currentStock + 1;
            
            // Update user juga untuk simpan koin/cooldown yg berubah di atas
            updates['user'] = user;
            message = wonHerb.toUpperCase();
            
            // Override reward object untuk dikirim ke frontend
            reward.name = wonHerb;
        }

        // 4. Simpan ke Database
        await userRef.update(updates);

        return res.status(200).json({
            success: true,
            targetIndex: targetIndex, // Penting untuk animasi Frontend
            reward: reward,
            message: message,
            user: user, // Kirim data user terbaru (coins/cooldown)
            warehouse: updates['warehouse'] ? { ...userData.warehouse, ...updates['warehouse'] } : userData.warehouse
        });

    } catch (e) {
        console.error("Spin API Error:", e);
        return res.status(500).json({ error: "Server Error" });
    }
}
