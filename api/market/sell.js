import { db } from '../utils/firebase';
import { GameConfig } from '../config';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { userId, itemKey, qty } = req.body;

    if (!userId || !itemKey || !qty || qty <= 0) {
        return res.status(400).json({ success: false, error: 'Data transaksi tidak valid' });
    }

    // Ambil Data Config Tanaman (Min/Max Price)
    const cropConfig = GameConfig.Crops[itemKey];
    if (!cropConfig) {
        return res.status(400).json({ success: false, error: 'Item tidak dikenali' });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            
            if (!doc.exists) {
                throw new Error("User tidak ditemukan");
            }

            const userData = doc.data();
            const warehouse = userData.warehouse || {};
            const user = userData.user || {};
            const market = userData.market || { prices: {} };

            // 1. CEK STOK
            const currentQty = warehouse[itemKey] || 0;
            if (currentQty < qty) {
                throw new Error(`Stok tidak cukup! Punya: ${currentQty}, Mau Jual: ${qty}`);
            }

            // ============================================================
            // 2. PERBAIKAN HARGA (FLUKTUATIF & VALIDASI)
            // ============================================================
            
            // Ambil range harga resmi dari Config (misal: Ginger 20 - 50)
            const { minPrice, maxPrice } = cropConfig;

            // Ambil harga yang sedang tampil di layar user (dari DB)
            let currentMarketPrice = market.prices[itemKey];

            let basePrice;

            // LOGIKA PINTAR:
            // Cek apakah harga di DB valid? (Harus angka, dan ada di antara Min - Max)
            if (currentMarketPrice && currentMarketPrice >= minPrice && currentMarketPrice <= maxPrice) {
                // Jika valid, gunakan harga itu (agar sama dengan yang dilihat user)
                basePrice = currentMarketPrice;
            } else {
                // JIKA ERROR (Misal harganya 10, padahal minimal 20):
                // Server ambil alih! Generate harga acak baru (Fluktuatif)
                basePrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
                
                // (Opsional) Kita bisa simpan harga baru ini ke DB agar sinkron, 
                // tapi prioritas sekarang adalah hitung duit yang benar.
            }

            // ============================================================

            // 3. HITUNG BONUS (Multiplier)
            let multiplier = 1.0;
            const now = Date.now();

            if (user.adBoosterCooldown && user.adBoosterCooldown > now) multiplier += 0.20;
            if (user.activeBuffs && user.activeBuffs['sell_bonus'] > now) multiplier += 0.15;

            const plan = user.plan || 'FREE';
            if (plan === 'MORTGAGE') multiplier += 0.05;
            else if (plan === 'TENANT') multiplier += 0.15;
            else if (plan === 'OWNER') multiplier += 0.30;

            // 4. HITUNG TOTAL
            const finalPricePerUnit = Math.floor(basePrice * multiplier);
            const totalEarn = finalPricePerUnit * qty;

            // 5. UPDATE DATABASE
            let salesHistory = user.sales_history || [];
            salesHistory.unshift({
                item: cropConfig.name || itemKey, // Nama item dari Config (misal: "Ginger" bukan "ginger")
                qty: qty,
                price: totalEarn,
                date: new Date().toLocaleTimeString('en-US', { hour12: false })
            });
            if (salesHistory.length > 5) salesHistory.pop();

            t.update(userRef, {
                [`warehouse.${itemKey}`]: currentQty - qty,
                'user.coins': (user.coins || 0) + totalEarn,
                'user.totalSold': (user.totalSold || 0) + totalEarn,
                'user.sales_history': salesHistory
            });

            return { 
                success: true, 
                totalEarn: totalEarn, 
                newBalance: (user.coins || 0) + totalEarn,
                unitPrice: finalPricePerUnit, // Kirim info harga satuan buat debug
                soldItem: itemKey
            };
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("Sell Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
