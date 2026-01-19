// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Helper: Ambil tanaman random dengan aman
function getRandomPlant() {
    // Pengaman jika GameConfig belum siap
    if (!GameConfig || !GameConfig.Crops) return 'ginger'; 
    
    const keys = Object.keys(GameConfig.Crops);
    if (keys.length === 0) return 'ginger';

    return keys[Math.floor(Math.random() * keys.length)];
}

export default async function handler(req, res) {
    // 1. Setup Header
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
        
        // Init Plots jika kosong (Fail-safe)
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

            if (!plot) return res.status(400).json({ error: "Plot invalid" });
            if (plot.status !== 'empty') return res.status(400).json({ error: "Lahan tidak kosong" });

            const seed = getRandomPlant(); 
            const cropConfig = (GameConfig.Crops && GameConfig.Crops[seed]) ? GameConfig.Crops[seed] : { time: 60 };

            // Update State Plot
            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: seed,
                harvestAt: now + (cropConfig.time * 1000) 
            };

            // Simpan Database
            await userRef.set({ farmPlots }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Planted ${seed}`,
                farmPlots 
            });
        }

        // === ACTION: HARVEST (PANEN & REPLANT) ===
        if (action === 'harvest') {
            const plot = farmPlots[plotIndex];

            if (!plot || plot.status !== 'growing') return res.status(400).json({ error: "Belum siap panen" });
            
            // Validasi Waktu (Toleransi 5 Detik biar sinkron dengan Frontend)
            if (now < plot.harvestAt - 5000) {
                return res.status(400).json({ error: "Tunggu sebentar lagi!" });
            }

            // 1. Hitung Hasil
            const cropName = plot.plant || 'ginger';
            const yieldAmount = 1; 

            // 2. Auto Replant (Tanam Ulang)
            const newSeed = getRandomPlant();
            const newConfig = (GameConfig.Crops && GameConfig.Crops[newSeed]) ? GameConfig.Crops[newSeed] : { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: newSeed,
                harvestAt: now + (newConfig.time * 1000)
            };

            // 3. UPDATE DATABASE (PAKAI SET MERGE)
            // Ini kuncinya! Kita update warehouse menggunakan dot notation di dalam merge object.
            // Firestore otomatis membuat map 'warehouse' jika belum ada.
            const updatePayload = {
                farmPlots: farmPlots,
                user: {
                    totalHarvest: db.FieldValue.increment(yieldAmount)
                },
                warehouse: {
                    [cropName]: db.FieldValue.increment(yieldAmount)
                }
            };

            await userRef.set(updatePayload, { merge: true });

            // 4. Ambil Data Terbaru untuk Update UI
            // Kita ambil snapshot baru agar data gudang di frontend sinkron
            const updatedDoc = await userRef.get();
            const finalData = updatedDoc.data();

            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${cropName}`, 
                farmPlots: finalData.farmPlots,
                warehouse: finalData.warehouse || {},
                user: finalData.user
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        console.error("Farm API Error:", error);
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
}
