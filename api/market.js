// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// --- DATABASE ITEM (Mapping Logic) ---
// Server perlu tahu efek dari setiap item, karena GameConfig hanya menyimpan harga.
const ITEM_EFFECTS = {
    // Lahan & Storage (Logic Khusus)
    'land_2':       { type: 'land', id: 2 },
    'land_3':       { type: 'land', id: 3 },
    'storage_plus': { type: 'storage', amount: 20 },

    // Buffs (Consumables) - Durasi 24 Jam (86400000 ms)
    'speed_soil':   { type: 'buff', key: 'speed_soil', duration: 86400000 },
    'growth_fert':  { type: 'buff', key: 'growth_speed', duration: 86400000 },
    'trade_permit': { type: 'buff', key: 'sell_bonus', duration: 86400000 },
    'yield_boost':  { type: 'buff', key: 'yield_bonus', duration: 86400000 },
    'rare_boost':   { type: 'buff', key: 'rare_luck', duration: 86400000 }
};

// --- RUMUS HARGA DINAMIS (SAMA PERSIS DENGAN STATE.JS) ---
function getPriceServer(cropKey) {
    const crop = GameConfig.Crops[cropKey];
    if (!crop) return 10;

    const now = new Date();
    // Gunakan UTC agar sinkron global
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

    const { userId, action, itemKey, amount } = req.body;
    if (!userId) return res.status(400).json({ error: "No User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || { coins: 0 };
        const warehouse = userData.warehouse || {};

        // ==========================================
        // 1. ACTION: SELL (JUAL HASIL PANEN)
        // ==========================================
        if (action === 'sell') {
            const currentStock = warehouse[itemKey] || 0;
            const sellAmount = parseInt(amount);

            if (currentStock < sellAmount) return res.status(400).json({ error: "Stok kurang!" });

            // A. Hitung Harga Dasar
            let price = getPriceServer(itemKey);
            
            // B. Cek Buff Aktif (Trade Permit)
            // Jika ada buff 'sell_bonus' yang masih aktif, harga +20%
            const activeBuffs = user.activeBuffs || {};
            if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) {
                price = Math.floor(price * 1.20); 
            }

            // C. Bonus Plan Membership
            let bonus = 1;
            if (user.plan === 'MORTGAGE') bonus = 1.05;
            if (user.plan === 'TENANT') bonus = 1.15;
            if (user.plan === 'OWNER') bonus = 1.30;

            const totalEarn = Math.floor(sellAmount * price * bonus);

            // D. Update Database
            await userRef.set({
                warehouse: { [itemKey]: db.FieldValue.increment(-sellAmount) },
                user: { 
                    coins: db.FieldValue.increment(totalEarn),
                    totalSold: db.FieldValue.increment(totalEarn)
                }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount} ${itemKey}`,
                earned: totalEarn,
                newCoins: (user.coins || 0) + totalEarn,
                newStock: currentStock - sellAmount
            });
        }

        // ==========================================
        // 2. ACTION: BUY (BELI ITEM SHOP)
        // ==========================================
        if (action === 'buy') {
            const shopItems = GameConfig.ShopItems || {};
            const cost = shopItems[itemKey];

            if (!cost) return res.status(400).json({ error: "Item tidak dijual" });
            if (user.coins < cost) return res.status(400).json({ error: "Koin tidak cukup" });

            // Logic Item berdasarkan ITEM_EFFECTS
            const effect = ITEM_EFFECTS[itemKey];
            if (!effect) return res.status(400).json({ error: "Item logic not found" });

            let updateData = {
                user: { 
                    coins: db.FieldValue.increment(-cost),
                    totalSpent: db.FieldValue.increment(cost) // Catat pengeluaran
                }
            };

            // A. Logic Beli Lahan
            if (effect.type === 'land') {
                let plots = userData.farmPlots || [];
                const plotIndex = plots.findIndex(p => p.id === effect.id);
                
                if (plotIndex === -1) return res.status(400).json({ error: "Lahan tidak valid" });
                if (plots[plotIndex].status !== 'locked') return res.status(400).json({ error: "Lahan sudah terbuka" });

                plots[plotIndex] = { ...plots[plotIndex], status: 'empty' };
                updateData.farmPlots = plots;
                updateData.user.landPurchasedCount = db.FieldValue.increment(1);
            }
            
            // B. Logic Beli Storage
            else if (effect.type === 'storage') {
                updateData.user.extraStorage = db.FieldValue.increment(effect.amount);
            }

            // C. Logic Beli Buff (Consumable)
            else if (effect.type === 'buff') {
                // Set waktu kadaluarsa: Sekarang + Durasi
                const expiryTime = Date.now() + effect.duration;
                
                // Update map activeBuffs
                // Perlu dot notation untuk update field nested di Firestore
                updateData[`user.activeBuffs.${effect.key}`] = expiryTime;
            }

            // Eksekusi Update
            await userRef.update(updateData);
            
            // Ambil data terbaru untuk update UI Client
            const finalDoc = await userRef.get();
            const finalData = finalDoc.data();

            return res.status(200).json({
                success: true,
                message: `Purchased ${itemKey}`,
                newCoins: finalData.user.coins,
                farmPlots: finalData.farmPlots,
                extraStorage: finalData.user.extraStorage,
                // Kirim balik activeBuffs agar UI tahu buff sudah aktif
                activeBuffs: finalData.user.activeBuffs 
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (e) {
        console.error("Market Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
