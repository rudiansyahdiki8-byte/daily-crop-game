// api/spin.js
import db from './db.js';

// Config Hardcoded di Server (Biar tidak perlu baca file lain)
const SPIN_CONFIG = {
    CostPaid: 150, 
    CooldownFree: 3600000,
    Rewards: [
        { type: 'coin', val: 50 },    // 0
        { type: 'herb', rarity: 'Common' }, // 1
        { type: 'coin', val: 1000 },  // 2
        { type: 'herb', rarity: 'Common' }, // 3
        { type: 'coin', val: 200 },   // 4
        { type: 'herb', rarity: 'Rare' },   // 5
        { type: 'coin', val: 10000 }, // 6
        { type: 'coin', val: 50 }     // 7
    ]
};

export default async function handler(req, res) {
    // Header CORS standar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Error' });

    const { userId, type } = req.body;
    if (!userId) return res.status(400).json({ error: "No User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        // Ambil data user & warehouse (Default object kosong jika null)
        const user = userData.user || { coins: 0 };
        const warehouse = userData.warehouse || {};
        const now = Date.now();

        // 1. CEK BAYAR / GRATIS
        if (type === 'paid') {
            if (user.coins < SPIN_CONFIG.CostPaid) {
                return res.status(400).json({ error: `Saldo kurang! Butuh ${SPIN_CONFIG.CostPaid} PTS` });
            }
            // Manual Math: Kurangi Koin di Memory Dulu
            user.coins -= SPIN_CONFIG.CostPaid;
        
        } else if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            if (now < lastSpin + SPIN_CONFIG.CooldownFree - 5000) {
                return res.status(400).json({ error: "Masih Cooldown!" });
            }
            // Update Cooldown
            user.spin_free_cooldown = now;
        }

        // 2. ACAK HADIAH
        const rand = Math.random() * 100;
        let idx = 0;
        if (rand < 40) idx = (Math.random() < 0.5) ? 0 : 7; 
        else if (rand < 70) idx = (Math.random() < 0.5) ? 1 : 3; 
        else if (rand < 90) idx = 4; 
        else if (rand < 99) idx = (Math.random() < 0.5) ? 2 : 5; 
        else idx = 6; 

        const reward = SPIN_CONFIG.Rewards[idx];
        let winData = { type: 'coin', name: '', val: 0 };

        // 3. TERAPKAN HADIAH (Manual Math)
        if (reward.type === 'coin') {
            winData.name = `${reward.val} PTS`;
            winData.val = reward.val;
            user.coins += reward.val; // Tambah koin manual
        } else {
            const herbName = 'ginger'; // Default item
            winData.type = 'herb';
            winData.name = herbName;
            
            // Tambah stok manual
            const currentStock = warehouse[herbName] || 0;
            warehouse[herbName] = currentStock + 1;
        }

        // 4. SIMPAN SEMUA KE DATABASE (Sekali Jalan)
        await userRef.set({ 
            user: user,
            warehouse: warehouse
        }, { merge: true });

        // 5. KIRIM HASIL KE HP
        return res.status(200).json({
            success: true,
            targetIndex: idx,
            reward: winData,
            userCoins: user.coins,
            warehouse: warehouse,
            userCooldown: user.spin_free_cooldown
        });

    } catch (e) {
        console.error("Spin Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
