// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js'; // Pastikan path import benar

// --- LOGIKA BARU: WEIGHTED RANDOM DARI CONFIG ---
function getRandomPlant() {
    if (!GameConfig || !GameConfig.Crops) return 'ginger'; 
    
    const crops = GameConfig.Crops;
    const keys = Object.keys(crops);
    
    // 1. Hitung Total Peluang (Total Chance)
    // Code menjumlahkan semua 'chance' (10 + 6 + 2 + ... + 0.1)
    let totalChance = 0;
    keys.forEach(key => {
        totalChance += (crops[key].chance || 10);
    });

    // 2. Kocok Angka (0 sampai TotalChance)
    let randomPoint = Math.random() * totalChance;

    // 3. Cari Pemenang
    for (const key of keys) {
        const chance = crops[key].chance || 10;
        if (randomPoint < chance) {
            return key;
        }
        randomPoint -= chance;
    }

    return 'ginger'; // Fallback
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Error' });

    const { userId, action, plotIndex } = req.body;
    if (!userId) return res.status(400).json({ error: "No User ID" });

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const userData = doc.data();
        let farmPlots = userData.farmPlots || [];
        
        // Init Plots
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
            if (!plot || plot.status !== 'empty') return res.status(400).json({ error: "Lahan penuh" });

            // ACARA TANAM: Pilih bibit berdasarkan CHANCE di Config
            const seed = getRandomPlant(); 
            const cropConfig = GameConfig.Crops[seed] || { time: 60 };

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
            if (!plot || (plot.status !== 'growing' && plot.status !== 'ready')) return res.status(400).json({ error: "Belum siap" });
            
            if (now < plot.harvestAt - 5000) return res.status(400).json({ error: "Tunggu sebentar!" });

            const cropName = plot.plant || 'ginger';
            
            // ACARA PANEN: Hitung jumlah panen (Yield) berdasarkan Config
            const cropData = GameConfig.Crops[cropName] || { minYield: 1, maxYield: 1 };
            const min = cropData.minYield || 1;
            const max = cropData.maxYield || 1;
            // Random antara min dan max
            const yieldAmount = Math.floor(Math.random() * (max - min + 1)) + min;

            // AUTO REPLANT: Tanam ulang dengan bibit baru (Random lagi)
            const newSeed = getRandomPlant();
            const newConfig = GameConfig.Crops[newSeed] || { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: newSeed,
                harvestAt: now + (newConfig.time * 1000)
            };

            const currentStock = (userData.warehouse && userData.warehouse[cropName]) ? userData.warehouse[cropName] : 0;
            const currentHarvest = (userData.user && userData.user.totalHarvest) ? userData.user.totalHarvest : 0;

            await userRef.set({
                farmPlots: farmPlots,
                user: { totalHarvest: currentHarvest + yieldAmount },
                warehouse: { [cropName]: currentStock + yieldAmount }
            }, { merge: true });

            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${yieldAmount}x ${cropName}`, 
                farmPlots: farmPlots, 
                warehouse: { ...userData.warehouse, [cropName]: currentStock + yieldAmount },
                user: { ...userData.user, totalHarvest: currentHarvest + yieldAmount }
            });
        }
        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
