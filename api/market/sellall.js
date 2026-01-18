// api/market/sellall.js
import { db } from '../../utils/firebase.js'; // Perhatikan path ../..
import * as admin from 'firebase-admin';

// Copy SERVER_PRICES seperti di file sell.js (Wajib ada untuk validasi)
const SERVER_PRICES = { 
    ginger: { min: 20, max: 50 }, 
    // ... (Salin semua list harga agar lengkap)
    saffron: { min: 2000, max: 8000 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const data = doc.data();
            const warehouse = data.warehouse || {};
            const user = data.user || {};
            
            let totalRevenue = 0;
            let updates = {};

            // Cek Booster
            const isBoosterActive = (user.adBoosterCooldown || 0) > Date.now();
            const multiplier = isBoosterActive ? 1.2 : 1.0;

            // Loop semua isi gudang
            Object.keys(warehouse).forEach(key => {
                const qty = warehouse[key];
                if (qty > 0 && SERVER_PRICES[key]) {
                    // Kita ambil harga rata-rata atau harga Max agar user senang
                    // Karena Sell All sifatnya "Liquidate", kita pakai harga Max * Multiplier
                    const pricePerUnit = Math.floor(SERVER_PRICES[key].max * multiplier);
                    const itemTotal = pricePerUnit * qty;
                    
                    totalRevenue += itemTotal;
                    
                    // Kosongkan Stok
                    updates[`warehouse.${key}`] = 0;
                }
            });

            if (totalRevenue === 0) throw "Gudang kosong atau tidak bernilai.";

            // Update Saldo User
            updates['user.coins'] = admin.firestore.FieldValue.increment(totalRevenue);
            updates['user.totalSold'] = admin.firestore.FieldValue.increment(totalRevenue);
            
            if (user.referral_status === 'Pending') updates['user.referral_status'] = 'Active';

            t.update(userRef, updates);

            // Komisi Affiliate (10%)
            const uplineId = user.upline;
            if (uplineId) {
                const commission = Math.floor(totalRevenue * 0.10);
                if (commission > 0) {
                    const uplineRef = db.collection('users').doc(uplineId);
                    t.update(uplineRef, {
                        'user.affiliate.total_earnings': admin.firestore.FieldValue.increment(commission),
                        'user.coins': admin.firestore.FieldValue.increment(commission)
                    });
                }
            }
            
            // Kirim total agar frontend bisa update visual
            res.locals = { totalRevenue }; 
        });

        // Karena transaction tidak bisa return value langsung keluar function handler
        // Kita hitung ulang estimasi untuk response (atau user akan terima update via refresh)
        return res.json({ success: true, message: "Semua aset terjual!" });

    } catch (e) {
        if (!res.headersSent) res.status(400).json({ success: false, message: e.toString() });
    }
}