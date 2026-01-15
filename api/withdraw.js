// api/withdraw.js
// SECURITY: MAXIMUM (Realtime Rate + Anti-Tuyul + Server-Side Balance Check)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore'; // Tambah FieldValue

// 1. INIT FIREBASE
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            initializeApp({ credential: cert(serviceAccount) });
        } catch (e) { console.error("Firebase Admin Error:", e); }
    }
}
const db = getFirestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    const { userId, address, amount, currency } = req.body;
    const cleanAddress = address ? address.trim().toLowerCase() : '';
    
    // Konversi amount ke integer agar aman
    const amountInt = parseInt(amount);

    // RATE DASAR: 1 PTS = Sekian USD
    const BASE_RATE_USD = 0.00001; 

    if (!userId || !amountInt || !currency || !cleanAddress) {
        return res.status(400).json({ success: false, message: 'Missing Data' });
    }

    try {
        // --- STEP 1: AMBIL DATA USER & CEK SALDO (WAJIB!) ---
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User Not Found' });

        const userData = userDoc.data();

        // [PENTING] Cek Saldo di Server
        // Jangan percaya data dari frontend!
        if (!userData.coins || userData.coins < amountInt) {
            return res.status(400).json({ success: false, message: 'Insufficient Funds on Server' });
        }

        // --- STEP 2: CEK HARGA REALTIME (CoinGecko) ---
        let cryptoPriceInUSD = 0;
        const COIN_IDS = { 'USDT': 'tether', 'TON': 'the-open-network', 'TRX': 'tron', 'LTC': 'litecoin', 'DOGE': 'dogecoin', 'SOL': 'solana', 'BTC': 'bitcoin' };
        const FALLBACK_RATES = { USDT: 1.0, TON: 5.0, TRX: 0.15, LTC: 70.0, DOGE: 0.10, SOL: 100.0, BTC: 65000.0 };

        try {
            const coinId = COIN_IDS[currency];
            const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const cgData = await cgRes.json();
            if (cgData[coinId]?.usd) cryptoPriceInUSD = cgData[coinId].usd;
            else throw new Error("Price Not Found");
        } catch (err) {
            console.warn("⚠️ CoinGecko Error, using fallback.");
            cryptoPriceInUSD = FALLBACK_RATES[currency] || 1000000;
        }

        // Hitung Crypto: (PTS * BaseRate) / HargaCrypto
        const totalValueUSD = amountInt * BASE_RATE_USD; 
        const rawCryptoAmount = totalValueUSD / cryptoPriceInUSD;
        const finalCryptoAmount = (rawCryptoAmount * 0.95).toFixed(8); // Potong 5% Spread

        // --- STEP 3: CEK SECURITY AKUN ---
        let targetAddress = cleanAddress;
        if (userData.faucetpay_email) {
            targetAddress = userData.faucetpay_email; // Paksa pakai email lama
        } else {
            const duplicateCheck = await db.collection('users').where('faucetpay_email', '==', cleanAddress).get();
            if (!duplicateCheck.empty) return res.status(403).json({ success: false, message: 'Email already used!' });
        }

        // --- STEP 4: EKSEKUSI FAUCETPAY ---
        const API_KEY = process.env.FAUCETPAY_API_KEY;
        const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,
                amount: finalCryptoAmount, 
                to: targetAddress,
                currency: currency, 
                referral: 'false'
            })
        });

        const fpData = await fpResponse.json();

        if (fpData.status === 200) {
            // BERHASIL KIRIM -> POTONG SALDO DI SERVER
            // Kita pakai FieldValue.increment(-amount) agar atomik & aman
            
            const updateData = {
                coins: FieldValue.increment(-amountInt), // Kurangi Saldo
                has_withdrawn: true
            };
            
            // Kunci email jika baru pertama
            if (!userData.faucetpay_email) {
                updateData.faucetpay_email = targetAddress;
            }

            await userRef.update(updateData);

            // Catat Log
            await db.collection('withdrawals').add({
                userId, payout_id: fpData.payout_id, amount_pts: amountInt, 
                amount_crypto: finalCryptoAmount, currency, status: 'success', date: new Date(),
                rate_used: cryptoPriceInUSD
            });

            return res.status(200).json({ success: true, payout_id: fpData.payout_id, message: 'Sent via FaucetPay' });
        } else {
            return res.status(400).json({ success: false, message: fpData.message });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
