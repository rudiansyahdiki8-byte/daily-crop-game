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

        // 1. VALIDASI & PEMBAYARAN
        if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            const cooldownTime = (GameConfig.Spin?.CooldownFree || 3600000); 
            
            // Cek Cooldown (Toleransi 5 detik)
            if (now < lastSpin + cooldownTime - 5000) {
                return res.status(400).json({ error: "Cooldown active!" });
            }
            // Update Cooldown
            await userRef.set({ user: { spin_free_cooldown: now } }, { merge: true });

        } else if (type === 'paid') {
            const cost = GameConfig.Spin?.CostPaid || 1000;
            if ((user.coins || 0) < cost) {
                return res.status(400).json({ error: "Not enough coins!" });
            }
            // Potong Koin
            await userRef.set({ user: { coins: db.FieldValue.increment(-cost) } }, { merge: true });
        } else {
            return res.status(400).json({ error: "Invalid Type" });
        }

        // 2. LOGIKA GACHA (Server Side)
        // Kita gunakan logika probabilitas yang sama dengan desain visual
        const rand = Math.random() * 100;
        let targetIndex = 0; 
        
        // Mapping Index Segmen (0-7)
        // 0:CoinLow, 1:Common, 2:CoinHigh, 3:Common, 4:CoinMid, 5:Rare, 6:Jackpot, 7:CoinLow
        if (rand < 40) { 
            // 40% Zonk/Low (Coin Low)
            const opts = [0, 7]; 
            targetIndex = opts[Math.floor(Math.random() * opts.length)]; 
        } 
        else if (rand < 70) { 
            // 30% Common Item
            const opts = [1, 3]; 
            targetIndex = opts[Math.floor(Math.random() * opts.length)]; 
        }
        else if (rand < 90) { 
            // 20% Coin Mid (Index 4)
            targetIndex = 4;
        }
        else if (rand < 99) { 
            // 9% Rare Item (Index 5) atau Coin High (Index 2)
            const opts = [2, 5];
            targetIndex = opts[Math.floor(Math.random() * opts.length)];
        }
        else { 
            // 1% Jackpot
            targetIndex = 6; 
        }

        // 3. TENTUKAN HADIAH
        let rewardType = 'coin';
        let rewardValue = 0;
        let rewardName = "";
        
        // Config Rewards
        const conf = GameConfig.Spin || {};
        const rewards = [
            { type: 'coin', val: conf.RewardCoinLow || 100 },      // 0
            { type: 'herb', rarity: 'Common' },                    // 1
            { type: 'coin', val: conf.RewardCoinHigh || 5000 },    // 2
            { type: 'herb', rarity: 'Common' },                    // 3
            { type: 'coin', val: conf.RewardCoinMid || 1000 },     // 4
            { type: 'herb', rarity: 'Rare' },                      // 5
            { type: 'coin', val: conf.Jackpot || 100000 },         // 6
            { type: 'coin', val: conf.RewardCoinLow || 100 }       // 7
        ];

        const selectedReward = rewards[targetIndex];

        if (selectedReward.type === 'coin') {
            rewardType = 'coin';
            rewardValue = selectedReward.val;
            rewardName = `${rewardValue} PTS`;
            
            // Simpan Hadiah Koin
            await userRef.set({ user: { coins: db.FieldValue.increment(rewardValue) } }, { merge: true });
        
        } else if (selectedReward.type === 'herb') {
            rewardType = 'herb';
            // Pilih tanaman random dari Config Crops
            const crops = GameConfig.Crops || {};
            // Filter crops (Simplifikasi: Ambil random apa saja karena server tidak tahu rarity di config sederhana)
            // Jika Anda ingin presisi, pastikan GameConfig.Crops punya field 'rarity'.
            // Disini kita ambil random key saja untuk keamanan.
            const keys = Object.keys(crops);
            const randomKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'ginger';
            
            rewardName = randomKey;
            
            // Simpan Hadiah Item
            await userRef.set({ 
                warehouse: { [randomKey]: db.FieldValue.increment(1) } 
            }, { merge: true });
        }

        // 4. RETURN HASIL
        // Kirim data terbaru user agar UI sinkron
        const updatedDoc = await userRef.get();
        const updatedData = updatedDoc.data();

        return res.status(200).json({ 
            success: true, 
            targetIndex: targetIndex, // Untuk animasi berhenti di mana
            reward: { type: rewardType, name: rewardName, value: rewardValue },
            userCoins: updatedData.user.coins,
            userCooldown: updatedData.user.spin_free_cooldown,
            warehouse: updatedData.warehouse
        });

    } catch (error) {
        console.error("Spin API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
