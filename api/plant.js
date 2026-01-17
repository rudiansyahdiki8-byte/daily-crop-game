// api/plant.js
const { db, verifyUser } = require('../lib/firebase');
const { GameConfig } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

// Helper Gacha Sederhana (Server Side)
function rollPlant(activeBuffs) {
    const rand = Math.random() * 100;
    // Cek Buff Rare (Logic Server)
    let rareBonus = 0;
    if (activeBuffs && activeBuffs['rare_luck'] > Date.now()) {
        rareBonus = 20.0; 
    }

    let cumulative = 0;
    // Loop Config Server
    for (const key in GameConfig.Crops) {
        let chance = GameConfig.Crops[key].chance;
        // Logic Bonus: Tambah peluang jika bukan Common
        if (GameConfig.Crops[key].minPrice > 50) { // Indikator bukan common
             chance += (chance * (rareBonus / 100));
        }
        cumulative += chance;
        if (rand <= cumulative) return key;
    }
    return 'ginger'; // Fallback
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID missing' });

    try {
        const { ref, data } = await verifyUser(userId);
        
        // 1. Cek Slot Kosong
        let farmPlots = data.farmPlots || [];
        // Inisialisasi jika kosong (12 slot default)
        if (farmPlots.length === 0) {
            farmPlots = Array(12).fill(null).map((_, i) => ({ id: i + 1, status: 'locked', plant: null, harvestAt: 0 }));
        }

        const purchased = data.user.landPurchasedCount || 0;
        const now = Date.now();
        let plantedCount = 0;

        // Cek Buff Kecepatan
        let speedMultiplier = 1;
        const buffs = data.user.activeBuffs || {};
        if (buffs['growth_speed'] && buffs['growth_speed'] > now) speedMultiplier *= 0.8;
        if (buffs['speed_soil'] && buffs['speed_soil'] > now) speedMultiplier *= 0.9;

        // 2. Loop Tanam (Server menentukan slot mana yang boleh ditanam)
        farmPlots = farmPlots.map((plot, index) => {
            // Tentukan Status Slot berdasarkan Level Tanah (Server Logic)
            let isUnlocked = false;
            if (index === 0) isUnlocked = true; // Slot 1 Gratis
            else if (index === 1 && purchased >= 1) isUnlocked = true;
            else if (index === 2 && purchased >= 2) isUnlocked = true;
            else if (index >= 3 && index < 4 && purchased >= 3) isUnlocked = true;
            
            // Hanya tanam jika: Unlocked, Kosong (empty), atau null
            if (isUnlocked && (plot.status === 'empty' || plot.status === 'locked' || !plot.status)) {
                
                // --- SERVER SIDE GACHA ---
                const plantType = rollPlant(buffs);
                const cropData = GameConfig.Crops[plantType];
                
                // --- SERVER SIDE TIMER ---
                const durationMs = Math.ceil(cropData.time * speedMultiplier) * 1000;
                
                plantedCount++;
                return {
                    ...plot,
                    status: 'growing',
                    plant: plantType,
                    harvestAt: now + durationMs
                };
            }
            return plot; // Kembalikan plot lama jika tidak berubah
        });

        if (plantedCount === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada lahan kosong!' });
        }

        // 3. Update DB
        await ref.update({ farmPlots: farmPlots });

        // 4. Kirim Data Baru ke Client
        return res.status(200).json({ success: true, farmPlots: farmPlots, plantedCount });

    } catch (error) {
        console.error("Plant Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};