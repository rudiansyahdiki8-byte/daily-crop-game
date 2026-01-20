import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js'; // Pastikan config ada
import admin from 'firebase-admin';

export default async function handler(req, res) {
    // 1. Cek Method
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, address, amount, currency } = req.body;
    const API_KEY = process.env.FAUCETPAY_API_KEY;

    // Cek API Key Server
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server Config Error: Missing FaucetPay API Key' });
    }

    // 2. VERIFIKASI USER (Security Layer 1)
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized: Invalid Login' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const withdrawRef = db.collection('withdrawals').doc(); 

    // Variabel untuk menyimpan status transaksi DB
    let transactionData = null;

    try {
        // --- TAHAP 1: VALIDASI & POTONG SALDO DI DATABASE ---
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            const currentBalance = userData.user.coins || 0;

            // Security Layer 2: Cek Saldo Real di Database
            if (currentBalance < amount) {
                throw new Error("Saldo tidak mencukupi (Server Check).");
            }

            // Security Layer 3: Cek Limit Minimum
            const hasHistory = userData.user.has_withdrawn || false;
            const minLimit = hasHistory 
                ? (GameConfig.Finance?.MinWdOld || 10000) 
                : (GameConfig.Finance?.MinWdNew || 5000);

            if (amount < minLimit) {
                throw new Error(`Minimum withdraw: ${minLimit} PTS`);
            }

            // Aksi: POTONG SALDO DULU (Hold)
            t.update(userRef, {
                "user.coins": admin.firestore.FieldValue.increment(-amount),
                "user.has_withdrawn": true,
                "user.last_active": Date.now()
            });

            // Catat status PROCESSING
            transactionData = {
                userId: userId,
                username: user.username || "Unknown",
                amountPTS: amount,
                currency: currency || "USDT",
                address: address,
                status: 'PROCESSING', // Sedang dikirim ke FaucetPay
                method: 'FaucetPay',
                createdAt: admin.firestore.Timestamp.now(),
                payout_id: null
            };
            
            t.set(withdrawRef, transactionData);
        });

        // --- TAHAP 2: KIRIM KE FAUCETPAY (INSTANT) ---
        // Kita eksekusi ini SETELAH saldo user dipotong (agar aman dari race condition)
        
        try {
            const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    api_key: API_KEY,
                    amount: amount,      // Pastikan konversi PTS ke Crypto sudah benar di Frontend
                    to: address,
                    currency: currency || "USDT",
                    referral: 'false'
                })
            });

            const fpData = await fpResponse.json();

            if (fpData.status === 200) {
                // --- SUKSES ---
                // Update status transaksi jadi COMPLETED
                await withdrawRef.update({
                    status: 'COMPLETED',
                    payout_id: fpData.payout_id,
                    completedAt: admin.firestore.Timestamp.now()
                });

                return res.json({ 
                    success: true, 
                    message: `Withdrawal Instant Success! ID: ${fpData.payout_id}` 
                });

            } else {
                // --- GAGAL DARI FAUCETPAY (Misal: Saldo Bandar Habis) ---
                throw new Error(fpData.message || "FaucetPay Error");
            }

        } catch (fpError) {
            // --- TAHAP 3: REFUND OTOMATIS JIKA GAGAL ---
            console.error("FaucetPay Failed, Refunding User...", fpError);

            // Kembalikan Saldo User
            await userRef.update({
                "user.coins": admin.firestore.FieldValue.increment(amount)
            });

            // Update status jadi FAILED
            await withdrawRef.update({
                status: 'FAILED',
                error_reason: fpError.message
            });

            return res.status(400).json({ 
                success: false, 
                message: `Withdraw Gagal: ${fpError.message}. Saldo telah dikembalikan.` 
            });
        }

    } catch (error) {
        console.error("System Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}
