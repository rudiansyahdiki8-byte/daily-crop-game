// api/spin.js
const { db, verifyUser } = require('../lib/firebase');
const { GameConfig } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId, type } = req.body; // type: 'free' atau 'paid'
    if (!userId || !type) return res.status(400).json({ message: 'Data missing' });

    try {
        const { ref, data } = await verifyUser(userId);
        const spinConfig = GameConfig.Spin;
        const now = Date.now();
        const updates = {};

        // 1. VALIDASI SYARAT SPIN
        if (type === 'free') {
            const lastSpin = data.user.spin_free_cooldown || 0;
            if (now - lastSpin < spinConfig.CooldownFree) {
                return res.status(400).json({ success: false, message: 'Free Spin masih cooldown!' });
            }
            updates["user.spin_free_cooldown"] = now;
        } 
        else if (type === 'paid') {
            if ((data.user.coins || 0) < spinConfig.CostPaid) {
                return res.status(400).json({ success: false, message: 'Koin tidak cukup!' });
            }
            updates["user.coins"] = FieldValue.increment(-spinConfig.CostPaid);
        }

        // 2. SERVER SIDE RNG (ALGORITMA GACHA AMAN)
        // Kita replikasi logika probabilitas dari kode lama Anda agar adil
        const rand = Math.random() * 100;
        let targetIndex = 0;
        let rewardType = 'coin';
        let rewardValue = 0;
        let rewardKey = null; // Nama tanaman jika dapat herb

        // Logika Hadiah (Sesuai kode lama Anda):
        // 0: Coin Low, 1: Herb Common, 2: Coin High, 3: Herb Common
        // 4: Coin Mid, 5: Herb Rare, 6: Jackpot, 7: Coin Low

        if (rand < 40) { 
            // 40% Coin Low/Mid
            const opts = [0, 4, 7];
            targetIndex = opts[Math.floor(Math.random() * opts.length)];
            if (targetIndex === 4) rewardValue = spinConfig.RewardCoinMid;
            else rewardValue = spinConfig.RewardCoinLow;
        } 
        else if (rand < 70) { 
            // 30% Common Herb
            const opts = [1, 3];
            targetIndex = opts[Math.floor(Math.random() * opts.length)];
            rewardType = 'herb';
            rewardKey = getRandomHerb('Common');
        }
        else if (rand < 90) { 
            // 20% Coin High
            targetIndex = 2;
            rewardValue = spinConfig.RewardCoinHigh;
        }
        else if (rand < 99) { 
            // 9% Rare Herb
            targetIndex = 5;
            rewardType = 'herb';
            rewardKey = getRandomHerb('Rare');
        }
        else { 
            // 1% Jackpot
            targetIndex = 6;
            rewardType = 'jackpot';
            rewardValue = spinConfig.Jackpot;
        }

        // 3. UPDATE HADIAH KE DB
        if (rewardType === 'coin' || rewardType === 'jackpot') {
            // Jika tadi paid, coins sudah dikurangi di atas (updates["user.coins"])
            // Kita tambah rewardnya sekarang.
            // Firestore support multiple increments on same field? Sebaiknya kita hitung net-nya.
            if (type === 'paid') {
                const netChange = rewardValue - spinConfig.CostPaid;
                updates["user.coins"] = FieldValue.increment(netChange);
            } else {
                updates["user.coins"] = FieldValue.increment(rewardValue);
            }
        } 
        else if (rewardType === 'herb' && rewardKey) {
            updates[`warehouse.${rewardKey}`] = FieldValue.increment(1);
        }

        await ref.update(updates);

        // 4. KIRIM HASIL KE CLIENT
        // Client butuh 'targetIndex' untuk animasi roda berhenti di posisi yang benar
        return res.status(200).json({
            success: true,
            targetIndex: targetIndex,
            rewardType: rewardType,
            rewardValue: rewardValue,
            rewardKey: rewardKey,
            rewardName: getHerbName(rewardKey) // Helper nama tanaman
        });

    } catch (error) {
        console.error("Spin Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- HELPER FUNCTION (PRIVATE) ---

function getRandomHerb(rarityTarget) {
    const candidates = [];
    for (const k in GameConfig.Crops) {
        // Logika sederhana: mapping manual rarity berdasarkan harga/chance
        // Atau kita pakai data Crops.chance untuk menentukan rarity
        const crop = GameConfig.Crops[k];
        let r = 'Common';
        if (crop.chance <= 0.1) r = 'Legendary';
        else if (crop.chance <= 0.5) r = 'Epic';
        else if (crop.chance <= 2.0) r = 'Rare';
        else if (crop.chance <= 6.0) r = 'Uncommon';
        
        if (r === rarityTarget || (rarityTarget === 'Common' && r === 'Uncommon')) {
            candidates.push(k);
        }
    }
    if (candidates.length === 0) return 'ginger';
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function getHerbName(key) {
    // Karena kita tidak punya daftar nama lengkap di backend (hanya key), 
    // kita kirim key saja, nanti frontend mapping ke nama asli.
    if (!key) return "Prize";
    return key.charAt(0).toUpperCase() + key.slice(1);
}