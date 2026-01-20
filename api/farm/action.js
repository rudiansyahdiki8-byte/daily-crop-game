// api/farm/action.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, action, payload } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const serverNow = Date.now();

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            let farmPlots = userData.farmPlots || []; // Struktur plot 
            let warehouse = userData.warehouse || {};

            // --- LOGIKA MENANAM (PLANT) ---
            if (action === 'PLANT_ALL') {
                const emptySlots = farmPlots.filter(p => p.status === 'empty');
                if (emptySlots.length === 0) throw new Error("No empty plots");

                emptySlots.forEach(plot => {
                    // Server-side DropEngine 
                    const plantKey = rollPlantServerSide(); 
                    const plantConfig = GameConfig.Crops[plantKey];
                    
                    plot.status = 'growing';
                    plot.plant = plantKey;
                    // Waktu panen berdasarkan server [cite: 567, 63]
                    plot.harvestAt = serverNow + (plantConfig.time * 1000); 
                });
            }

            // --- LOGIKA PANEN (HARVEST) ---
            if (action === 'HARVEST_ALL') {
                const readyPlots = farmPlots.filter(p => 
                    p.status === 'ready' || (p.status === 'growing' && serverNow >= p.harvestAt)
                );

                if (readyPlots.length === 0) throw new Error("Nothing to harvest yet");

                readyPlots.forEach(plot => {
                    const plantKey = plot.plant;
                    warehouse[plantKey] = (warehouse[plantKey] || 0) + 1;
                    
                    // Update statistik [cite: 539, 76]
                    userData.user.totalHarvest = (userData.user.totalHarvest || 0) + 1;

                    // Auto-Replant Logic [cite: 75]
                    const nextPlant = rollPlantServerSide();
                    plot.plant = nextPlant;
                    plot.status = 'growing';
                    plot.harvestAt = serverNow + (GameConfig.Crops[nextPlant].time * 1000);
                });
            }

            t.update(userRef, {
                farmPlots: farmPlots,
                warehouse: warehouse,
                "user.totalHarvest": userData.user.totalHarvest
            });

            res.status(200).json({ success: true, farmPlots, warehouse });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Fungsi pembantu untuk gacha benih di server [cite: 592, 597]
function rollPlantServerSide() {
    const crops = GameConfig.Crops;
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const key in crops) {
        cumulative += crops[key].chance;
        if (rand <= cumulative) return key;
    }
    return 'ginger';
}
