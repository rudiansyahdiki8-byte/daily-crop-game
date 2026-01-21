// api/farm/action.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js'; 
import admin from 'firebase-admin';

// HELPER: Gacha Tanaman Baru
function rollNextPlant(luckMultiplier) {
    const crops = GameConfig.Crops;
    const rand = Math.random() * 100; // 0 - 100
    let cumulative = 0;

    // Kita iterasi semua tanaman
    for (const key in crops) {
        let chance = crops[key].chance;

        // Jika tanaman langka (bukan common), peluang dikalikan Luck user
        if (crops[key].rarity !== 'common') {
            chance = chance * luckMultiplier;
        }

        cumulative += chance;
        if (rand <= cumulative) return key;
    }
    return 'ginger'; // Fallback ke tanaman paling dasar
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, action, payload } = req.body;
    
    // 1. Validasi User
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found. Please reload.");

            const userData = doc.data();
            const now = Date.now() / 1000; // Detik

            // Ambil Data Penting
            let farmPlots = userData.farmPlots || [];
            let warehouse = userData.warehouse || {};
            const userPlanName = userData.user.plan || 'FREE';
            const planConfig = GameConfig.Plans[userPlanName] || GameConfig.Plans['FREE'];

            // === ACTION: PANEN SEMUA (HARVEST_ALL) ===
            if (action === 'HARVEST_ALL') {
                
                // A. Filter tanaman yang siap panen
                const readyPlots = farmPlots.filter(p => 
                    (p.status === 'growing' && now >= p.harvestAt) || p.status === 'ready'
                );

                if (readyPlots.length === 0) throw new Error("Belum ada tanaman yang siap panen!");

                // B. Cek Limit Gudang (PENTING!)
                const currentStock = Object.values(warehouse).reduce((a, b) => a + b, 0);
                const harvestCount = readyPlots.length; // Asumsi 1 plot = 1 item
                const maxStorage = planConfig.warehouse;

                // Jika bukan Landlord (Unlimited), cek kapasitas
                if (userPlanName !== 'OWNER' && (currentStock + harvestCount > maxStorage)) {
                    throw new Error(`Gudang Penuh! Kapasitas plan ${planConfig.name} hanya ${maxStorage}. Jual dulu hasil panenmu.`);
                }

                // C. Proses Panen & Tanam Ulang (Auto Replant)
                let harvestResult = {};

                readyPlots.forEach(plot => {
                    const plantName = plot.plant;
                    
                    // 1. Masukkan ke Gudang
                    warehouse[plantName] = (warehouse[plantName] || 0) + 1;
                    
                    // Catat hasil untuk laporan ke frontend
                    harvestResult[plantName] = (harvestResult[plantName] || 0) + 1;

                    // 2. AUTO REPLANT (Sesuai Excel)
                    // Pilih tanaman baru berdasarkan keberuntungan Plan
                    const nextPlant = rollNextPlant(planConfig.luckBonus);
                    const cropData = GameConfig.Crops[nextPlant];
                    const growTime = cropData.time; // detik

                    // Update Plot
                    plot.plant = nextPlant;
                    plot.status = 'growing';
                    plot.harvestAt = now + growTime;
                });

                // Update Statistik User
                userData.user.totalHarvest = (userData.user.totalHarvest || 0) + harvestCount;
                
                // Simpan ke DB
                t.update(userRef, { 
                    farmPlots: farmPlots, 
                    warehouse: warehouse,
                    "user.totalHarvest": userData.user.totalHarvest
                });

                return { 
                    success: true, 
                    message: `Panen sukses! Mendapat ${harvestCount} item.`,
                    harvested: harvestResult,
                    farmPlots: farmPlots, // Kirim balik plot yg sudah ditanam ulang
                    warehouse: warehouse  // Kirim balik gudang terbaru
                };
            }

            // === ACTION: SIRAM/BOOST (Opsional, jika ada fitur siram) ===
            if (action === 'WATER') {
                // Implementasi penyiraman bisa ditambahkan di sini nanti
                throw new Error("Fitur sedang dikembangkan");
            }

            throw new Error("Action tidak dikenal");
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("Farm Action Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}
