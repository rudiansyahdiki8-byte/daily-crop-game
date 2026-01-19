// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// MAPPING EFEK ITEM (Sesuai ShopItems di js/config.js)
const ITEM_EFFECTS = {
    // Land (Upgrade Lahan)
    'LandPrice_2':  { type: 'land', id: 2 },
    'LandPrice_3':  { type: 'land', id: 3 },
    
    // Storage (Upgrade Gudang)
    'StoragePlus':  { type: 'storage', amount: 50 }, // Tambah 50 slot
    
    // Buffs (Penguat) - Durasi 24 Jam (86400000 ms)
    'BuffSpeed':    { type: 'buff', key: 'speed_soil', duration: 86400000 },
    'BuffGrowth':   { type: 'buff', key: 'growth_speed', duration: 86400000 },
    'BuffTrade':    { type: 'buff', key: 'sell_bonus', duration: 86400000 },
    'BuffYield':    { type: 'buff', key: 'yield_bonus', duration: 86400000 },
    'BuffRare':     { type: 'buff', key: 'rare_luck', duration: 86400000 }
};

// Helper: Hitung Harga Jual Dinamis (Server Side)
function getPriceServer(cropKey) {
    const crop = GameConfig.Crops[cropKey];
    if (!crop) return 10; // Harga default aman

    // Gunakan UTC Time agar sinkron
    const now = new Date();
    const timeSeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate() + now.getUTCHours();
    
    // Rumus Fluktuasi Harga (Sinus)
    const uniqueFactor = cropKey.length + (crop.time || 0);
    const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor)); 
    const range = crop.maxPrice - crop.minPrice;
    
    return Math.floor(crop.minPrice + (range * randomFactor));
}

export default async function handler(req, res) {
    // 1. Setup Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, action, itemKey, amount } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || { coins: 0 };
        const warehouse = userData.warehouse || {};

        // === ACTION: SELL (JUAL HASIL PANEN) ===
        if (action === 'sell') {
            const currentStock = warehouse[itemKey] || 0;
            const sellAmount = parseInt(amount);

            // Validasi Stok
            if (currentStock < sellAmount) {
                return res.status(400).json({ error: "Insufficient stock!" });
            }

            // A. Hitung Harga Dasar
            let price = getPriceServer(itemKey);

            // B. Cek Buff 'Trade Permit' (BuffTrade)
            const activeBuffs = user.activeBuffs || {};
            if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) {
                price = Math.floor(price * 1.20); // Bonus 20%
            }

            // C. Cek Bonus Plan Membership
            let planBonus = 1;
            if (user.plan === 'MORTGAGE') planBonus = 1.05; // +5%
            if (user.plan === 'TENANT') planBonus = 1.15;   // +15%
            if (user.plan === 'OWNER') planBonus = 1.30;    // +30%

            // Total Pendapatan
            const totalEarn = Math.floor(sellAmount * price * planBonus);

            // Update Database
            await userRef.set({
                warehouse: { [itemKey]: (currentStock - sellAmount) }, // Kurangi Stok
                user: { 
                    coins: (user.coins || 0) + totalEarn,
                    totalSold: (user.totalSold || 0) + totalEarn
                }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount}x ${itemKey}`,
                earned: totalEarn,
                newCoins: (user.coins || 0) + totalEarn,
                newStock: currentStock - sellAmount
            });
        }

        // === ACTION: BUY (BELI ITEM SHOP) ===
        if (action === 'buy') {
            // Ambil harga dari Config
            const shopItems = GameConfig.ShopItems || {};
            const cost = shopItems[itemKey];

            if (!cost) return res.status(400).json({ error: "Item not found" });
            if (user.coins < cost) return res.status(400).json({ error: "Insufficient coins!" });

            const effect = ITEM_EFFECTS[itemKey];
            if (!effect) return res.status(400).json({ error: "Item logic missing" });

            // Siapkan Data Update
            let updateData = {
                'user.coins': (user.coins || 0) - cost,
                'user.totalSpent': (user.totalSpent || 0) + cost
            };

            // 1. Logika Beli Lahan
            if (effect.type === 'land') {
                let plots = userData.farmPlots || [];
                // Cari lahan dengan ID yang sesuai (2 atau 3)
                const targetIdx = plots.findIndex(p => p.id === effect.id);
                
                if (targetIdx === -1) return res.status(400).json({ error: "Land ID not found" });
                if (plots[targetIdx].status !== 'locked') return res.status(400).json({ error: "Already owned!" });

                // Unlock Lahan
                plots[targetIdx].status = 'empty';
                updateData.farmPlots = plots;
                updateData['user.landPurchasedCount'] = (user.landPurchasedCount || 0) + 1;
            }
            
            // 2. Logika Beli Storage
            else if (effect.type === 'storage') {
                updateData['user.extraStorage'] = (user.extraStorage || 0) + effect.amount;
            }

            // 3. Logika Beli Buff
            else if (effect.type === 'buff') {
                const expiry = Date.now() + effect.duration;
                updateData[`user.activeBuffs.${effect.key}`] = expiry;
            }

            // Eksekusi Update
            await userRef.update(updateData);
            
            // Ambil Data Terbaru untuk Frontend
            const finalDoc = await userRef.get();
            const finalData = finalDoc.data();

            return res.status(200).json({
                success: true,
                message: `Purchased ${itemKey}`,
                newCoins: finalData.user.coins,
                farmPlots: finalData.farmPlots,
                extraStorage: finalData.user.extraStorage,
                activeBuffs: finalData.user.activeBuffs 
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (e) {
        console.error("Market Error:", e);
        return res.status(500).json({ error: "Server Error" });
    }
}
