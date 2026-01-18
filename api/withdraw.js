// api/withdraw.js
import { db } from './utils/firebase.js'; // Mengambil koneksi dari file yang Anda buat sebelumnya

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Ambil data yang dikirim dari Frontend
    const { userId, address, amount, currency } = req.body;

    // 3. Ambil Kunci Rahasia dari Vercel Environment Variables
    // (Ini aman karena berjalan di server, user tidak bisa melihatnya)
    const API_KEY = process.env.FAUCETPAY_API_KEY; 

    if (!API_KEY) {
        return res.status(500).json({ error: 'Server Error: Kunci FaucetPay belum disetting di Vercel' });
    }

    try {
        // --- VALIDASI KEAMANAN (Cek Saldo di Database Server) ---
        // Kita tidak percaya data saldo dari frontend, kita cek langsung ke Firebase Admin
        const userRef = db.collection('users').doc(userId); 
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan di database' });
        }

        const userData = userSnap.data();
        const serverCoins = userData.user ? userData.user.coins : 0;

        // Cek apakah saldo di database cukup
        if (serverCoins < amount) {
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi (Validasi Server)' });
        }

        // --- PROSES TRANSFER KE FAUCETPAY ---
        const response = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,    // Menggunakan kunci dari Vercel
                amount: amount,      // Jumlah koin
                to: address,         // Alamat wallet user
                currency: currency,  // Mata uang (USDT, dll)
                referral: 'false'
            })
        });

        const data = await response.json();

        // --- UPDATE SALDO JIKA SUKSES ---
        if (data.status === 200) {
            // Import admin untuk fungsi increment/decrement
            const admin = await import('firebase-admin'); 

            // Kurangi saldo user langsung di database server
            await userRef.update({
                'user.coins': admin.firestore.FieldValue.increment(-amount),
                'user.has_withdrawn': true,
                'user.faucetpay_email': address
            });

            // Beritahu frontend bahwa sukses
            return res.status(200).json({ 
                success: true, 
                message: 'Pembayaran Berhasil Dikirim', 
                payout_id: data.payout_id 
            });

        } else {
            // Gagal dari pihak FaucetPay (misal saldo faucet habis atau alamat salah)
            return res.status(400).json({ 
                success: false, 
                message: data.message 
            });
        }

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'Kesalahan Server', details: error.message });
    }
}