// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Helper: RNG Sederhana untuk Server
function getRandomPlant() {
    const keys = Object.keys(GameConfig.Crops);
    // Logic gacha sederhana (bisa dipercanggih nanti sesuai rarity)
    return keys[Math.floor(Math.random() * keys.length)];
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, action, plotIndex } = req.body;

    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        let farmPlots = userData.farmPlots || [];
        
        // Init Plots jika kosong
        if (farmPlots.length === 0) {
             farmPlots = [
                { id: 1, status: 'empty', plant: null, harvestAt: 0 },
                { id: 2, status: 'locked', plant: null, harvestAt: 0 },
                { id: 3, status: 'locked', plant: null, harvestAt: 0 },
                { id: 4, status: 'locked', plant: null, harvestAt: 0 }
            ];
        }

        const now = Date.now();

        // === ACTION: PLANT (MENANAM) ===
        if (action === 'plant') {
            const plot = farmPlots[plotIndex];

            // Validasi
            if (!plot) return res.status(400).json({ error: "Plot tidak ditemukan" });
            if (plot.status !== 'empty') return res.status(400).json({ error: "Lahan tidak kosong" });

            // Pilih Tanaman (Server yang menentukan secara Acak)
            const seed = getRandomPlant(); 
            const cropConfig = GameConfig.Crops[seed];

            // Update Plot
            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: seed,
                harvestAt: now + (cropConfig.time * 1000) // Server hitung waktu
            };

            await userRef.update({ farmPlots });

            return res.status(200).json({ 
                success: true, 
                message: `Planted ${seed}`,
                farmPlots 
            });
        }

        // === ACTION: HARVEST (PANEN & TANAM ULANG) ===
        if (action === 'harvest') {
            const plot = farmPlots[plotIndex];

            // Validasi
            if (!plot || plot.status !== 'growing') return res.status(400).json({ error: "Belum siap panen" });
            
            // Cek Waktu (Toleransi 2 detik)
            if (now < plot.harvestAt - 2000) {
                return res.status(400).json({ error: "Tanaman belum matang!" });
            }

            // 1. Hitung Hasil
            const cropName = plot.plant || 'ginger';
            const yieldAmount = 1; // Default 1 (Bisa tambah logic buff di sini nanti)

            // 2. Masukkan ke Gudang
            const warehouseKey = `warehouse.${cropName}`;

            // 3. AUTO REPLANT (Fitur Game Anda)
            // Server pilih tanaman baru
            const newSeed = getRandomPlant();
            const newConfig = GameConfig.Crops[newSeed];

            // Update Plot jadi Growing lagi (bukan empty)
            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: newSeed,
                harvestAt: now + (newConfig.time * 1000)
            };

            // 4. Simpan Database (Atomic Update)
            await userRef.update({
                farmPlots: farmPlots,
                [warehouseKey]: db.FieldValue.increment(yieldAmount),
                "user.totalHarvest": db.FieldValue.increment(yieldAmount)
            });

            // Ambil data terbaru
            const updatedDoc = await userRef.get();

            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${cropName} & Replanted ${newSeed}`, 
                farmPlots,
                warehouse: updatedDoc.data().warehouse,
                user: updatedDoc.data().user
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        console.error("Farm API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
