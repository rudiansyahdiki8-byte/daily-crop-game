import { db } from '../utils/firebase';

// Kita butuh data waktu tumbuh tanaman agar server bisa menanam ulang (Auto-Replant)
[cite_start]// Data disalin dari config.js [cite: 453-458]
const CropData = {
    ginger: { time: 240 }, turmeric: { time: 240 }, galangal: { time: 240 }, lemongrass: { time: 240 }, cassava: { time: 240 },
    chili: { time: 300 }, pepper: { time: 300 }, onion: { time: 300 }, garlic: { time: 300 }, paprika: { time: 300 },
    aloeVera: { time: 420 }, mint: { time: 420 }, lavender: { time: 420 }, stevia: { time: 420 }, basil: { time: 420 },
    cinnamon: { time: 480 }, nutmeg: { time: 480 }, cardamom: { time: 480 }, clove: { time: 480 },
    vanilla: { time: 720 }, saffron: { time: 720 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, plotIndexes } = req.body; // Menerima array index plot yg mau dipanen

    if (!userId || !plotIndexes || !Array.isArray(plotIndexes)) {
        return res.status(400).json({ error: "Data panen tidak valid" });
    }

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User tidak ditemukan";

            const data = doc.data();
            const farmPlots = data.farmPlots || [];
            const warehouse = data.warehouse || {};
            const user = data.user || {};
            const activeBuffs = user.activeBuffs || {};

            let totalHarvested = 0;
            const now = Date.now();

            // Cek Buff Global User
            let speedMultiplier = 1;
            if (activeBuffs['growth_speed'] && activeBuffs['growth_speed'] > now) speedMultiplier *= 0.8;
            if (activeBuffs['speed_soil'] && activeBuffs['speed_soil'] > now) speedMultiplier *= 0.9;
            const hasYieldBuff = (activeBuffs['yield_bonus'] && activeBuffs['yield_bonus'] > now);

            // HITUNG TOTAL ITEM SAAT INI (Server Side)
            const currentTotalItems = Object.values(warehouse).reduce((a, b) => a + b, 0);
            
            // LOGIC LIMIT (Mirip warehouse.js frontend)
            const baseLimit = 50; // [cite: 704]
            const extra = user.extraStorage || 0;
            const maxLimit = baseLimit + extra;

            // Prediksi jumlah yang akan dipanen (Minimal 1 per plot)
            if ((currentTotalItems + plotIndexes.length) > maxLimit) {
                throw "Gudang Penuh! Jual item dulu.";
            }
            // Loop setiap plot yang mau dipanen user
            plotIndexes.forEach(index => {
                const plot = farmPlots[index];
                if (!plot) return;

                // VALIDASI 1: Cek Waktu (Anti-Speedhack)
                // Jika waktu server < waktu panen di database, berarti curang
                // Kita beri toleransi 5 detik (5000ms) untuk lag jaringan
                if (plot.status === 'growing' && (now + 5000) >= plot.harvestAt) {
                    
                    // 1. Panen
                    const plantName = plot.plant || 'ginger';
                    let yieldAmount = 1;
                    // Logic Yield Bonus Server Side
                    if (hasYieldBuff && Math.random() < 0.25) yieldAmount = 2;

                    // Update Stok Sementara
                    warehouse[plantName] = (warehouse[plantName] || 0) + yieldAmount;
                    totalHarvested += yieldAmount;

                    // 2. Auto-Replant (Server Side Logic)
                    // Pilih tanaman random (Sederhana: Random Keys)
                    const keys = Object.keys(CropData);
                    const randomPlant = keys[Math.floor(Math.random() * keys.length)];
                    
                    const baseTime = CropData[randomPlant].time || 180;
                    const durationMs = Math.ceil(baseTime * speedMultiplier) * 1000;

                    // Update Plot Data
                    farmPlots[index] = {
                        ...plot,
                        status: 'growing',
                        plant: randomPlant,
                        harvestAt: now + durationMs
                    };
                }
            });

            if (totalHarvested === 0) throw "Belum ada tanaman yang siap panen!";

            // Update Database
            t.update(userRef, {
                farmPlots: farmPlots,
                warehouse: warehouse,
                "user.totalHarvest": (user.totalHarvest || 0) + totalHarvested
            });

            return { farmPlots, warehouse, totalHarvested };
        });

        res.status(200).json({ success: true, message: "Panen Berhasil" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.toString() });
    }
}