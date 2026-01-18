// api/market/buy.js
import { db } from '../utils/firebase.js';
import * as admin from 'firebase-admin';

// CONFIG HARGA SERVER (Copy dari config.js Anda)
const SHOP_ITEMS = {
    'land_2':       { price: 10000, type: 'land', tier: 1 },
    'land_3':       { price: 750000, type: 'land', tier: 2 },
    'storage_plus': { price: 5000, type: 'storage', amount: 20 },
    'speed_soil':   { price: 500, type: 'buff', key: 'speed_soil', duration: 86400000 },
    'growth_fert':  { price: 1000, type: 'buff', key: 'growth_speed', duration: 86400000 },
    'trade_permit': { price: 2000, type: 'buff', key: 'sell_bonus', duration: 86400000 },
    'yield_boost':  { price: 2500, type: 'buff', key: 'yield_bonus', duration: 86400000 },
    'rare_boost':   { price: 3000, type: 'buff', key: 'rare_luck', duration: 86400000 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, itemId } = req.body;

    if (!SHOP_ITEMS[itemId]) {
        return res.status(400).json({ success: false, message: 'Item tidak ditemukan' });
    }

    const item = SHOP_ITEMS[itemId];

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const data = doc.data();
            const user = data.user || {};

            // 1. CEK SALDO
            if (user.coins < item.price) {
                throw `Saldo kurang. Butuh ${item.price} PTS.`;
            }

            // 2. VALIDASI KHUSUS (LAND)
            if (item.type === 'land') {
                const purchased = user.landPurchasedCount || 0;
                // Land 2 butuh 0 purchased (karena dia pembelian pertama), Land 3 butuh 1 purchased
                // Logic simpel: Tidak boleh beli Land 3 kalau belum beli Land 2
                if (item.tier === 2 && purchased < 1) throw "Beli Tanah #2 dulu sebelum Tanah #3";
                if (item.tier === 1 && purchased >= 1) throw "Sudah memiliki Tanah #2";
                if (item.tier === 2 && purchased >= 2) throw "Sudah memiliki Tanah #3";
            }
            
            // 3. VALIDASI KHUSUS (BUFF)
            if (item.type === 'buff') {
                const activeBuffs = user.activeBuffs || {};
                const now = Date.now();
                if (activeBuffs[item.key] && activeBuffs[item.key] > now) {
                    throw "Buff ini masih aktif!";
                }
            }

            // 4. UPDATE DATABASE
            const updates = {
                'user.coins': admin.firestore.FieldValue.increment(-item.price),
                'user.totalSpent': admin.firestore.FieldValue.increment(item.price)
            };

            if (item.type === 'land') {
                updates['user.landPurchasedCount'] = admin.firestore.FieldValue.increment(1);
            } else if (item.type === 'storage') {
                updates['user.extraStorage'] = admin.firestore.FieldValue.increment(item.amount);
            } else if (item.type === 'buff') {
                const now = Date.now();
                updates[`user.activeBuffs.${item.key}`] = now + item.duration;
            }

            t.update(userRef, updates);
        });

        return res.json({ success: true, message: `Berhasil membeli item!` });

    } catch (e) {
        if (!res.headersSent) res.status(400).json({ success: false, message: e.toString() });
    }
}