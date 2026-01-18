import { db } from '../utils/firebase.js';

[cite_start]// Salin Config Harga dari config.js [cite: 459-460]
const ShopPrices = {
    land_2: 10000,
    land_3: 750000,
    storage_plus: 5000,
    speed_soil: 500,
    growth_fert: 1000,
    trade_permit: 2000,
    yield_boost: 2500,
    rare_boost: 3000
};

// Mapping Item ID ke Nama Buff Key (Sesuai market.js Anda)
const BuffMapping = {
    speed_soil: 'speed_soil',
    growth_fert: 'growth_speed',
    trade_permit: 'sell_bonus',
    yield_boost: 'yield_bonus',
    rare_boost: 'rare_luck'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, itemId } = req.body; // itemId contoh: 'land_2', 'speed_soil'

    if (!userId || !itemId) return res.status(400).json({ error: "Data tidak lengkap" });

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const data = doc.data();
            const user = data.user || {};
            
            // 1. Cek Harga (Server Side)
            // Kita gunakan ID item untuk mencari harga di config server
            // Hati-hati: ID di market.js Anda kadang beda dengan key config.
            // Di market.js: id='land_2', price=Window.GameConfig...LandPrice_2
            // Kita mapping manual sederhana di sini berdasarkan ID yang dikirim frontend.
            
            let price = ShopPrices[itemId];
            if (!price) throw "Item tidak valid atau tidak dijual";

            // 2. Cek Saldo
            if (user.coins < price) throw "Saldo PTS tidak cukup!";

            // 3. Proses Pembelian Sesuai Tipe Item
            const updates = { "user.coins": user.coins - price };

            // Logic Item: LAND
            if (itemId === 'land_2' || itemId === 'land_3') {
                const currentLands = user.landPurchasedCount || 0;
                // Validasi urutan beli tanah
                if (itemId === 'land_2' && currentLands >= 1) throw "Sudah punya Land #2";
                if (itemId === 'land_3' && currentLands < 1) throw "Beli Land #2 dulu!";
                
                updates["user.landPurchasedCount"] = currentLands + 1;
            }
            // Logic Item: STORAGE
            else if (itemId === 'storage_plus') {
                updates["user.extraStorage"] = (user.extraStorage || 0) + 20;
            }
            // Logic Item: BUFF
            else if (BuffMapping[itemId]) {
                const buffKey = BuffMapping[itemId];
                const activeBuffs = user.activeBuffs || {};
                // Tambah 24 jam dari sekarang
                activeBuffs[buffKey] = Date.now() + 86400000;
                updates["user.activeBuffs"] = activeBuffs;
            }

            // Catat History Pembelian (Opsional, agar rapi di history.js)
            let buyHistory = user.buy_history || [];
            buyHistory.unshift({
                item: itemId,
                price: price,
                date: new Date().toLocaleTimeString()
            });
            if (buyHistory.length > 10) buyHistory.pop();
            updates["user.buy_history"] = buyHistory;

            t.update(userRef, updates);
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.toString() });
    }
}
