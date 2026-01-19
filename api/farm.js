// api/farm.js
import db from './db.js';
import { GameConfig } from './gameConfig.js';

// [FITUR 1] Helper: Ambil tanaman random berdasarkan bobot 'chance'
// Ini memastikan "Random sesuai chance-nya" tetap berjalan untuk jenis tanaman.
function getRandomPlant() {
    if (!GameConfig || !GameConfig.Crops) return 'ginger'; 
    
    const crops = GameConfig.Crops;
    const keys = Object.keys(crops);
    
    // 1. Hitung Total Chance
    let totalChance = 0;
    keys.forEach(key => {
        totalChance += (crops[key].chance || 0);
    });

    // 2. Acak angka
    let randomValue = Math.random() * totalChance;

    // 3. Cari tanaman mana yang terpilih
    for (const key of keys) {
        const chance = crops[key].chance || 0;
        if (randomValue < chance) {
            return key; 
        }
        randomValue -= chance;
    }

    return 'ginger'; // Fallback
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

        // Fallback Init
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
            if (!plot || plot.status !== 'empty') {
                return res.status(400).json({ error: "Invalid plot status (Must be empty)" });
            }

            // Gunakan Random Weighted Chance
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

            if (!plot || (plot.status !== 'growing' && plot.status !== 'ready')) {
                return res.status(400).json({ error: "Invalid plot status for harvest" });
            }
            
            if (now < plot.harvestAt - 2000) {
                return res.status(400).json({ error: "Crop is not ready yet!" });
            }

            const cropName = plot.plant || 'ginger';
            
            // [FITUR 2] JUMLAH PANEN DIPATOK JADI 1
            // Sesuai permintaan: "Hanya 1 tak boleh lebih"
            const yieldAmount = 1; 

            // Auto Replant (Tetap pakai Random Chance untuk jenis tanaman berikutnya)
            const newSeed = getRandomPlant();
            const newConfig = (GameConfig.Crops && GameConfig.Crops[newSeed]) ? GameConfig.Crops[newSeed] : { time: 60 };

            farmPlots[plotIndex] = {
                ...plot,
                status: 'growing',
                plant: newSeed,
                harvestAt: now + (newConfig.time * 1000)
            };

            const currentStock = (userData.warehouse && userData.warehouse[cropName]) ? userData.warehouse[cropName] : 0;
            const currentTotalHarvest = (userData.user && userData.user.totalHarvest) ? userData.user.totalHarvest : 0;

            const updatePayload = {
                farmPlots: farmPlots,
                user: { totalHarvest: currentTotalHarvest + yieldAmount },
                warehouse: { [cropName]: currentStock + yieldAmount }
            };

            await userRef.set(updatePayload, { merge: true });

            const newWarehouse = { ...userData.warehouse, [cropName]: currentStock + yieldAmount };
            
            return res.status(200).json({ 
                success: true, 
                message: `Harvested ${yieldAmount}x ${cropName}`, 
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
