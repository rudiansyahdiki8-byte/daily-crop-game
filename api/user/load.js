// api/user/load.js
import { db } from '../utils/firebase.js';

// Data Default User (Copy dari state.js agar konsisten [cite: 519-520])
const defaultUser = {
    username: "Juragan Baru",
    // userId akan diisi otomatis
    plan: "FREE", 
    coins: 0, 
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    has_withdrawn: false,
    faucetpay_email: null,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    adBoosterCooldown: 0,    
    spin_free_cooldown: 0, 
    activeBuffs: {},
    upline: null,
    referral_status: 'Pending',
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    // Nanti di sini tempat verifikasi Telegram InitData (Keamanan tingkat lanjut)
    // Untuk sekarang kita pakai userId dulu.
    const { userId, username } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID Missing" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        let userData;
        
        if (doc.exists) {
            // USER LAMA: Ambil datanya
            userData = doc.data();
            
            // Update nama jika berubah di Telegram (Optional)
            if (username && userData.user.username !== username) {
                await userRef.update({ "user.username": username });
                userData.user.username = username;
            }
        } else {
            // USER BARU: Buat data default
            const newUser = { ...defaultUser, username: username || "Farmer", userId: userId };
            
            userData = {
                user: newUser,
                warehouse: {},
                farmPlots: [], // Nanti diinit di frontend atau backend
                market: { prices: {}, lastRefresh: 0 }
            };

            // Simpan User Baru ke DB
            await userRef.set(userData);
        }

        // Kirim data ke Frontend
        res.status(200).json({ success: true, data: userData });

    } catch (error) {
        console.error("Load Error:", error);
        res.status(500).json({ success: false, error: error.toString() });
    }
}
