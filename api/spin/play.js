import { db } from '../utils/firebase.js';

// CONFIG SPIN DARI config.js
const SpinConfig = {
    CostPaid: 150,
    CooldownFree: 3600000, // 1 Jam
    Rewards: {
        CoinLow: 50,
        CoinMid: 100,
        CoinHigh: 200,
        Jackpot: 1000
    }
};

// DEFINISI SEGMEN RODA (Harus urut sesuai visual di js/spin.js)
// Index 0-7 searah jarum jam
const Segments = [
    { id: 0, type: 'coin', val: SpinConfig.Rewards.CoinLow, label: 'Low Coin' },
    { id: 1, type: 'herb', rarity: 'Common', label: 'Common Herb' },
    { id: 2, type: 'coin', val: SpinConfig.Rewards.CoinHigh, label: 'High Coin' },
    { id: 3, type: 'herb', rarity: 'Common', label: 'Common Herb' },
    { id: 4, type: 'coin', val: SpinConfig.Rewards.CoinMid, label: 'Mid Coin' },
    { id: 5, type: 'herb', rarity: 'Rare', label: 'Rare Herb' },
    { id: 6, type: 'jackpot', val: SpinConfig.Rewards.Jackpot, label: 'JACKPOT' },
    { id: 7, type: 'coin', val: SpinConfig.Rewards.CoinLow, label: 'Low Coin' }
];

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, type } = req.body; // type: 'free' atau 'paid'

    if (!userId || !['free', 'paid'].includes(type)) {
        return res.status(400).json({ error: "Invalid Request" });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const data = doc.data();
            const user = data.user || {};
            const warehouse = data.warehouse || {};

            // 1. VALIDASI SYARAT (Server Side)
            const now = Date.now();
            
            if (type === 'paid') {
                if ((user.coins || 0) < SpinConfig.CostPaid) {
                    throw "Saldo tidak cukup!";
                }
                // Potong Saldo
                user.coins -= SpinConfig.CostPaid;
            } 
            else if (type === 'free') {
                const lastSpin = user.spin_free_cooldown || 0;
                if (now < (lastSpin + SpinConfig.CooldownFree)) {
                    throw "Sedang Cooldown!";
                }
                // Update Cooldown
                user.spin_free_cooldown = now;
            }

            // 2. LOGIKA RNG (Dulu di Frontend)
            // Kita pindah ke sini agar tidak bisa dicurangi
            const rand = Math.random() * 100;
            let targetIndex = 0;

            // Probabilitas (Server Authoritative)
            // 40% Low Coin, 30% Common, 20% Mid Coin, 9% Rare, 1% Jackpot
            if (rand < 40) { 
                const opts = [0, 4, 7]; 
                targetIndex = opts[Math.floor(Math.random() * opts.length)];
            } 
            else if (rand < 70) { 
                const opts = [1, 3]; 
                targetIndex = opts[Math.floor(Math.random() * opts.length)];
            } 
            else if (rand < 90) { targetIndex = 2; } // High Coin
            else if (rand < 99) { targetIndex = 5; } // Rare Herb
            else { targetIndex = 6; } // JACKPOT

            // 3. BERIKAN HADIAH KE DATABASE
            const prize = Segments[targetIndex];
            let rewardText = prize.label;

            if (prize.type === 'coin' || prize.type === 'jackpot') {
                user.coins = (user.coins || 0) + prize.val;
            } 
            else if (prize.type === 'herb') {
                // Pilih Herb Random sesuai Rarity (Logic dari spin.js)
                // Disini kita sederhanakan hardcode list, atau ambil random string
                const herbsCommon = ['ginger', 'turmeric', 'galangal', 'lemongrass'];
                const herbsRare = ['aloeVera', 'mint', 'lavender', 'basil'];
                
                let selectedHerb = 'ginger';
                if (prize.rarity === 'Rare') {
                    selectedHerb = herbsRare[Math.floor(Math.random() * herbsRare.length)];
                } else {
                    selectedHerb = herbsCommon[Math.floor(Math.random() * herbsCommon.length)];
                }

                warehouse[selectedHerb] = (warehouse[selectedHerb] || 0) + 1;
                rewardText = selectedHerb; // Kirim nama herb ke frontend
            }

            // 4. COMMIT TRANSAKSI
            t.update(userRef, {
                "user.coins": user.coins,
                "user.spin_free_cooldown": user.spin_free_cooldown,
                [`warehouse.${rewardText}`]: (warehouse[rewardText] || 0) // Jika herb
            });
            // Update Full Warehouse object jika herb (simplified for safety)
            if (prize.type === 'herb') {
                t.update(userRef, { warehouse: warehouse });
            }

            return { targetIndex, rewardText, newCoins: user.coins };
        });

        // Kirim Index ke Frontend agar roda berputar ke titik yang benar
        return res.status(200).json({ success: true, ...result });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.toString() });
    }
}
