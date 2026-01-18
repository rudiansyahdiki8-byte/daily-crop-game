// api/withdraw.js
// Jembatan Aman: Game -> Vercel -> FaucetPay

export default async function handler(req, res) {
    // 1. Cek Metode (Harus POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Ambil Data dari Game
    const { address, amount, currency } = req.body;
    
    // 3. Ambil Kunci dari Vercel (Environment Variable)
    const API_KEY = process.env.FAUCETPAY_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Server Error: API Key belum dipasang di Vercel Settings' });
    }

    try {
        // 4. Kirim Perintah ke FaucetPay
        const response = await fetch('https://faucetpay.io/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,
                amount: amount,      // Jumlah Crypto (misal: 0.002)
                to: address,         // Alamat Wallet User
                currency: currency,  // USDT/TRX/dll
                referral: 'false'
            })
        });

        const data = await response.json();

        // 5. Cek Hasilnya
        if (data.status === 200) {
            // BERHASIL
            return res.status(200).json({ 
                success: true, 
                message: 'Payment Sent', 
                payout_id: data.payout_id 
            });
        } else {
            // GAGAL (Saldo Habis / Address Salah)
            return res.status(400).json({ 
                success: false, 
                message: data.message 
            });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Connection Error', details: error.message });
    }
}