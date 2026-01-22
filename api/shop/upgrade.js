// api/shop/upgrade.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { PlanConfig } from '../_utils/config.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, targetPlan } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const userData = doc.data();
            
            const currentPlan = userData.user.plan || 'FREE';
            const currentLevel = PlanConfig.Tiers[currentPlan].level;
            const targetData = PlanConfig.Tiers[targetPlan];

            // 1. Validasi Urutan Upgrade (Harus naik 1 tingkat)
            if (targetData.level !== currentLevel + 1) {
                throw new Error("Peningkatan harus dilakukan secara berurutan!");
            }

            // 2. Kalkulasi Harga dalam PTS
            const priceInPts = targetData.price * PlanConfig.ConversionRate;

            // 3. Validasi Saldo
            if (userData.user.coins < priceInPts) {
                throw new Error("Saldo PTS tidak cukup untuk upgrade ini.");
            }

            // 4. Update Plan & Potong Saldo
            t.update(userRef, {
                "user.plan": targetPlan,
                "user.coins": admin.firestore.FieldValue.increment(-priceInPts),
                "user.totalSpent": admin.firestore.FieldValue.increment(priceInPts)
            });

            res.status(200).json({ success: true, newPlan: targetPlan });
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}