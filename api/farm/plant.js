// api/farm/plant.js
const { db, admin } = require('../../lib/firebase');
const GameConfig = require('../../lib/gameRules');
const crypto = require('crypto');

// Fungsi Validasi Telegram (Copy dari api/user/load.js atau buat helper terpisah)
// Agar ringkas, saya asumsikan logika validasi ada di sini atau di-import
function verifyTelegramWebAppData(telegramInitData) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash !== hash) throw new Error("Invalid Hash");
    return JSON.parse(urlParams.get('user'));
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { initData } = req.body;
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;

        const userRef = db.collection('users').doc(userId);
        
        // Jalankan Transaksi Database (Agar data tidak balapan/konflik)
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            const now = Date.now(); // Waktu Server untuk logic JS
            
            // 1. Ambil/Inisialisasi Farm Slots
            let plots = userData.farmPlots || [];
            if (plots.length === 0) {
                plots = Array(12).fill(null).map((_, i) => ({ id: i + 1, status: 'locked', plant: null, harvestAt: 0 }));
            }

            // 2. Tentukan Slot mana yang terbuka (Server Authority)
            const unlockedCount = GameConfig.getMaxSlots(userData);
            
            // 3. Logic Menanam
            let plantedCount = 0;
            
            plots = plots.map((plot, index) => {
                // Update Status Kunci/Buka dulu
                if (index < unlockedCount) {
                    if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
                } else {
                    plot.status = (index < 4) ? 'disabled' : 'locked'; // Sesuai logic lama
                }

                // Cek apakah slot ini akan ditanam
                // Syarat: Slot terbuka, status 'empty', dan belum ada tanaman
                if ((plot.status === 'empty') && index < unlockedCount) {
                    
                    // --- GACHA TANAMAN (RNG SERVER) ---
                    const seedType = GameConfig.rollDrop(userData.activeBuffs || {});
                    
                    // --- HITUNG WAKTU PANEN (SERVER TIME) ---
                    const durationMs = GameConfig.calculateHarvestTime(seedType, userData.activeBuffs || {});
                    
                    // Simpan waktu panen sebagai TIMESTAMP Firestore
                    // Agar akurat dan tidak terpengaruh zona waktu
                    const harvestTime = admin.firestore.Timestamp.fromMillis(now + durationMs);

                    plantedCount++;
                    
                    return {
                        ...plot,
                        status: 'growing',
                        plant: seedType,
                        harvestAt: harvestTime // Simpan object Timestamp
                    };
                }
                
                return plot;
            });

            if (plantedCount === 0) {
                throw new Error("No empty plots available to plant.");
            }

            // 4. Update Database
            t.update(userRef, { 
                farmPlots: plots,
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // 5. Kirim data terbaru ke client
        // Kita perlu fetch ulang atau return data yang sudah dimodifikasi
        // Untuk simpelnya, kita return success message, client reload data parsial
        return res.status(200).json({ 
            success: true, 
            message: "Planted successfully" 
        });

    } catch (error) {
        console.error("Plant Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
};