// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// Helper: Ambil tanaman random sesuai Chance di Config
function getRandomPlant() {
    if (!GameConfig || !GameConfig.Crops) return 'ginger'; 
    const crops = GameConfig.Crops;
    const keys = Object.keys(crops);
    
    // 1. Hitung Total Chance
    let totalChance = 0;
    keys.forEach(key => totalChance += (crops[key].chance || 0));

    // 2. Acak angka
    let randomValue = Math.random() * totalChance;

    // 3. Pilih Tanaman
    for (const key of keys) {
        const chance = crops[key].chance || 0;
        if (randomValue < chance) return key;
        randomValue -= chance;
    }
    return 'ginger';
}

export default async function handler(req, res) {
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
        // Pastikan jumlah plot sesuai Plan (Default 12 dari diskusi sebelumnya)
        let farmPlots = userData.farmPlots || [];
        if (farmPlots.length === 0) {
             farmPlots = Array(12).fill(null).map((_, i) => ({
                id: i + 1, status: i===0?'empty':'locked', plant: null, harvestAt: 0
            }));
        }

        const now = Date.now();

        // === 1. LOGIC MENANAM (PLANT) ===
        if (action === 'plant') {
            const plot = farmPlots[plotIndex];
            if (!plot || plot.status !== 'empty') {
                return res.status(400).json({ error: "Plot is not empty!" });
            }

            // Gacha Benih
            const seed = getRandomPlant(); 
            const cropCfg = GameConfig.Crops[seed] || { time: 60 };

            // Update Plot
            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: seed,
                harvestAt: now + (cropCfg.time * 1000) 
            };

            await userRef.update({ farmPlots });
            return res.status(200).json({ success: true, message: `Planted ${seed}`, farmPlots });
        }

        // === 2. LOGIC PANEN (HARVEST) ===
        if (action === 'harvest') {
            const plot = farmPlots[plotIndex];
            
            // Validasi Status & Waktu
            if (!plot || (plot.status !== 'growing' && plot.status !== 'ready')) {
                return res.status(400).json({ error: "Nothing to harvest" });
            }
            if (now < plot.harvestAt - 2000) { // Toleransi 2 detik
                return res.status(400).json({ error: "Not ready yet!" });
            }

            const cropName = plot.plant || 'ginger';
            const cropCfg = GameConfig.Crops[cropName] || { minYield: 1 };
            
            // Logic Yield: Sesuai file asli (minYield s/d maxYield)
            const min = cropCfg.minYield || 1;
            const max = cropCfg.maxYield || 1;
            const yieldAmount = Math.floor(Math.random() * (max - min + 1)) + min;

            // Auto Replant (Gacha lagi)
            const newSeed = getRandomPlant();
            const newCfg = GameConfig.Crops[newSeed] || { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: newSeed,
                harvestAt: now + (newCfg.time * 1000)
            };

            // Update Stok Gudang & Total Harvest
            const currentStock = (userData.warehouse && userData.warehouse[cropName]) ? userData.warehouse[cropName] : 0;
            const currentTotal = (userData.user && userData.user.totalHarvest) ? userData.user.totalHarvest : 0;

            const updates = {
                farmPlots: farmPlots,
                [`warehouse.${cropName}`]: currentStock + yieldAmount,
                'user.totalHarvest': currentTotal + yieldAmount
            };

            await userRef.update(updates);
            
            // Kirim data terbaru ke Frontend
            const newWarehouse = { ...userData.warehouse, [cropName]: currentStock + yieldAmount };
            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${yieldAmount}x ${cropName}`, 
                farmPlots, 
                warehouse: newWarehouse,
                user: { ...userData.user, totalHarvest: currentTotal + yieldAmount }
            });
        }

        return res.status(400).json({ error: "Unknown Action" });

    } catch (error) {
        console.error("Farm API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
