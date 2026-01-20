import { db } from '../utils/firebase';
import { GameConfig } from '../config';

export default async function handler(req, res) {
    // 1. HANYA TERIMA POST REQUEST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // 2. AMBIL DATA DARI GAME
    const { userId, itemKey, qty } = req.body;

    // Validasi Data Input
    if (!userId || !itemKey || !qty || qty <= 0) {
        return res.status(400).json({ success: false, error: 'Data transaksi tidak valid' });
    }

    // Validasi Item (Apakah tanaman ini terdaftar di Config?)
    const cropConfig = GameConfig.Crops[itemKey];
    if (!cropConfig) {
        return res.status(400).json({ success: false, error: 'Item tidak dikenali' });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        // 3. MULAI TRANSAKSI DATABASE (KUNCI DATABASE SEBENTAR)
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            
            if (!doc.exists) {
                throw new Error("User tidak ditemukan");
            }

            const userData = doc.data();
            const warehouse = userData.warehouse || {};
            const user = userData.user || {};
            const market = userData.market || { prices: {} };

            // 4. CEK STOK BARANG (SERVER SIDE VALIDATION)
            const currentQty = warehouse[itemKey] || 0;
            if (currentQty < qty) {
                throw new Error(`Stok tidak cukup! Punya: ${currentQty}, Mau Jual: ${qty}`);
            }

            // 5. AMBIL HARGA PASAR
            // Mengambil harga dari market user (agar sinkron dengan tampilan)
            // Tapi dibatasi MaxPrice dari Config agar tidak bisa di-cheat jadi 1 Milyar
            let basePrice = market.prices[itemKey] || cropConfig.minPrice;
            if (basePrice > cropConfig.maxPrice) {
                basePrice = cropConfig.maxPrice; // Reset ke batas wajar jika mencurigakan
            }

            // 6. HITUNG BONUS / MULTIPLIER
            let multiplier = 1.0;
            const now = Date.now();

            // a. Bonus Iklan (Ad Booster)
            if (user.adBoosterCooldown && user.adBoosterCooldown > now) {
                multiplier += 0.20; // +20%
            }

            // b. Bonus Item Buff (Trade Permit)
            if (user.activeBuffs && user.activeBuffs['sell_bonus'] > now) {
                multiplier += 0.15; // +15%
            }

            // c. Bonus Membership Plan (Sesuai janji di UI Plan)
            const plan = user.plan || 'FREE';
            if (plan === 'MORTGAGE') multiplier += 0.05;      // +5%
            else if (plan === 'TENANT') multiplier += 0.15;   // +15%
            else if (plan === 'OWNER') multiplier += 0.30;    // +30%

            // 7. HITUNG TOTAL
            const finalPricePerUnit = Math.floor(basePrice * multiplier);
            const totalEarn = finalPricePerUnit * qty;

            // 8. UPDATE DATABASE
            // a. Siapkan History Baru
            let salesHistory = user.sales_history || [];
            salesHistory.unshift({
                item: cropConfig.name || itemKey, // Gunakan nama cantik dari Config
                qty: qty,
                price: totalEarn,
                date: new Date().toLocaleTimeString('en-US', { hour12: false })
            });
            if (salesHistory.length > 5) salesHistory.pop(); // Batasi 5 riwayat

            // b. Update User Data
            // Perhatikan: Kita pakai update atomic, bukan replace data user
            t.update(userRef, {
                [`warehouse.${itemKey}`]: currentQty - qty,          // Kurangi Stok
                'user.coins': (user.coins || 0) + totalEarn,         // Tambah Koin
                'user.totalSold': (user.totalSold || 0) + totalEarn, // Statistik
                'user.sales_history': salesHistory                   // Log Transaksi
            });

            // c. Cek & Jalankan Logika Affiliate (Komisi 10%)
            if (user.upline && user.referral_status !== 'Active') {
                 // Tandai user jadi Active jika ini penjualan pertama
                 t.update(userRef, { 'user.referral_status': 'Active' });
            }
            // Catatan: Logic bagi hasil affiliate sebaiknya dipisah atau diproses async, 
            // tapi untuk sekarang kita fokus ke penjualan user dulu.

            return { 
                success: true, 
                totalEarn: totalEarn, 
                newBalance: (user.coins || 0) + totalEarn,
                soldItem: itemKey,
                soldQty: qty
            };
        });

        // 9. KIRIM HASIL KE GAME
        return res.status(200).json(result);

    } catch (error) {
        console.error("Sell Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
