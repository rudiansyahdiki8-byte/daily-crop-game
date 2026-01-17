// api/sell.js
const { db, verifyUser } = require('../lib/firebase');
const { getCropData } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId, itemId, amount, clientPrice } = req.body;
    
    // Validasi input dasar
    if (!userId || !itemId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Data invalid' });
    }

    try {
        const { ref, data } = await verifyUser(userId);

        // 1. Cek Stok Gudang Server (Wajib!)
        const currentStock = data.warehouse?.[itemId] || 0;
        if (currentStock < amount) {
            return res.status(400).json({ success: false, message: 'Stok barang tidak cukup!' });
        }

        // 2. Validasi Harga (Anti-Cheat Harga)
        const cropConfig = getCropData(itemId);
        if (!cropConfig) return res.status(400).json({ message: 'Item tidak valid' });

        // Kita ambil harga dari database user (karena market refresh tersimpan di sana)
        // TAPI kita pastikan harganya masuk akal sesuai Config Min/Max
        let validPrice = data.market?.prices?.[itemId] || cropConfig.minPrice;

        // Jika harga yang dikirim client beda jauh dengan data server/config, tolak/koreksi
        if (clientPrice && clientPrice !== validPrice) {
            // Opsional: Kita bisa menolak, atau memaksa pakai harga server
            // Di sini kita paksa pakai harga yang ada di database server
        }

        // Cek Range Aman (Double Protection)
        // Jika harga di database dimanipulasi hack, kita punya batas atas di game-config.js
        if (validPrice > cropConfig.maxPrice * 1.5) { // Toleransi buff 50%
             validPrice = cropConfig.maxPrice; 
        }

        // 3. Hitung Total & Multiplier
        let multiplier = 1;
        // Cek Buff Server Side
        const now = Date.now();
        const buffs = data.user.activeBuffs || {};
        
        if (buffs['sell_bonus'] && buffs['sell_bonus'] > now) multiplier += 0.15; // +15%
        // User booster iklan (adBoosterCooldown) juga bisa dicek di sini jika disimpan di DB
        if ((data.user.adBoosterCooldown || 0) > now) multiplier += 0.2; // +20%

        const totalEarn = Math.floor(validPrice * multiplier) * amount;

        // 4. Update Database
        const updates = {
            [`warehouse.${itemId}`]: FieldValue.increment(-amount), // Kurangi Stok
            "user.coins": FieldValue.increment(totalEarn),          // Tambah Uang
            "user.totalSold": FieldValue.increment(totalEarn)
        };

        // Log Transaksi (Opsional, agar HistorySystem jalan)
        const newTx = {
            item: cropConfig.name || itemId,
            qty: amount,
            price: totalEarn,
            date: new Date().toLocaleTimeString()
        };
        // Menambah ke array sales_history (menggunakan arrayUnion mungkin tidak urut, 
        // tapi untuk simpelnya kita update manual array di client, di server kita update stat saja)
        
        await ref.update(updates);

        // 5. Cek Affiliate (Komisi Upline) - Server Side
        if (data.user.upline) {
            const commission = Math.floor(totalEarn * 0.10); // 10%
            if (commission > 0) {
                const uplineRef = db.collection('users').doc(data.user.upline);
                // Kita gunakan try-catch agar error affiliate tidak membatalkan penjualan
                try {
                    await uplineRef.update({
                        "user.coins": FieldValue.increment(commission),
                        "user.affiliate.total_earnings": FieldValue.increment(commission)
                    });
                } catch (e) {
                    console.log("Affiliate update error (ignore):", e.message);
                }
            }
        }

        return res.status(200).json({ 
            success: true, 
            totalEarn: totalEarn,
            newStock: currentStock - amount,
            newCoins: (data.user.coins || 0) + totalEarn
        });

    } catch (error) {
        console.error("Sell Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};