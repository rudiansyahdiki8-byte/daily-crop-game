// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Helper: Ambil tanaman random
function getRandomPlant() {
    if (!GameConfig || !GameConfig.Crops) return 'ginger'; 
    const keys = Object.keys(GameConfig.Crops);
    if (keys.length === 0) return 'ginger';
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

        // === ACTION: PLANT ===
        if (action === 'plant') {
            const plot = farmPlots[plotIndex];
            
            // Allow planting only on empty plots
            if (!plot || plot.status !== 'empty') return res.status(400).json({ error: "Lahan tidak valid" });

            const seed = getRandomPlant(); 
            const cropConfig = (GameConfig.Crops && GameConfig.Crops[seed]) ? GameConfig.Crops[seed] : { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: seed,
                harvestAt: now + (cropConfig.time * 1000) 
            };

            await userRef.set({ farmPlots }, { merge: true });

            return res.status(200).json({ success: true, message: `Planted ${seed}`, farmPlots });
        }

        // === ACTION: HARVEST ===
        if (action === 'harvest') {
            const plot = farmPlots[plotIndex];
            
            // [PERBAIKAN UTAMA DI SINI]
            // Kita izinkan status 'growing' ATAU 'ready'.
            // Ini mengatasi masalah jika Frontend terlanjur menyimpan status 'ready' ke DB.
            if (!plot || (plot.status !== 'growing' && plot.status !== 'ready')) {
                return res.status(400).json({ error: "Belum siap panen (Status Salah)" });
            }
            
            // Validasi Waktu (Toleransi 5 Detik)
            // Walaupun status sudah 'ready' di DB, kita tetap cek waktu server biar aman dari cheat.
            if (now < plot.harvestAt - 5000) {
                return res.status(400).json({ error: "Tunggu sebentar lagi!" });
            }

            // 1. Hitung Hasil
            const cropName = plot.plant || 'ginger';
            const yieldAmount = 1; 

            // 2. Auto Replant
            const newSeed = getRandomPlant();
            const newConfig = (GameConfig.Crops && GameConfig.Crops[newSeed]) ? GameConfig.Crops[newSeed] : { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing', // Kembalikan ke growing
                plant: newSeed,
                harvestAt: now + (newConfig.time * 1000)
            };

            // 3. UPDATE DATABASE (Manual Math)
            const currentStock = (userData.warehouse && userData.warehouse[cropName]) ? userData.warehouse[cropName] : 0;
            const currentTotalHarvest = (userData.user && userData.user.totalHarvest) ? userData.user.totalHarvest : 0;

            const updatePayload = {
                farmPlots: farmPlots,
                user: {
                    totalHarvest: currentTotalHarvest + yieldAmount
                },
                warehouse: {
                    [cropName]: currentStock + yieldAmount
                }
            };

            await userRef.set(updatePayload, { merge: true });

            const newWarehouse = { ...userData.warehouse, [cropName]: currentStock + yieldAmount };
            
            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${cropName}`, 
                farmPlots: farmPlots,
                warehouse: newWarehouse,
                user: { ...userData.user, totalHarvest: currentTotalHarvest + yieldAmount }
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        console.error("Farm API Error:", error);
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
}
