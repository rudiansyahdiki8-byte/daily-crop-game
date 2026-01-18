// Buka api/market/sell.js dan GANTI isinya dengan yang ini:

import { db } from '../utils/firebase.js';

const CropConfig = {
    ginger: { minPrice: 20, maxPrice: 50 },
    turmeric: { minPrice: 20, maxPrice: 50 },
    galangal: { minPrice: 20, maxPrice: 50 },
    lemongrass: { minPrice: 20, maxPrice: 50 },
    cassava: { minPrice: 20, maxPrice: 50 },
    chili: { minPrice: 50, maxPrice: 70 },
    pepper: { minPrice: 50, maxPrice: 70 },
    onion: { minPrice: 50, maxPrice: 70 },
    garlic: { minPrice: 50, maxPrice: 70 },
    paprika: { minPrice: 50, maxPrice: 70 },
    aloeVera: { minPrice: 120, maxPrice: 250 },
    mint: { minPrice: 120, maxPrice: 250 },
    lavender: { minPrice: 120, maxPrice: 250 },
    stevia: { minPrice: 120, maxPrice: 250 },
    basil: { minPrice: 120, maxPrice: 250 },
    cinnamon: { minPrice: 400, maxPrice: 800 },
    nutmeg: { minPrice: 400, maxPrice: 800 },
    cardamom: { minPrice: 400, maxPrice: 800 },
    clove: { minPrice: 400, maxPrice: 800 },
    vanilla: { minPrice: 2000, maxPrice: 8000 },
    saffron: { minPrice: 2000, maxPrice: 8000 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, key, qty } = req.body; 

    if (!userId || !key || !qty || qty <= 0) {
        return res.status(400).json({ error: "Data transaksi tidak valid" });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User tidak ditemukan";

            const data = doc.data();
            const userData = data.user || {};
            const warehouse = data.warehouse || {};

            // 1. Cek Stok
            const currentStock = warehouse[key] || 0;
            if (currentStock < qty) throw "Stok di server tidak cukup!";

            // 2. Hitung Harga
            const itemConf = CropConfig[key];
            if (!itemConf) throw "Item tidak valid";
            
            const basePrice = Math.floor(Math.random() * (itemConf.maxPrice - itemConf.minPrice + 1)) + itemConf.minPrice;
            
            let multiplier = 1;
            const now = Date.now();
            if (userData.adBoosterCooldown > now) multiplier += 0.2;
            
            // Cek Buff Sell Bonus (Trade Permit)
            const activeBuffs = userData.activeBuffs || {};
            if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > now) multiplier += 0.15; // [cite: 62]

            const finalPrice = Math.floor(basePrice * multiplier);
            const totalEarn = finalPrice * qty;

            // 3. Update Data Penjual
            const newCoins = (userData.coins || 0) + totalEarn;
            const newTotalSold = (userData.totalSold || 0) + totalEarn;
            const newStock = currentStock - qty;
            
            let history = userData.sales_history || [];
            history.unshift({
                item: key,
                qty: qty,
                price: totalEarn,
                date: new Date().toLocaleTimeString('en-US', { hour12: false })
            });
            if (history.length > 10) history.pop();

            // --- LOGIKA AFFILIATE (BARU) ---
            // Cek apakah user punya upline dan ini penjualan pertama (Aktivasi)
            let updates = {
                [`warehouse.${key}`]: newStock,
                "user.coins": newCoins,
                "user.totalSold": newTotalSold,
                "user.sales_history": history
            };

            if (userData.referral_status === 'Pending') {
                updates["user.referral_status"] = 'Active';
            }

            // Jika punya Upline, beri komisi 10%
            if (userData.upline) {
                const uplineId = userData.upline;
                const uplineRef = db.collection('users').doc(uplineId);
                const uplineDoc = await t.get(uplineRef);

                if (uplineDoc.exists) {
                    const uplineData = uplineDoc.data().user || {};
                    const commission = Math.floor(totalEarn * 0.10); // 10%

                    if (commission > 0) {
                        // Update Koin Upline
                        t.update(uplineRef, {
                            "user.coins": (uplineData.coins || 0) + commission,
                            "user.affiliate.total_earnings": (uplineData.affiliate?.total_earnings || 0) + commission
                            // Note: Kita tidak update friends_list detail di sini agar hemat write operation,
                            // cukup total earnings saja.
                        });
                    }
                }
            }
            // -------------------------------

            t.update(userRef, updates);

            return { newCoins, newStock, totalEarn, history };
        });

        return res.status(200).json({ success: true, message: "Berhasil terjual" });

    } catch (error) {
        console.error("[API SELL ERROR]", error);
        return res.status(500).json({ success: false, error: error.toString() });
    }
}
