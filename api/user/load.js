// api/user/load.js
const { db, admin } = require('../../lib/firebase'); // Import Firebase Admin
const crypto = require('crypto'); // Modul bawaan Node.js untuk keamanan

// Default User Data (Dari state.js lama, tapi disederhanakan untuk server)
const defaultUser = {
    plan: "FREE",
    coins: 0,
    isFirstPlantDone: false,
    warehouse: {}, // { 'ginger': 10 }
    farmPlots: [], // Array petak tanah
    referral_status: 'Pending'
};

// Fungsi Validasi Telegram (Anti-Cheat Utama)
function verifyTelegramWebAppData(telegramInitData) {
    // 1. Ambil token dari environment variables
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN belum disetting di Vercel!");

    // 2. Parsing data string menjadi object
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // 3. Urutkan parameter sesuai abjad
    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');

    // 4. Hitung Secret Key & Signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // 5. Cocokkan Hash
    if (calculatedHash !== hash) {
        throw new Error("Invalid Telegram Hash! Data integrity compromised.");
    }

    // 6. Kembalikan data user yang sudah diparse
    return JSON.parse(urlParams.get('user'));
}

if (userData.farmPlots) {
    userData.farmPlots = userData.farmPlots.map(plot => {
        if (plot.harvestAt && plot.harvestAt.toDate) {
            // Ubah object Timestamp Firestore jadi miliseconds (angka)
            return { ...plot, harvestAt: plot.harvestAt.toDate().getTime() };
        }
        return plot;
    });
}

module.exports = async (req, res) => {
    // Hanya izinkan Method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { initData } = req.body;

        if (!initData) {
            return res.status(400).json({ error: 'No Telegram Data found' });
        }

        // 1. VALIDASI KEAMANAN (Cek apakah request asli dari Telegram)
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id; // ID Unik Database

        // 2. AMBIL DATA DARI FIREBASE
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        let userData;

        if (!doc.exists) {
            // --- SKENARIO: USER BARU ---
            userData = {
                ...defaultUser,
                username: tgUser.first_name, // Pakai nama asli Telegram
                userId: userId,
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Simpan ke Database
            await userRef.set(userData);
        } else {
            // --- SKENARIO: USER LAMA ---
            // Update waktu login terakhir
            await userRef.update({
                lastActive: admin.firestore.FieldValue.serverTimestamp(),
                username: tgUser.first_name // Update nama jika user ganti nama di TG
            });
            userData = doc.data();
        }

        // 3. KIRIM DATA BERSIH KE FRONTEND
        // Kita konversi Timestamp Firestore ke Date biasa agar bisa dibaca JS Frontend
        if(userData.joinedAt) userData.joinedAt = userData.joinedAt.toDate();
        if(userData.lastActive) userData.lastActive = userData.lastActive.toDate();

        return res.status(200).json({ 
            success: true, 
            data: userData 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(403).json({ error: "Access Denied / Verification Failed" });
    }
};