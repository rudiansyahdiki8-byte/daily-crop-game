// api/market/sell.js
const { db, admin } = require('../../lib/firebase');
const GameConfig = require('../../lib/gameRules');
const crypto = require('crypto');

// (Pastikan fungsi verifyTelegramWebAppData ada di sini atau di-import)
function verifyTelegramWebAppData(telegramInitData) { /* ...copy logic validasi... */ 
    // Untuk mempersingkat, asumsikan kode validasi sama seperti sebelumnya
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash !== hash) throw new Error("Invalid Hash");
    return JSON.parse(urlParams.get('user'));
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { initData, itemKey, amount, isSellAll } = req.body;
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;

        const userRef = db.collection('users').doc(userId);

        // TRANSAKSI DATABASE (Wajib agar saldo tidak bug saat request ganda)
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");
            const userData = doc.data();

            // 1. Validasi Gudang
            const warehouse = userData.warehouse || {};
            let totalRevenue = 0;
            let itemsSold = {}; // Untuk log

            if (isSellAll) {
                // Logic Jual Semua
                for (const [key, qty] of Object.entries(warehouse)) {
                    if (qty > 0) {
                        const pricePerUnit = getPriceServerSide(userData, key); 
                        totalRevenue += pricePerUnit * qty;
                        itemsSold[key] = qty;
                        warehouse[key] = 0; // Kosongkan
                    }
                }
            } else {
                // Logic Jual Satuan
                const currentQty = warehouse[itemKey] || 0;
                const qtyToSell = parseInt(amount);

                if (currentQty < qtyToSell) throw new Error(`Not enough ${itemKey}`);
                if (qtyToSell <= 0) throw new Error("Invalid amount");

                const pricePerUnit = getPriceServerSide(userData, itemKey);
                totalRevenue = pricePerUnit * qtyToSell;
                itemsSold[itemKey] = qtyToSell;
                warehouse[itemKey] -= qtyToSell;
            }

            // 2. Terapkan Multiplier (Booster/Buff)
            const multiplier = GameConfig.getSellMultiplier(userData);
            const finalRevenue = Math.floor(totalRevenue * multiplier);

            if (finalRevenue <= 0) throw new Error("No value to sell");

            // 3. Update Saldo User
            const newCoins = (userData.coins || 0) + finalRevenue;
            const newTotalSold = (userData.totalSold || 0) + finalRevenue;

            // 4. Update History Penjualan (Opsional, agar user lihat di UI)
            let history = userData.sales_history || [];
            history.unshift({
                items: itemsSold,
                total: finalRevenue,
                date: new Date().toISOString()
            });
            if(history.length > 10) history.pop();

            // 5. UPDATE DATA USER
            t.update(userRef, {
                coins: newCoins,
                totalSold: newTotalSold,
                warehouse: warehouse,
                sales_history: history,
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            });

            // --- 6. LOGIC AFFILIATE (LANGSUNG DI SERVER) ---
            if (userData.upline) {
                const commission = Math.floor(finalRevenue * 0.10); // 10%
                if (commission > 0) {
                    const uplineRef = db.collection('users').doc(userData.upline);
                    // Kita pakai t.update agar atomik
                    // Note: Kita tidak baca uplineRef dulu agar hemat read, langsung increment
                    t.update(uplineRef, {
                        coins: admin.firestore.FieldValue.increment(commission),
                        "affiliate.total_earnings": admin.firestore.FieldValue.increment(commission)
                    });
                }
            }

            return { newCoins, itemsSold, finalRevenue };
        });

        return res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error("Sell Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Helper untuk ambil harga (Harusnya ambil dari state market user)
function getPriceServerSide(user, itemKey) {
    // Jika user punya data market prices yang tersimpan (dari refreshMarketPrices)
    if (user.market && user.market.prices && user.market.prices[itemKey]) {
        return user.market.prices[itemKey];
    }
    // Fallback ke harga default/min jika error
    return GameConfig.Crops[itemKey] ? GameConfig.Crops[itemKey].minPrice : 10;
}