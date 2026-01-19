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
        
        if (action === 'sell') {
            const currentQty = warehouse[itemName] || 0;
            const sellAmount = parseInt(amount);

            if (currentQty < sellAmount) return res.status(400).json({ error: "Stok tidak cukup!" });

            // Hitung Harga
            const cropConfig = (GameConfig.Crops && GameConfig.Crops[itemName]) ? GameConfig.Crops[itemName] : { sellPrice: 10 };
            let pricePerItem = cropConfig.sellPrice || 10;

            // Cek Bonus Plan
            const plan = (userData.user && userData.user.plan) ? userData.user.plan : 'FREE';
            let bonusMultiplier = 1;
            if (plan === 'MORTGAGE') bonusMultiplier = 1.05;
            if (plan === 'TENANT') bonusMultiplier = 1.15;
            if (plan === 'OWNER') bonusMultiplier = 1.30;

            const totalPrice = Math.floor(sellAmount * pricePerItem * bonusMultiplier);

            // Manual Math untuk Koin & Stok
            const currentCoins = userData.user.coins || 0;
            const newStock = currentQty - sellAmount;
            const newCoins = currentCoins + totalPrice;

            await userRef.set({
                warehouse: {
                    [itemName]: newStock
                },
                user: {
                    coins: newCoins
                }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount} ${itemName}`,
                earned: totalPrice,
                newStock: newStock
            });
        }
        return res.status(400).json({ error: "Unknown Action" });
    } catch (error) {
        return res.status(500).json({ error: "Server Error" });
    }
}
