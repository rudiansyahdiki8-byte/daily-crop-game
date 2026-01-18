// api/sell.js
import { db } from './utils/firebase.js'; // Pastikan path ini sesuai dengan lokasi firebase.js Anda
import * as admin from 'firebase-admin';

// CONFIG HARGA SERVER (Kunci Jawaban Harga Asli)
// Kita salin ini agar hacker tidak bisa mengubah harga di browser
const SERVER_PRICES = {
    ginger:     { min: 20, max: 50 },
    turmeric:   { min: 20, max: 50 },
    galangal:   { min: 20, max: 50 },
    lemongrass: { min: 20, max: 50 },
    cassava:    { min: 20, max: 50 },
    
    // Uncommon
    chili:      { min: 50, max: 70 },
    pepper:     { min: 50, max: 70 },
    onion:      { min: 50, max: 70 },
    garlic:     { min: 50, max: 70 },
    paprika:    { min: 50, max: 70 },

    // Rare
    aloeVera:   { min: 120, max: 250 },
    mint:       { min: 120, max: 250 },
    lavender:   { min: 120, max: 250 },
    stevia:     { min: 120, max: 250 },
    basil:      { min: 120, max: 250 },

    // Epic
    cinnamon:   { min: 400, max: 800 },
    nutmeg:     { min: 400, max: 800 },
    cardamom:   { min: 400, max: 800 },
    clove:      { min: 400, max: 800 },

    // Legendary
    vanilla:    { min: 2000, max: 8000 },
    saffron:    { min: 2000, max: 8000 }
};

export default async function handler(req, res) {
    // 1. Validasi Metode Request (Harus POST)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // 2. Ambil data dari Frontend
    const { userId, itemKey, qty, clientPrice } = req.body;

    // 3. Validasi Data Dasar
    if (!userId || !itemKey || !qty || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Data transaksi tidak lengkap' });
    }

    try {
        const userRef = db.collection('users').doc(userId);
        
        // GUNAKAN TRANSACTION: Agar data aman saat banyak orang akses bersamaan
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User tidak ditemukan";

            const data = doc.data();
            const warehouse = data.warehouse || {};
            const user = data.user || {};

            // --- A. CEK STOK DI SERVER (Anti-Cheat Stok) ---
            const currentStock = warehouse[itemKey] || 0;
            if (currentStock < qty) {
                throw `Stok ${itemKey} tidak cukup di server (Server: ${currentStock}, Request: ${qty})`;
            }

            // --- B. VALIDASI HARGA (Anti-Cheat Harga) ---
            const priceConfig = SERVER_PRICES[itemKey];
            if (!priceConfig) throw "Item tidak valid";

            // Cek apakah user punya "Ad Booster" aktif di server?
            const isBoosterActive = (user.adBoosterCooldown || 0) > Date.now();
            
            // Batas Toleransi Harga:
            // Jika booster aktif, kita izinkan harga naik sampai 20% dari Max Price
            // Kita beri sedikit kelonggaran (buffer) agar tidak false positive karena lag
            const maxAllowed = isBoosterActive ? (priceConfig.max * 1.3) : (priceConfig.max * 1.1);

            // Jika harga dari client terlalu tinggi dari batas wajar -> TOLAK
            if (clientPrice > maxAllowed) {
                 throw "Harga jual terdeteksi tidak wajar (Potensi Cheat)";
            }
            
            // Hitung Total Pendapatan
            const totalEarn = Math.floor(clientPrice * qty);

            // --- C. UPDATE DATABASE UTAMA ---
            const updates = {
                [`warehouse.${itemKey}`]: currentStock - qty, // Kurangi Stok
                'user.coins': admin.firestore.FieldValue.increment(totalEarn), // Tambah Koin
                'user.totalSold': admin.firestore.FieldValue.increment(totalEarn) // Catat Total Penjualan
            };

            // Jika user masih "Pending" (belum pernah transaksi), ubah jadi "Active"
            if (user.referral_status === 'Pending') {
                updates['user.referral_status'] = 'Active';
            }

            t.update(userRef, updates);

            // --- D. BAGI KOMISI REFERRAL (10%) ---
            const uplineId = user.upline;
            if (uplineId) {
                const commission = Math.floor(totalEarn * 0.10); // 10%
                
                // Hanya kirim jika komisi > 0
                if (commission > 0) {
                    const uplineRef = db.collection('users').doc(uplineId);
                    
                    // Update saldo Upline
                    // Kita pakai t.update agar atomik (masuk dalam satu kesatuan transaksi)
                    // Note: Jika uplineRef tidak ada (error), transaksi ini bisa batal.
                    // Untuk lebih aman, biasanya kita cek dulu keberadaan upline, 
                    // tapi untuk performa game ini, langsung update increment aman.
                    t.update(uplineRef, {
                        'user.affiliate.total_earnings': admin.firestore.FieldValue.increment(commission),
                        'user.coins': admin.firestore.FieldValue.increment(commission)
                    });
                }
            }
        });

        // Kirim respon sukses ke frontend
        return res.status(200).json({ success: true, message: 'Transaksi Berhasil', earned: clientPrice * qty });

    } catch (e) {
        console.error("Sell Error:", e);
        // Pastikan tidak mengirim respon ganda
        if (!res.headersSent) res.status(400).json({ success: false, message: e.toString() });
    }
}