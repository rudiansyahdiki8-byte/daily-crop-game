// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js'; // Pastikan path ini benar

// Helper: Hitung Harga (Sama dengan Frontend)
function getPriceServer(cropKey) {
    // Pastikan config ada
    if (!GameConfig || !GameConfig.Crops) {
        console.error("CRITICAL: GameConfig.Crops missing!");
        return 10;
    }

    const crop = GameConfig.Crops[cropKey];
    if (!crop) {
        console.warn(`Price Warning: Crop ${cropKey} not found in Config. Defaulting to 10.`);
        return 10; // Ini penyebab harga jadi 10 jika nama salah
    }

    // Gunakan Waktu UTC agar harga sinkron global
    const now = new Date();
    const timeSeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate() + now.getUTCHours();
    
    const uniqueFactor = cropKey.length + (crop.time || 0);
    const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor)); 
    const range = crop.maxPrice - crop.minPrice;
    
    // Harga Dinamis
    return Math.floor(crop.minPrice + (range * randomFactor));
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId, action, itemKey, amount } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || { coins: 0 };
        const warehouse = userData.warehouse || {};

        // === JUAL (SELL) ===
        if (action === 'sell') {
            const currentStock = warehouse[itemKey] || 0;
            const sellAmount = parseInt(amount);

            if (currentStock < sellAmount) return res.status(400).json({ error: "Stok kurang" });

            // Hitung Harga Server
            let price = getPriceServer(itemKey);

            // Buff Trade Permit
            const activeBuffs = user.activeBuffs || {};
            if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) {
                price = Math.floor(price * 1.20);
            }

            const totalEarn = Math.floor(sellAmount * price);

            await userRef.update({
                [`warehouse.${itemKey}`]: currentStock - sellAmount,
                'user.coins': (user.coins || 0) + totalEarn,
                'user.totalSold': (user.totalSold || 0) + totalEarn
            });

            return res.status(200).json({ 
                success: true, 
                message: `Terjual ${sellAmount}x ${itemKey}`,
                earned: totalEarn,
                newCoins: (user.coins || 0) + totalEarn,
                newStock: currentStock - sellAmount
            });
        }
        
        // ... (Bagian BUY tetap sama, tidak saya tulis ulang agar hemat tempat) ...
        // Jika perlu bagian BUY, kabari saya. Fokus kita memperbaiki harga jual dulu.

    } catch (e) {
        console.error("Market Error:", e);
        return res.status(500).json({ error: "Server Error" });
    }
}
