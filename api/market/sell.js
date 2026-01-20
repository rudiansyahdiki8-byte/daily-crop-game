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
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User data not found");

            const userData = doc.data();
            const serverNow = Date.now();
            let totalRevenue = 0;
            let itemsToSell = {};

            // --- LOGIKA MULTIPLIER (Trade Permit & Ad Booster) ---
            let multiplier = 1.0;
            // Cek Ad Booster (+20%) 
            if (userData.user.adBoosterCooldown > serverNow) multiplier += 0.2;
            // Cek Trade Permit / Sell Bonus (+15%) 
            if (userData.user.activeBuffs?.sell_bonus > serverNow) multiplier += 0.15;

            // --- PILIHAN: JUAL SATU ATAU JUAL SEMUA ---
            if (isSellAll) {
                itemsToSell = userData.warehouse || {};
            } else {
                if ((userData.warehouse[itemKey] || 0) < qty) throw new Error("Insufficient stock");
                itemsToSell[itemKey] = qty;
            }

            const salesHistoryEntries = [];

            for (const [key, amount] of Object.entries(itemsToSell)) {
                if (amount <= 0) continue;
                
                // Ambil harga dari server config [cite: 630]
                const cropCfg = GameConfig.Crops[key];
                const basePrice = Math.floor(Math.random() * (cropCfg.maxPrice - cropCfg.minPrice + 1)) + cropCfg.minPrice;
                const finalPricePerUnit = Math.floor(basePrice * multiplier);
                const subTotal = finalPricePerUnit * amount;

                totalRevenue += subTotal;

                // Siapkan data history 
                salesHistoryEntries.push({
                    item: key,
                    qty: amount,
                    price: subTotal,
                    date: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    isIncome: true
                });

                // Kurangi stok di warehouse
                t.update(userRef, {
                    [`warehouse.${key}`]: admin.firestore.FieldValue.increment(-amount)
                });
            }

            if (totalRevenue <= 0) throw new Error("No assets to liquidate");

            // --- UPDATE SALDO & STATISTIK ---
            const newHistory = [...salesHistoryEntries, ...(userData.user.sales_history || [])].slice(0, 10);
            
            t.update(userRef, {
                "user.coins": admin.firestore.FieldValue.increment(totalRevenue),
                "user.totalSold": admin.firestore.FieldValue.increment(totalRevenue),
                "user.sales_history": newHistory
            });

            // --- KOMISI AFILIASI 10%  ---
            if (userData.user.upline) {
                const commission = Math.floor(totalRevenue * 0.10);
                const uplineRef = db.collection('users').doc(userData.user.upline);
                t.update(uplineRef, {
                    "user.coins": admin.firestore.FieldValue.increment(commission),
                    "user.affiliate.total_earnings": admin.firestore.FieldValue.increment(commission)
                });
            }

            res.status(200).json({ 
                success: true, 
                earned: totalRevenue, 
                multiplier: multiplier.toFixed(2) 
            });
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}