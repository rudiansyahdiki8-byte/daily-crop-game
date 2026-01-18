// api/plan/upgrade.js
import { db } from '../utils/firebase.js'; // Sesuaikan path ke firebase.js Anda
import * as admin from 'firebase-admin';

// CONFIG HARGA DARI SERVER (Agar user tidak bisa edit harga di config.js browser)
// [cite: 55] Mengambil harga dari config.js Anda
const PLAN_CONFIG = {
    'MORTGAGE': { priceUsdt: 20, rank: 2 },
    'TENANT':   { priceUsdt: 30, rank: 3 },
    'OWNER':    { priceUsdt: 50, rank: 4 }
};

// RATE KONVERSI [cite: 59] (1 USDT = 100.000 PTS jika rate 0.00001)
const RATE_USDT = 0.00001; 

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, targetPlan } = req.body;
    
    if (!userId || !PLAN_CONFIG[targetPlan]) {
        return res.status(400).json({ success: false, message: 'Plan tidak valid' });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const userData = doc.data();
            const user = userData.user;

            // 1. CEK APAKAH SUDAH PUNYA PLAN LEBIH TINGGI
            const currentPlan = user.plan || 'FREE';
            // Mapping rank manual karena server tidak baca state.js
            const ranks = { 'FREE': 1, 'MORTGAGE': 2, 'TENANT': 3, 'OWNER': 4 };
            
            if (ranks[currentPlan] >= ranks[targetPlan]) {
                throw "Anda sudah memiliki level ini atau lebih tinggi.";
            }

            // 2. HITUNG HARGA DALAM KOIN (PTS)
            // Logic: Harga USDT / Rate = Harga Koin
            const costUsdt = PLAN_CONFIG[targetPlan].priceUsdt;
            const costCoins = costUsdt / RATE_USDT;

            if (user.coins < costCoins) {
                throw `Saldo kurang. Butuh ${costCoins.toLocaleString()} PTS (${costUsdt} USDT).`;
            }

            // 3. EKSEKUSI PEMBELIAN
            t.update(userRef, {
                'user.coins': admin.firestore.FieldValue.increment(-costCoins),
                'user.plan': targetPlan,
                'user.totalSpent': admin.firestore.FieldValue.increment(costCoins) // Catat pengeluaran
            });
        });

        return res.status(200).json({ success: true, message: `Upgrade ke ${targetPlan} berhasil!` });

    } catch (error) {
        return res.status(400).json({ success: false, message: error.toString() });
    }
}