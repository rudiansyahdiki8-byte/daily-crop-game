// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, action, itemName, amount } = req.body;

    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const warehouse = userData.warehouse || {};
        
        // === ACTION: SELL (JUAL ITEM) ===
        if (action === 'sell') {
            const currentQty = warehouse[itemName] || 0;
            const sellAmount = parseInt(amount);

            if (currentQty < sellAmount) {
                return res.status(400).json({ error: "Stok tidak cukup!" });
            }

            // 1. Hitung Harga
            // Ambil harga dasar dari Config (Default 10 jika error)
            const cropConfig = (GameConfig.Crops && GameConfig.Crops[itemName]) ? GameConfig.Crops[itemName] : { sellPrice: 10 };
            let pricePerItem = cropConfig.sellPrice || 10;

            // 2. Cek Bonus Plan (Membership)
            const plan = (userData.user && userData.user.plan) ? userData.user.plan : 'FREE';
            let bonusMultiplier = 1;
            if (plan === 'MORTGAGE') bonusMultiplier = 1.05; // +5%
            if (plan === 'TENANT') bonusMultiplier = 1.15;   // +15%
            if (plan === 'OWNER') bonusMultiplier = 1.30;    // +30%

            const totalPrice = Math.floor(sellAmount * pricePerItem * bonusMultiplier);

            // 3. Update Database (Atomic)
            // Kurangi stok, Tambah koin
            await userRef.set({
                warehouse: {
                    [itemName]: db.FieldValue.increment(-sellAmount)
                },
                user: {
                    coins: db.FieldValue.increment(totalPrice)
                }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount} ${itemName}`,
                earned: totalPrice,
                newStock: currentQty - sellAmount
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        console.error("Market API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
