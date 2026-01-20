import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, itemKey, qty, isSellAll } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User data not found");

            const userData = doc.data();
            // [LOGIC ANTI-HANTU] Copy data warehouse untuk dilacak status terbarunya
            const warehouse = userData.warehouse || {}; 
            
            let totalRevenue = 0;
            let itemsToSell = {};

            // --- LOGIKA MULTIPLIER ---
            let multiplier = 1.0;
            if (userData.user.adBoosterCooldown > Date.now()) multiplier += 0.2;
            if (userData.user.activeBuffs?.sell_bonus > Date.now()) multiplier += 0.15;

            // --- PILIHAN: JUAL SATU ATAU JUAL SEMUA ---
            if (isSellAll) {
                itemsToSell = { ...warehouse }; // Copy semua item
            } else {
                // Cek stok server (Penyebab Error 400 jika tidak sinkron)
                if ((warehouse[itemKey] || 0) < qty) throw new Error("Insufficient stock");
                itemsToSell[itemKey] = qty;
            }

            const salesHistoryEntries = [];
            
            // --- PROSES LOOP ITEM ---
            for (const [key, amount] of Object.entries(itemsToSell)) {
                if (amount <= 0) continue;
                
                const cropCfg = GameConfig.Crops[key];
                if (!cropCfg) continue; // Skip jika item tidak valid di config

                // Hitung Harga Random sesuai Range Config
                const basePrice = Math.floor(Math.random() * (cropCfg.maxPrice - cropCfg.minPrice + 1)) + cropCfg.minPrice;
                const finalPricePerUnit = Math.floor(basePrice * multiplier);
                const subTotal = finalPricePerUnit * amount;

                totalRevenue += subTotal;

                // [RESTORED] Catat Riwayat Transaksi
                salesHistoryEntries.push({
                    item: key,
                    qty: amount,
                    price: subTotal,
                    date: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    isIncome: true
                });

                // Update Database (Decrement Stok)
                t.update(userRef, {
                    [`warehouse.${key}`]: admin.firestore.FieldValue.increment(-amount)
                });

                // [LOGIC ANTI-HANTU] Update variabel lokal untuk dikirim balik ke frontend
                // Ini memastikan frontend tahu persis sisa stok tanpa perlu menebak
                warehouse[key] = (warehouse[key] || 0) - amount;
                if (warehouse[key] <= 0) delete warehouse[key];
            }

            if (totalRevenue <= 0) throw new Error("No assets to liquidate");

            // --- [RESTORED] UPDATE SALDO & HISTORY USER ---
            // Ambil 10 riwayat terakhir + yang baru
            const newHistory = [...salesHistoryEntries, ...(userData.user.sales_history || [])].slice(0, 10);
            
            t.update(userRef, {
                "user.coins": admin.firestore.FieldValue.increment(totalRevenue),
                "user.totalSold": admin.firestore.FieldValue.increment(totalRevenue),
                "user.sales_history": newHistory
            });

            // --- [RESTORED] KOMISI AFILIASI 10% ---
            if (userData.user.upline) {
                const commission = Math.floor(totalRevenue * 0.10);
                const uplineRef = db.collection('users').doc(userData.user.upline);
                
                // Gunakan ignore error di logic upline kalau dokumen tidak ada (opsional), 
                // tapi standard-nya update langsung:
                t.update(uplineRef, {
                    "user.coins": admin.firestore.FieldValue.increment(commission),
                    "user.affiliate.total_earnings": admin.firestore.FieldValue.increment(commission)
                });
            }

            // Return data lengkap agar Frontend bisa sinkronisasi total
            return { 
                success: true, 
                earned: totalRevenue, 
                multiplier: multiplier.toFixed(2),
                updatedWarehouse: warehouse // [KUNCI] Ini yang akan membersihkan hantu di frontend
            };
        });

        return res.json(result);

    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
}
