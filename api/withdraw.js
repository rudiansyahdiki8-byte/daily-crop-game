// api/withdraw.js
// SECURITY: ULTIMATE (Realtime Server-Side Pricing + Anti-Tuyul)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

    // --- CONFIG DASAR (HARUS SAMA DENGAN CONFIG GAME) ---
    // 1 PTS = Sekian USD (Ini patokan nilai game Anda)
    // Sesuai config.js baris 133 Anda
    const BASE_RATE_USD = 0.00001; 

    if (!userId || !amount || !currency || !cleanAddress) {
        return res.status(400).json({ success: false, message: 'Missing Data' });
    }

    try {
        // --- STEP 1: AMBIL HARGA REALTIME (SERVER SIDE) ---
        // Kita tanya CoinGecko harga crypto detik ini
        let cryptoPriceInUSD = 0;
        
        // Mapping ID CoinGecko
        const COIN_IDS = {
            'USDT': 'tether', 'TON': 'the-open-network', 'TRX': 'tron',
            'LTC': 'litecoin', 'DOGE': 'dogecoin', 'SOL': 'solana', 'BTC': 'bitcoin'
        };

        // Fallback Rates (Jaga-jaga kalau CoinGecko Error/Down)
        const FALLBACK_RATES = {
            USDT: 1.0, TON: 5.0, TRX: 0.15, LTC: 70.0, DOGE: 0.10, SOL: 100.0, BTC: 65000.0
        };

        try {
            const coinId = COIN_IDS[currency];
            const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const cgData = await cgRes.json();
            
            if (cgData[coinId] && cgData[coinId].usd) {
                cryptoPriceInUSD = cgData[coinId].usd;
            } else {
                throw new Error("Price Not Found");
            }
        } catch (err) {
            console.warn("⚠️ CoinGecko Error, using fallback:", err.message);
            cryptoPriceInUSD = FALLBACK_RATES[currency] || 1000000; // Harga default aman
        }

        // --- STEP 2: KONVERSI PTS KE CRYPTO ---
        // Rumus: (Jumlah PTS * Harga 1 PTS) / Harga Crypto Sekarang
        const totalValueUSD = amount * BASE_RATE_USD; 
        const rawCryptoAmount = totalValueUSD / cryptoPriceInUSD;
        
        // Potong 5% (Safety Margin / Spread / Fee Admin) agar aman dari fluktuasi
        const finalCryptoAmount = (rawCryptoAmount * 0.95).toFixed(8);

        // --- STEP 3: CEK DATABASE USER (LOCKING) ---
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User Not Found' });

        const userData = userDoc.data();
        let targetAddress = cleanAddress;

        if (userData.faucetpay_email) {
            targetAddress = userData.faucetpay_email; // Paksa pakai email lama
        } else {
            // Cek Duplikat
            const duplicateCheck = await db.collection('users').where('faucetpay_email', '==', cleanAddress).get();
            if (!duplicateCheck.empty) return res.status(403).json({ success: false, message: 'Email already used!' });
        }

        // --- STEP 4: KIRIM KE FAUCETPAY ---
        const API_KEY = process.env.FAUCETPAY_API_KEY;
        const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,
                amount: finalCryptoAmount, 
                to: targetAddress,
                currency: currency, // Otomatis handle TON, USDT, dll
                referral: 'false'
            })
        });

        const fpData = await fpResponse.json();

        if (fpData.status === 200) {
            if (!userData.faucetpay_email) {
                await userRef.update({ faucetpay_email: targetAddress, has_withdrawn: true });
            }
            // Catat Log
            await db.collection('withdrawals').add({
                userId, payout_id: fpData.payout_id, amount_pts: amount, 
                amount_crypto: finalCryptoAmount, currency, status: 'success', date: new Date(),
                rate_used: cryptoPriceInUSD // Kita catat rate saat itu buat bukti
            });

            return res.status(200).json({ success: true, payout_id: fpData.payout_id, message: 'Sent via FaucetPay' });
        } else {
            return res.status(400).json({ success: false, message: fpData.message });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
