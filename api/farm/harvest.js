// api/farm/harvest.js
const { db, admin } = require('../../lib/firebase');
const GameConfig = require('../../lib/gameRules');
const crypto = require('crypto');

// --- Helper Validasi Telegram (Bisa dipisah jadi file util nanti) ---
function verifyTelegramWebAppData(telegramInitData) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN is missing");
    
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
        const { initData } = req.body; // Data Login Telegram
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;

        const userRef = db.collection('users').doc(userId);

        // Gunakan Transaction agar Saldo/Item tidak bentrok saat panen cepat
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            const now = Date.now();
            
            let plots = userData.farmPlots || [];
            let warehouse = userData.warehouse || {};
            let totalHarvested = 0;
            let harvestedItems = {}; // Untuk laporan ke client

            let changesMade = false;

            // Loop semua plot tanah
            plots = plots.map(plot => {
                // Syarat Panen:
                // 1. Status 'growing' atau 'ready'
                // 2. Waktu panen (harvestAt) sudah lewat
                
                // Konversi Timestamp Firestore ke miliseconds
                let harvestTime = 0;
                if (plot.harvestAt && plot.harvestAt.toMillis) {
                    harvestTime = plot.harvestAt.toMillis();
                } else if (plot.harvestAt) {
                     harvestTime = new Date(plot.harvestAt).getTime();
                }

                if (plot.status === 'growing' || plot.status === 'ready') {
                    if (harvestTime > 0 && now >= harvestTime) {
                        // --- SUKSES PANEN ---
                        const plantName = plot.plant || 'ginger';
                        
                        // 1. Tambah ke Inventory
                        if (!warehouse[plantName]) warehouse[plantName] = 0;
                        warehouse[plantName]++; // Tambah 1 (Bisa diubah logicnya kalau ada skill yield booster)
                        
                        // Catat untuk report
                        if (!harvestedItems[plantName]) harvestedItems[plantName] = 0;
                        harvestedItems[plantName]++;
                        
                        totalHarvested++;

                        // 2. Kosongkan Tanah (Agar harus tanam lagi)
                        // User harus panggil API /plant lagi untuk menanam (Manual atau Auto-Replant di Client)
                        changesMade = true;
                        return { 
                            ...plot, 
                            status: 'empty', 
                            plant: null, 
                            harvestAt: 0 
                        };
                    }
                }
                
                // Jika belum waktunya, biarkan
                return plot;
            });

            if (!changesMade) {
                throw new Error("Nothing to harvest yet! (Check timer)");
            }

            // Update Database
            t.update(userRef, {
                farmPlots: plots,
                warehouse: warehouse,
                totalHarvest: admin.firestore.FieldValue.increment(totalHarvested),
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            });

            return { harvestedItems, plots, warehouse };
        });

        return res.status(200).json({ 
            success: true, 
            data: result 
        });

    } catch (error) {
        console.error("Harvest Error:", error);
        // Jangan beri detail error terlalu jelas ke client untuk keamanan
        return res.status(400).json({ success: false, error: error.message });
    }
};