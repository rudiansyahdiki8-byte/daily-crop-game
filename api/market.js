// api/market.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Mapping efek item agar server tahu apa yang dibeli user
const ITEM_EFFECTS = {
    'land_2':       { type: 'land', id: 2 },
    'land_3':       { type: 'land', id: 3 },
    'storage_plus': { type: 'storage', amount: 20 },
    'speed_soil':   { type: 'buff', key: 'speed_soil', duration: 86400000 },
    'growth_fert':  { type: 'buff', key: 'growth_speed', duration: 86400000 },
    'trade_permit': { type: 'buff', key: 'sell_bonus', duration: 86400000 },
    'yield_boost':  { type: 'buff', key: 'yield_bonus', duration: 86400000 },
    'rare_boost':   { type: 'buff', key: 'rare_luck', duration: 86400000 }
};

// Helper: Hitung Harga Dinamis (Sama dengan Logic Frontend agar tidak bingung)
function getPriceServer(cropKey) {
    const crop = GameConfig.Crops[cropKey];
    if (!crop) return 10;

    const now = new Date();
    // Gunakan UTC agar sinkron untuk semua pemain di dunia
    const timeSeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate() + now.getUTCHours();
    
    const uniqueFactor = cropKey.length + (crop.time || 0);
    const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor)); 
    const range = crop.maxPrice - crop.minPrice;
    
    return Math.floor(crop.minPrice + (range * randomFactor));
}

export default async function handler(req, res) {
    // 1. Setup Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, action, itemKey, amount } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        // 2. Load Data User
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        const user = userData.user || { coins: 0 };
        const warehouse = userData.warehouse || {};

        // === ACTION: SELL (JUAL PANEN) ===
        if (action === 'sell') {
            const currentStock = warehouse[itemKey] || 0;
            const sellAmount = parseInt(amount);

            // Validasi Stok
            if (currentStock < sellAmount) {
                return res.status(400).json({ error: "Insufficient stock!" });
            }

            // A. Hitung Harga Server (Anti-Cheat Harga)
            let price = getPriceServer(itemKey);

            // B. Cek Buff Aktif (Trade Permit)
            // Jika user punya buff 'sell_bonus', harga naik 20%
            const activeBuffs = user.activeBuffs || {};
            if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) {
                price = Math.floor(price * 1.20);
            }

            // C. Bonus Plan Membership (VIP)
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

            // E. Kirim Respon ke Frontend
            return res.status(200).json({ 
                success: true, 
                message: `Sold ${sellAmount}x ${itemKey}`,
                earned: totalEarn,
                newCoins: (user.coins || 0) + totalEarn,
                newStock: currentStock - sellAmount
            });
        }

        // === ACTION: BUY (BELI DI SHOP) ===
        if (action === 'buy') {
            const shopItems = GameConfig.ShopItems || {};
            const cost = shopItems[itemKey];

            // Validasi Item & Saldo
            if (!cost) return res.status(400).json({ error: "Item not for sale" });
            if (user.coins < cost) return res.status(400).json({ error: "Insufficient coins!" });

            const effect = ITEM_EFFECTS[itemKey];
            if (!effect) return res.status(400).json({ error: "Item configuration missing" });

            // Siapkan Data Update
            let updateData = {
                user: { 
                    coins: db.FieldValue.increment(-cost),
                    totalSpent: db.FieldValue.increment(cost)
                }
            };

            // A. Logika Beli Lahan (Land)
            if (effect.type === 'land') {
                let plots = userData.farmPlots || [];
                // Cari lahan mana yang mau dibeli (ID 2 atau 3)
                const plotIndex = plots.findIndex(p => p.id === effect.id);
                
                if (plotIndex === -1) return res.status(400).json({ error: "Invalid Land ID" });
                if (plots[plotIndex].status !== 'locked') return res.status(400).json({ error: "Land already owned" });

                // Buka Lahan
                plots[plotIndex] = { ...plots[plotIndex], status: 'empty' };
                updateData.farmPlots = plots;
                updateData.user.landPurchasedCount = db.FieldValue.increment(1);
            }
            
            // B. Logika Beli Kapasitas Gudang
            else if (effect.type === 'storage') {
                updateData.user.extraStorage = db.FieldValue.increment(effect.amount);
            }

            // C. Logika Beli Buff (Penguat)
            else if (effect.type === 'buff') {
                const expiryTime = Date.now() + effect.duration;
                // Simpan waktu kadaluarsa buff
                updateData[`user.activeBuffs.${effect.key}`] = expiryTime;
            }

            // Eksekusi Update ke Database
            await userRef.update(updateData);
            
            // Ambil data terbaru agar UI sinkron
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
