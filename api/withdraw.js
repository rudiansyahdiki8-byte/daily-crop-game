// api/withdraw.js
const { db, admin } = require('../lib/firebase'); // Pakai koneksi yang sudah kita buat
const crypto = require('crypto');

// --- Helper Validasi Telegram (Wajib ada untuk keamanan) ---
function verifyTelegramWebAppData(telegramInitData) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN belum disetting di Vercel");
    
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) throw new Error("Invalid Hash: Data tidak autentik!");
    return JSON.parse(urlParams.get('user'));
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    try {
        const { initData, address, amount, currency } = req.body;
        
        // 1. KEAMANAN: Ambil userId dari Telegram (BUKAN dari req.body)
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id; // Pastikan format ID sama dengan yang di database

        const cleanAddress = address ? address.trim().toLowerCase() : '';
        const amountInt = parseInt(amount);
        const BASE_RATE_USD = 0.00001; // Config harga Anda

        if (!amountInt || amountInt <= 0 || !cleanAddress) {
            throw new Error('Data tidak lengkap');
        }

        // 2. CEK SALDO & KUNCI (Deduct Balance First)
        // Kita potong saldo DULUAN dalam transaksi agar tidak bisa dispam (Race Condition Proof)
        const deductionResult = await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(userId);
            const userDoc = await t.get(userRef);

            if (!userDoc.exists) throw new Error('User not found');
            const userData = userDoc.data();

            // Cek Saldo Server
            if (!userData.coins || userData.coins < amountInt) {
                throw new Error('Saldo Server tidak cukup (Insufficient Funds)');
            }

            // Cek Binding Alamat (Anti-Cheat)
            if (userData.faucetpay_email && userData.faucetpay_email !== cleanAddress) {
                throw new Error(`Keamanan: Gunakan alamat yang terikat (${userData.faucetpay_email})`);
            }

            // Cek Email Duplikat (Jika user baru WD)
            if (!userData.faucetpay_email) {
                const dupCheck = await t.get(db.collection('users').where('faucetpay_email', '==', cleanAddress));
                if (!dupCheck.empty) throw new Error('Email FaucetPay ini sudah dipakai akun lain!');
            }

            // Potong Saldo
            const newBalance = userData.coins - amountInt;
            t.update(userRef, {
                coins: newBalance,
                has_withdrawn: true,
                faucetpay_email: cleanAddress, // Bind alamat
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            });

            return { userData, newBalance };
        });

        // --- MULAI PROSES EKSTERNAL (Di luar Transaksi DB) ---

        // 3. HITUNG RATE (Dari kode lama Anda)
        let cryptoPriceInUSD = 0;
        const COIN_IDS = { 'USDT': 'tether', 'TON': 'the-open-network', 'TRX': 'tron', 'LTC': 'litecoin', 'DOGE': 'dogecoin', 'SOL': 'solana', 'BTC': 'bitcoin' };
        const FALLBACK_RATES = { USDT: 1.0, TON: 5.0, TRX: 0.15, LTC: 70.0, DOGE: 0.10, SOL: 100.0, BTC: 65000.0 };

        try {
            const coinId = COIN_IDS[currency] || 'tether';
            // Gunakan fetch bawaan Node 18+
            const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const cgData = await cgRes.json();
            if (cgData[coinId]?.usd) cryptoPriceInUSD = cgData[coinId].usd;
            else throw new Error("Price Not Found");
        } catch (err) {
            console.warn("⚠️ CoinGecko Error, using fallback.");
            cryptoPriceInUSD = FALLBACK_RATES[currency] || 1.0;
        }

        const totalValueUSD = amountInt * BASE_RATE_USD; 
        const rawCryptoAmount = totalValueUSD / cryptoPriceInUSD;
        const finalCryptoAmount = (rawCryptoAmount * 0.95).toFixed(8); // Spread 5%

        // 4. KIRIM KE FAUCETPAY
        const API_KEY = process.env.FAUCETPAY_API_KEY; // Pastikan ada di ENV Vercel
        
        const params = new URLSearchParams();
        params.append('api_key', API_KEY);
        params.append('amount', finalCryptoAmount);
        params.append('to', cleanAddress);
        params.append('currency', currency);
        params.append('referral', 'false');

        const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            body: params
        });
        const fpData = await fpResponse.json();

        // 5. PENYELESAIAN
        if (fpData.status === 200) {
            // SUKSES: Catat Log
            await db.collection('withdrawals').add({
                userId,
                username: deductionResult.userData.username || "Unknown",
                payout_id: fpData.payout_id,
                amount_pts: amountInt,
                amount_crypto: finalCryptoAmount,
                currency,
                status: 'success',
                date: admin.firestore.FieldValue.serverTimestamp(),
                rate_used: cryptoPriceInUSD
            });

            return res.status(200).json({ 
                success: true, 
                message: 'Withdraw Success', 
                payout_id: fpData.payout_id,
                new_balance: deductionResult.newBalance
            });

        } else {
            // GAGAL: KEMBALIKAN SALDO (REFUND)
            // Karena sudah terpotong di awal, kita wajib balikin
            await db.collection('users').doc(userId).update({
                coins: admin.firestore.FieldValue.increment(amountInt)
            });

            return res.status(400).json({ 
                success: false, 
                message: 'FaucetPay Error: ' + fpData.message 
            });
        }

    } catch (error) {
        console.error("Withdraw Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};