// api/withdraw.js
const { db, verifyUser } = require('../lib/firebase');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    // 1. Cek Metode Request
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, address, amount, currency } = req.body;
    
    // Bersihkan input address
    const cleanAddress = address ? address.trim().toLowerCase() : '';
    const amountInt = parseInt(amount);

    // Rate Dasar: 1 PTS = $0.00001 (Sesuaikan dengan Config Anda)
    // Server harus punya nilai ini agar user tidak bisa mengubahnya dari browser
    const BASE_RATE_USD = 0.00001; 

    // Validasi Input
    if (!userId || !amountInt || !currency || !cleanAddress) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    try {
        // 2. Ambil Data User & Cek Saldo (Server Side)
        const { ref, data } = await verifyUser(userId);

        if (!data.user.coins || data.user.coins < amountInt) {
            return res.status(400).json({ success: false, message: 'Saldo server tidak cukup!' });
        }

        // 3. Cek Harga Realtime (Server Side - Anti Manipulasi Harga)
        let cryptoPriceInUSD = 0;
        
        // Mapping Simbol ke ID CoinGecko
        const COIN_IDS = { 
            'USDT': 'tether', 
            'TON': 'the-open-network', 
            'TRX': 'tron', 
            'LTC': 'litecoin', 
            'DOGE': 'dogecoin' 
        };
        
        // Fallback Rate (Jika CoinGecko Down)
        const FALLBACK_RATES = { USDT: 1.0, TON: 5.0, TRX: 0.15, LTC: 70.0, DOGE: 0.10 };

        try {
            const coinId = COIN_IDS[currency];
            // Fetch ke CoinGecko dari Server Vercel
            const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const cgData = await cgRes.json();
            
            if (cgData[coinId]?.usd) {
                cryptoPriceInUSD = cgData[coinId].usd;
            } else {
                throw new Error("Price Not Found");
            }
        } catch (err) {
            console.warn("⚠️ CoinGecko Error (Server), using fallback:", err.message);
            cryptoPriceInUSD = FALLBACK_RATES[currency] || 1000000;
        }

        // 4. Hitung Jumlah Crypto yang Akan Dikirim
        // Rumus: (Total Nilai USD) / (Harga Crypto per USD)
        const totalValueUSD = amountInt * BASE_RATE_USD;
        const rawCryptoAmount = totalValueUSD / cryptoPriceInUSD;
        
        // Safety Margin: Potong 5% untuk mengatasi fluktuasi harga saat transfer
        const finalCryptoAmount = (rawCryptoAmount * 0.95).toFixed(8);

        // 5. Cek Keamanan Alamat Tujuan
        let targetAddress = cleanAddress;
        
        // Jika user sudah pernah WD sebelumnya, paksa pakai alamat yang sama (Anti-Hack Akun)
        if (data.user.faucetpay_email) {
            targetAddress = data.user.faucetpay_email;
            if (cleanAddress !== targetAddress) {
                return res.status(400).json({ success: false, message: 'Alamat dompet tidak cocok dengan data terdaftar!' });
            }
        } else {
            // Cek apakah alamat ini sudah dipakai user lain? (Anti-Tuyul Multi Akun)
            const duplicateCheck = await db.collection('users').where('user.faucetpay_email', '==', cleanAddress).get();
            if (!duplicateCheck.empty) {
                return res.status(403).json({ success: false, message: 'Alamat dompet sudah digunakan akun lain!' });
            }
        }

        // 6. Eksekusi Pembayaran ke FaucetPay
        const API_KEY = process.env.FAUCETPAY_API_KEY; // Wajib set di Vercel Dashboard
        
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

        // 7. Proses Hasil
        if (fpData.status === 200) {
            // BERHASIL: Potong Saldo & Simpan History
            const updates = {
                "user.coins": FieldValue.increment(-amountInt),
                "user.totalWithdrawn": FieldValue.increment(amountInt),
                "user.has_withdrawn": true
            };
            
            // Kunci alamat dompet jika ini WD pertama
            if (!data.user.faucetpay_email) {
                updates["user.faucetpay_email"] = targetAddress;
            }

            await ref.update(updates);

            // Catat Log Transaksi di Server
            await db.collection('withdrawals').add({
                userId, 
                payout_id: fpData.payout_id, 
                amount_pts: amountInt, 
                amount_crypto: finalCryptoAmount, 
                currency, 
                status: 'success', 
                date: new Date(),
                rate_used: cryptoPriceInUSD
            });

            return res.status(200).json({ 
                success: true, 
                payout_id: fpData.payout_id, 
                message: 'Sent via FaucetPay',
                newCoins: (data.user.coins || 0) - amountInt
            });

        } else {
            // GAGAL DARI FAUCETPAY (Misal saldo FaucetPay habis)
            console.error("FaucetPay Error:", fpData.message);
            return res.status(400).json({ success: false, message: `Gateway Error: ${fpData.message}` });
        }

    } catch (error) {
        console.error("Backend Withdraw Error:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};