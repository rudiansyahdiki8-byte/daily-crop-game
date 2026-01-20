import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import admin from 'firebase-admin';

// CONFIG SERVER (Sinkron dengan Client)
const RULES = {
    RateUSDT: 0.00001,
    MinFpNew: 100,      // User Baru
    MinFpOld: 2500,     // User Lama
    MinDirectUSD: 5.0,  // Direct (Manual)
    DirectFee: 0.10     // Fee 10%
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, address, amount, currency, method } = req.body;
    const API_KEY = process.env.FAUCETPAY_API_KEY;

    // 1. Cek API Key Server (Wajib Ada untuk FaucetPay)
    if (!API_KEY && method === 'faucetpay') {
        return res.status(500).json({ error: 'Server Config Error: Missing API Key' });
    }

    // 2. Verifikasi User
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const withdrawRef = db.collection('withdrawals').doc(); 

    // Variabel untuk menyimpan hasil transaksi DB tahap 1
    let executionData = null;

    try {
        // --- TAHAP 1: VALIDASI & POTONG SALDO (DATABASE) ---
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            const currentBalance = userData.user.coins || 0;
            const hasHistory = userData.user.has_withdrawn || false;
            const savedAddress = userData.user.wallet_address;

            // A. CEK LOCK ADDRESS (Anti-Tuyul)
            // Jika user pilih FaucetPay, email harus sama dengan yang pertama kali dipakai
            if (method === 'faucetpay') {
                if (savedAddress && savedAddress !== address) {
                    throw new Error(`AKUN TERKUNCI! Anda wajib pakai email awal: ${savedAddress}`);
                }
            }

            // B. CEK LIMIT & FEE
            let minLimit = 0;
            let feePTS = 0;

            if (method === 'faucetpay') {
                minLimit = hasHistory ? RULES.MinFpOld : RULES.MinFpNew;
                feePTS = 0; // FaucetPay Gratis Fee
            } else {
                // Direct
                minLimit = Math.ceil(RULES.MinDirectUSD / RULES.RateUSDT);
                feePTS = Math.floor(amount * RULES.DirectFee);
            }

            if (amount < minLimit) {
                throw new Error(`Minimal withdraw: ${minLimit.toLocaleString()} PTS`);
            }
            if (currentBalance < amount) {
                throw new Error("Saldo tidak mencukupi.");
            }

            // C. UPDATE DATABASE (Potong Saldo)
            const updatePayload = {
                "user.coins": admin.firestore.FieldValue.increment(-amount),
                "user.has_withdrawn": true, 
                "user.last_active": Date.now()
            };

            // Kunci alamat jika ini transaksi pertama FaucetPay
            if (!savedAddress && method === 'faucetpay') {
                updatePayload["user.wallet_address"] = address;
            }

            t.update(userRef, updatePayload);

            // Simpan Status PROCESSING
            executionData = {
                userId: userId,
                username: user.username || "Unknown",
                amount_gross: amount,
                amount_net: amount - feePTS, // Yang dikirim
                currency: currency || "USDT",
                address: address,
                method: method,
                status: (method === 'faucetpay') ? 'PROCESSING' : 'PENDING', // FaucetPay = Processing, Direct = Pending
                createdAt: admin.firestore.Timestamp.now(),
                payout_id: null
            };
            
            t.set(withdrawRef, executionData);
        });

        // --- TAHAP 2: EKSEKUSI TRANSFER (KHUSUS FAUCETPAY) ---
        
        // Jika Direct, langsung selesai (Pending Manual)
        if (method !== 'faucetpay') {
            return res.json({ success: true, message: "Request Direct Withdraw dikirim. Menunggu Admin." });
        }

        // Jika FaucetPay, Lakukan INSTANT TRANSFER
        try {
            // Kita harus menghitung konversi USDT (karena FaucetPay minta angka Dollar/Crypto, bukan PTS)
            // Asumsi: amount_net adalah PTS. Kita ubah ke Satoshi/Crypto Amount di sini atau Frontend?
            // LEBIH AMAN: Frontend kirim PTS, Server hitung nilai Cryptonya.
            // Rumus: (PTS / 100000) = USDT Amount.
            
            const usdtAmount = (executionData.amount_net * RULES.RateUSDT).toFixed(8);

            const params = new URLSearchParams();
            params.append('api_key', API_KEY);
            params.append('amount', usdtAmount); // Kirim dalam satuan USDT
            params.append('to', address);
            params.append('currency', currency || "USDT"); // FaucetPay support USDT (TRC20/BEP20 internal)
            params.append('referral', 'false');

            const response = await fetch('https://faucetpay.io/api/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const fpData = await response.json();

            if (fpData.status === 200) {
                // --- SUKSES ---
                await withdrawRef.update({
                    status: 'COMPLETED',
                    payout_id: fpData.payout_id,
                    completedAt: admin.firestore.Timestamp.now()
                });

                return res.json({ 
                    success: true, 
                    message: `Instant Withdraw Berhasil! ID: ${fpData.payout_id}` 
                });

            } else {
                // --- GAGAL (Saldo FaucetPay Habis / Error Lain) ---
                throw new Error(fpData.message || "FaucetPay Error");
            }

        } catch (fpError) {
            // --- TAHAP 3: REFUND OTOMATIS (JIKA GAGAL) ---
            console.error("FaucetPay Gagal, Refund User...", fpError);

            // 1. Balikin Saldo User
            await userRef.update({
                "user.coins": admin.firestore.FieldValue.increment(amount)
            });

            // 2. Update Status Transaksi jadi FAILED
            await withdrawRef.update({
                status: 'FAILED',
                error_reason: fpError.message
            });

            // 3. Info ke User
            return res.status(400).json({ 
                success: false, 
                message: `Gagal mengirim dana: ${fpError.message}. Saldo Anda telah dikembalikan.` 
            });
        }

    } catch (error) {
        console.error("System Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}
