// api/shop/buy.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, itemId } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User data not found");

            const userData = doc.data();
            const shopConfig = GameConfig.ShopItems;
            
            // Mapping ID item ke harga di Config [cite: 573]
            const items = {
                'land_2': { price: shopConfig.LandPrice_2, type: 'land', tier: 1 },
                'land_3': { price: shopConfig.LandPrice_3, type: 'land', tier: 2 },
                'storage_plus': { price: shopConfig.StoragePlus, type: 'storage' },
                'speed_soil': { price: shopConfig.BuffSpeed, type: 'buff', key: 'speed_soil' },
                'growth_fert': { price: shopConfig.BuffGrowth, type: 'buff', key: 'growth_speed' },
                'trade_permit': { price: shopConfig.BuffTrade, type: 'buff', key: 'sell_bonus' },
                'yield_boost': { price: shopConfig.BuffYield, type: 'buff', key: 'yield_bonus' },
                'rare_boost': { price: shopConfig.BuffRare, type: 'buff', key: 'rare_luck' }
            };

            const selectedItem = items[itemId];
            if (!selectedItem) throw new Error("Invalid item ID");

            // Validasi Saldo
            if (userData.user.coins < selectedItem.price) {
                throw new Error("Insufficient funds");
            }

            // Eksekusi Logika Berdasarkan Tipe Item [cite: 236, 237]
            const updates = {
                "user.coins": admin.firestore.FieldValue.increment(-selectedItem.price),
                "user.totalSpent": admin.firestore.FieldValue.increment(selectedItem.price)
            };

            if (selectedItem.type === 'land') {
                updates["user.landPurchasedCount"] = admin.firestore.FieldValue.increment(1);
            } else if (selectedItem.type === 'storage') {
                updates["user.extraStorage"] = admin.firestore.FieldValue.increment(20);
            } else if (selectedItem.type === 'buff') {
                const expiry = Date.now() + 86400000; // 24 jam [cite: 237]
                updates[`user.activeBuffs.${selectedItem.key}`] = expiry;
            }

            t.update(userRef, updates);
            res.status(200).json({ success: true, newBalance: userData.user.coins - selectedItem.price });
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}