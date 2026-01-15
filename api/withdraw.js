// api/withdraw.js
// SECURITY LEVEL: HIGH (All Currencies including TON via FaucetPay)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. KONFIGURASI FIREBASE ADMIN
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("❌ Firebase Admin Init Error:", e);
        }
    } else {
        console.error("❌ FIREBASE_SERVICE_ACCOUNT missing in Vercel Envs!");
    }
}

const db = getFirestore();

export default async function handler(req, res) {
    // A. Validasi Metode
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    // B. Ambil Data
    const { userId, address, amount, currency } = req.body;
    
    // Sanitasi input
    const cleanAddress = address ? address.trim().toLowerCase() : '';

    // C. Konfigurasi Rate (HARUS SAMA DENGAN CONFIG GAME)
    const RATES = {
        USDT: 0.00001,
        TON:  0.000002, // Pastikan rate ini sesuai ekonomi game Anda
        TRX:  0.00006, 
        LTC:  0.0000001,
        DOGE: 0.00003,
        SOL:  0.00000005,
        BTC:  0.0000000001
    };

    if (!userId || !amount || !currency || !cleanAddress) {
        return res.status(400).json({ success: false, message: 'Missing Data' });
    }

    try {
        // --- STEP 1: HITUNG JUMLAH CRYPTO (SERVER SIDE) ---
        const rate = RATES[currency] || 0;
        if (rate === 0) return res.status(400).json({ success: false, message: 'Invalid Currency' });
        
        // Safety Margin: Potong 5% (Spread)
        const rawCrypto = amount * rate;
        const finalCryptoAmount = (rawCrypto * 0.95).toFixed(8);

        // --- STEP 2: CEK DATABASE USER (LOCKING SYSTEM) ---
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User Not Found' });
        }

        const userData = userDoc.data();
        let targetAddress = cleanAddress;

        // ATURAN 1: KUNCI AKUN (Locking)
        if (userData.faucetpay_email) {
            targetAddress = userData.faucetpay_email;
            // Abaikan jika user input alamat beda, paksa ke alamat terdaftar
        } 
        // ATURAN 2: CEK DUPLIKAT (Anti-Multi Account)
        else {
            const duplicateCheck = await db.collection('users')
                .where('faucetpay_email', '==', cleanAddress)
                .get();
            
            if (!duplicateCheck.empty) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Email FaucetPay ini sudah digunakan akun lain! 1 Akun = 1 Email.' 
                });
            }
        }

        // --- STEP 3: PROSES PENGIRIMAN KE FAUCETPAY (SEMUA KOIN) ---
        
        const API_KEY = process.env.FAUCETPAY_API_KEY;
        if (!API_KEY) return res.status(500).json({ success: false, message: 'Server Config Missing' });

        // Kirim Request ke FaucetPay
        const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,
                amount: finalCryptoAmount, // Jumlah Crypto Asli
                to: targetAddress,         // Alamat Tujuan
                currency: currency,        // TON, USDT, TRX, dll (Otomatis detect)
                referral: 'false'
            })
        });

        const fpData = await fpResponse.json();

        // --- STEP 4: PENANGANAN HASIL ---
        if (fpData.status === 200) {
            // BERHASIL DIKIRIM
            
            // Kunci email user jika ini withdraw pertama
            if (!userData.faucetpay_email) {
                await userRef.update({ 
                    faucetpay_email: targetAddress,
                    has_withdrawn: true
                });
            }

            // Catat Log Transaksi
            await db.collection('withdrawals').add({
                userId,
                payout_id: fpData.payout_id,
                amount_pts: amount,
                amount_crypto: finalCryptoAmount,
                currency: currency,
                status: 'success',
                date: new Date()
            });

            return res.status(200).json({
                success: true,
                payout_id: fpData.payout_id,
                message: 'Sent via FaucetPay'
            });

        } else {
            // GAGAL DARI FAUCETPAY (Misal: Saldo Admin Kurang)
            // Jangan kunci email dulu kalau gagal, biar user bisa coba lagi
            return res.status(400).json({
                success: false,
                message: fpData.message // Pesan error asli dari FaucetPay
            });
        }

    } catch (error) {
        console.error("Withdraw Error:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', details: error.message });
    }
}
