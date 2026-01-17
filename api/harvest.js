// api/harvest.js
const { db, verifyUser } = require('../lib/firebase');
const { getCropData } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    // 1. Cek Metode Request (Harus POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { userId, plotIndex } = req.body;

    if (!userId || plotIndex === undefined) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    try {
        // 2. Ambil Data User dari Database Server (Bukan dari HP User)
        const { ref, data } = await verifyUser(userId);
        
        // Pastikan user punya ladang
        const farmPlots = data.farmPlots || [];
        const plot = farmPlots[plotIndex];

        // 3. VALIDASI KEAMANAN (Anti-Cheat Timer)
        if (!plot || plot.status !== 'growing') {
            return res.status(400).json({ success: false, message: 'Tanaman belum ditanam!' });
        }

        const now = Date.now();
        // Cek apakah waktu panen di database sudah lewat?
        // Kita beri toleransi 5 detik (5000ms) untuk jaga-jaga lag internet
        if (plot.harvestAt > (now + 5000)) {
            return res.status(400).json({ success: false, message: 'Cheating Detected: Waktu belum selesai!' });
        }

        // 4. Proses Panen
        const plantName = plot.plant;
        const cropConfig = getCropData(plantName);

        if (!cropConfig) {
            return res.status(400).json({ success: false, message: 'Data tanaman error' });
        }

        // Tentukan jumlah hasil (Yield)
        // Di sini Anda bisa tambah logika Buff server-side nanti
        const yieldAmount = 1; 

        // 5. Auto Replant (Tanam Ulang Otomatis)
        // Server yang menentukan waktu panen berikutnya, bukan Client
        const nextHarvestTime = now + (cropConfig.time * 1000);

        // Update Data Plot di Memory Server
        farmPlots[plotIndex] = {
            ...plot,
            status: 'growing',      // Status tetap growing karena auto-replant
            harvestAt: nextHarvestTime, 
            plant: plantName        // Tanam tanaman yang sama
        };

        // 6. UPDATE DATABASE FIREBASE
        await ref.update({
            farmPlots: farmPlots,
            [`warehouse.${plantName}`]: FieldValue.increment(yieldAmount), // Tambah stok gudang
            "user.totalHarvest": FieldValue.increment(yieldAmount)         // Update statistik
        });

        // 7. Kirim Hasil ke Game (Frontend)
        res.status(200).json({
            success: true,
            data: {
                farmPlots: farmPlots,
                addedItem: plantName,
                addedAmount: yieldAmount,
                // Kirim total stok terbaru agar tampilan sinkron
                newStock: (data.warehouse?.[plantName] || 0) + yieldAmount
            }
        });

    } catch (error) {
        console.error("Harvest Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};