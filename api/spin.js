import db from './db.js';

// Config di Server (Harus sama dengan frontend)
const SPIN_CONFIG = {
    CostPaid: 150, 
    CooldownFree: 3600000,
    Rewards: [
        { type: 'coin', val: 50 },    // 0: Low
        { type: 'herb', rarity: 'Common' }, // 1: Herb
        { type: 'coin', val: 1000 },  // 2: High
        { type: 'herb', rarity: 'Common' }, // 3: Herb
        { type: 'coin', val: 200 },   // 4: Mid
        { type: 'herb', rarity: 'Rare' },   // 5: Rare
        { type: 'coin', val: 10000 }, // 6: Jackpot
        { type: 'coin', val: 50 }     // 7: Low
    ]
};

export default async function handler(req, res) {
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
        const user = userData.user || { coins: 0 };
        const now = Date.now();

        // 1. CEK BAYAR / GRATIS
        if (type === 'paid') {
            if (user.coins < SPIN_CONFIG.CostPaid) {
                return res.status(400).json({ error: `Saldo kurang! Butuh ${SPIN_CONFIG.CostPaid} PTS` });
            }
            // Potong Saldo (Server Side)
            await userRef.set({ 
                user: { coins: db.FieldValue.increment(-SPIN_CONFIG.CostPaid) } 
            }, { merge: true });
        
        } else if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            if (now < lastSpin + SPIN_CONFIG.CooldownFree - 5000) {
                return res.status(400).json({ error: "Masih Cooldown!" });
            }
            // Reset Timer
            await userRef.set({ 
                user: { spin_free_cooldown: now } 
            }, { merge: true });
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

        if (reward.type === 'coin') {
            winData.name = `${reward.val} PTS`;
            winData.val = reward.val;
            await userRef.set({ user: { coins: db.FieldValue.increment(reward.val) } }, { merge: true });
        } else {
            // Random Herb Fallback
            winData.type = 'herb';
            winData.name = 'ginger'; // Default jika random gagal
            await userRef.set({ warehouse: { ['ginger']: db.FieldValue.increment(1) } }, { merge: true });
        }

        // 3. KIRIM HASIL
        const finalDoc = await userRef.get();
        return res.status(200).json({
            success: true,
            targetIndex: idx,
            reward: winData,
            userCoins: finalDoc.data().user.coins,
            warehouse: finalDoc.data().warehouse
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
