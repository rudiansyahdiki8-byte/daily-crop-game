// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// --- COPY RUMUS DARI STATE.JS AGAR SINKRON ---
function getPriceServer(cropKey) {
    const crop = GameConfig.Crops[cropKey];
    if (!crop) return 10;

    const now = new Date();
    // PENTING: Gunakan UTC (Waktu Universal) agar sinkron seluruh dunia
    // Server Vercel biasanya pakai UTC.
    const timeSeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate() + now.getUTCHours();
    
    const uniqueFactor = cropKey.length + (crop.time || 0);
    const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor)); 

    const range = crop.maxPrice - crop.minPrice;
    return Math.floor(crop.minPrice + (range * randomFactor));
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Error' });

    const { userId, action, itemName, amount } = req.body;
    if (!userId) return res.status(400).json({ error: "No User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const warehouse = userData.warehouse || {};
        const user = userData.user || { coins: 0 };

        if (action === 'sell') {
            const currentStock = warehouse[itemName] || 0;
            const sellAmount = parseInt(amount);

            if (currentStock < sellAmount) {
                return res.status(400).json({ error: "Stok tidak cukup!" });
            }

            // === HARGA LIVE (REALTIME) ===
            // Kita panggil fungsi harga dinamis di sini
            const pricePerItem = getPriceServer(itemName);

            // Bonus Member (Plan)
            const plan = user.plan || 'FREE';
            let bonus = 1;
            if (plan === 'MORTGAGE') bonus = 1.05;
            if (plan === 'TENANT') bonus = 1.15;
            if (plan === 'OWNER') bonus = 1.30;

            const totalPrice = Math.floor(sellAmount * pricePerItem * bonus);

            // Transaksi (Manual Math agar aman)
            const newStock = currentStock - sellAmount;
            const newCoins = (user.coins || 0) + totalPrice;

            // Catat History Penjualan
            const historyEntry = {
                type: 'sell',
                item: itemName,
                amount: sellAmount,
                price: pricePerItem,
                total: totalPrice,
                date: new Date().toISOString()
            };
            // Batasi history 20 terakhir
            let history = user.history || [];
            history.unshift(historyEntry);
            if(history.length > 20) history.pop();

            await userRef.set({
                warehouse: { [itemName]: newStock },
                user: { 
                    coins: newCoins,
                    totalSold: (user.totalSold || 0) + totalPrice,
                    history: history
                }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount} ${itemName} for ${totalPrice}`,
                earned: totalPrice,
                newStock: newStock,
                newCoins: newCoins
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
