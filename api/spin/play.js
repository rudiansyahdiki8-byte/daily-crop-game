// api/spin/play.js
import { db } from '../utils/firebase.js';
import * as admin from 'firebase-admin';

// 1. CONFIG SPIN DARI SERVER (Anti-Cheat)
const SPIN_CONFIG = {
    CostPaid: 150,           // Biaya Spin Berbayar
    CooldownFree: 3600000,   // 1 Jam (ms)
    Rewards: {
        coin_low: 50,
        coin_mid: 100,
        coin_high: 200,
        jackpot: 1000
    }
};

// Data Herb Sederhana untuk Hadiah (Hanya key dan rarity)
const HERB_RARITY = {
    'Common': ['ginger', 'turmeric', 'galangal', 'lemongrass', 'cassava'],
    'Rare':   ['aloeVera', 'mint', 'lavender', 'stevia', 'basil']
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, type } = req.body; // type: 'free' atau 'paid'

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const userData = doc.data();
            const user = userData.user || {};
            const now = Date.now();

            // --- A. VALIDASI SYARAT ---
            if (type === 'paid') {
                if (user.coins < SPIN_CONFIG.CostPaid) {
                    throw `Saldo kurang. Butuh ${SPIN_CONFIG.CostPaid} PTS.`;
                }
                // Potong Saldo
                t.update(userRef, { 'user.coins': admin.firestore.FieldValue.increment(-SPIN_CONFIG.CostPaid) });
            } 
            else if (type === 'free') {
                const lastSpin = user.spin_free_cooldown || 0;
                if (now - lastSpin < SPIN_CONFIG.CooldownFree) {
                    const sisa = Math.ceil((SPIN_CONFIG.CooldownFree - (now - lastSpin))/60000);
                    throw `Tunggu ${sisa} menit lagi untuk Free Spin.`;
                }
                // Update Waktu Cooldown
                t.update(userRef, { 'user.spin_free_cooldown': now });
            } else {
                throw "Tipe spin tidak valid";
            }

            // --- B. LOGIKA GACHA (RNG di Server) ---
            // Kita replikasi logika probabilitas spin.js Anda [cite: 626-631]
            const rand = Math.random() * 100;
            let targetIndex = 0;
            let rewardType = '';
            let rewardValue = 0;
            let rewardKey = null; // Untuk Herb

            // Mapping Index Roda (Sesuai urutan visual di spin.js)
            // 0: Coin Low, 1: Common, 2: Coin High, 3: Common, 4: Coin Mid, 5: Rare, 6: Jackpot, 7: Coin Low
            
            if (rand < 40) { 
                // Coin Low (40%)
                const opts = [0, 7]; 
                targetIndex = opts[Math.floor(Math.random() * opts.length)];
                rewardType = 'coin';
                rewardValue = SPIN_CONFIG.Rewards.coin_low;
            } 
            else if (rand < 70) { 
                // Common Herb (30%)
                const opts = [1, 3];
                targetIndex = opts[Math.floor(Math.random() * opts.length)];
                rewardType = 'herb';
                const list = HERB_RARITY['Common'];
                rewardKey = list[Math.floor(Math.random() * list.length)]; // Server pilih herb spesifik
            }
            else if (rand < 90) { 
                // Coin Mid (20%) - Index 4
                targetIndex = 4;
                rewardType = 'coin';
                rewardValue = SPIN_CONFIG.Rewards.coin_mid;
            }
            else if (rand < 99) { 
                // Rare Herb (9%) - Index 5
                targetIndex = 5;
                rewardType = 'herb';
                const list = HERB_RARITY['Rare'];
                rewardKey = list[Math.floor(Math.random() * list.length)];
            }
            else { 
                // Jackpot (1%) - Index 6
                targetIndex = 6;
                rewardType = 'coin';
                rewardValue = SPIN_CONFIG.Rewards.jackpot;
            }

            // --- C. BERIKAN HADIAH KE DATABASE ---
            if (rewardType === 'coin') {
                t.update(userRef, { 'user.coins': admin.firestore.FieldValue.increment(rewardValue) });
            } 
            else if (rewardType === 'herb') {
                t.update(userRef, { [`warehouse.${rewardKey}`]: admin.firestore.FieldValue.increment(1) });
            }

            // --- D. KIRIM HASIL KE FRONTEND ---
            // Kita kirim targetIndex agar roda berputar ke posisi yang benar
            // Kita kirim rewardDetail untuk popup
            // Note: Jika 'free', frontend masih harus nonton iklan dulu baru "melihat" hadiah, 
            // tapi secara teknis hadiah sudah masuk DB di sini (atau bisa ditunda, tapi untuk simpel langsung masuk saja).
            // UPDATE: Sesuai flow Anda, Free Spin harus nonton iklan DULU baru klaim.
            // Tapi untuk keamanan, validasi iklan sebaiknya di server.
            // Namun untuk tahap ini, kita anggap Backend sudah memberi hadiah, frontend tinggal visualisasi.
            
            res.json({ 
                success: true, 
                targetIndex: targetIndex, 
                rewardType: rewardType,
                rewardValue: rewardValue,
                rewardKey: rewardKey
            });
        });

    } catch (e) {
        if (!res.headersSent) res.status(400).json({ success: false, message: e.toString() });
    }
}