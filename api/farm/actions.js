// api/farm/actions.js
import { db } from '../utils/firebase.js';
import * as admin from 'firebase-admin';

// 1. DATA TANAMAN (Server Side)
const CROP_DATA = {
    ginger: { time: 240 }, 
    turmeric: { time: 240 },
    galangal: { time: 240 },
    lemongrass: { time: 240 },
    cassava: { time: 240 }
};

// 2. DATA HADIAH TASK (Server Side)
// Kita salin nilai dari config.js Anda [cite: 60] agar hacker tidak bisa ubah angka
const TASK_CONFIG = {
    'daily_login': { reward: 120, cooldown: 24 * 60 * 60 * 1000 }, // 24 Jam
    'visit_farm':  { reward: 120, cooldown: 24 * 60 * 60 * 1000 },
    'free_reward': { reward: 120, cooldown: 24 * 60 * 60 * 1000 },
    'clean_farm':  { reward: 120, cooldown: 24 * 60 * 60 * 1000 },
    'water_plants':{ reward: 150, cooldown: 24 * 60 * 60 * 1000 },
    'fertilizer':  { reward: 150, cooldown: 24 * 60 * 60 * 1000 },
    'kill_pests':  { reward: 150, cooldown: 24 * 60 * 60 * 1000 },
    'harvest_once':{ reward: 180, cooldown: 24 * 60 * 60 * 1000 },
    'sell_item':   { reward: 180, cooldown: 24 * 60 * 60 * 1000 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, action, plotIndex, taskId } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";
            
            const data = doc.data();
            const user = data.user || {};
            let plots = data.farmPlots || [];
            
            // Init plots jika kosong
            if (plots.length === 0) {
                 plots = Array(12).fill(null).map((_, i) => ({ id: i + 1, status: 'locked', plant: null, harvestAt: 0 }));
            }

            const now = Date.now();

            // --- A. LOGIKA TANAM (PLANT) ---
            if (action === 'plant') {
                let plantedCount = 0;
                // Cek Level Tanah User (Purchased Count)
                // Default buka 1 plot. Jika beli tanah 1 (total 1), buka plot ke-2.
                // Logika sederhana: Plot index 0 selalu buka. Plot 1 butuh purchased >=1. Plot 2 butuh >=2.
                const landCount = user.landPurchasedCount || 0;

                plots.forEach((plot, index) => {
                    // Validasi: Apakah plot ini TERBUKA untuk user ini?
                    let isUnlocked = false;
                    if (index === 0) isUnlocked = true;
                    else if (index === 1 && landCount >= 1) isUnlocked = true;
                    else if (index === 2 && landCount >= 2) isUnlocked = true;
                    else if (index >= 3 && index < 4 && landCount >= 3) isUnlocked = true; // Batas sementara 4 plot aktif

                    if (isUnlocked && plot.status === 'empty') {
                        const plants = ['ginger', 'turmeric', 'galangal', 'lemongrass', 'cassava']; 
                        const selectedPlant = plants[Math.floor(Math.random() * plants.length)];
                        const growthTimeSec = CROP_DATA[selectedPlant]?.time || 240;
                        
                        plot.status = 'growing';
                        plot.plant = selectedPlant;
                        plot.harvestAt = now + (growthTimeSec * 1000); 
                        plantedCount++;
                    }
                });

                if (plantedCount === 0) throw "Tidak ada lahan kosong atau terkunci.";
                t.update(userRef, { farmPlots: plots });
                res.json({ success: true, message: `Berhasil menanam di ${plantedCount} lahan.`, plots: plots });
            }

            // --- B. LOGIKA PANEN (HARVEST) ---
            else if (action === 'harvest') {
                if (plotIndex === undefined) throw "Plot index missing";
                const plot = plots[plotIndex];
                
                if (!plot || plot.status !== 'growing') throw "Lahan ini tidak siap panen.";
                if (now < plot.harvestAt) throw `Belum waktunya panen!`;

                const cropName = plot.plant;
                const yieldAmount = 1; 
                const warehouseKey = `warehouse.${cropName}`;
                
                // Replant Logic
                plot.status = 'growing';
                const plants = ['ginger', 'turmeric', 'galangal', 'lemongrass', 'cassava'];
                plot.plant = plants[Math.floor(Math.random() * plants.length)];
                const growthTimeSec = CROP_DATA[plot.plant]?.time || 240;
                plot.harvestAt = now + (growthTimeSec * 1000);

                t.update(userRef, { 
                    farmPlots: plots,
                    [warehouseKey]: admin.firestore.FieldValue.increment(yieldAmount),
                    'user.totalHarvest': admin.firestore.FieldValue.increment(yieldAmount)
                });
                res.json({ success: true, message: `Panen ${cropName} berhasil!`, plots: plots, yield: yieldAmount });
            }

            // --- C. LOGIKA TASK (BARU) ---
            else if (action === 'task') {
                if (!taskId || !TASK_CONFIG[taskId]) throw "Task tidak valid";

                const taskData = TASK_CONFIG[taskId];
                const cooldowns = user.task_cooldowns || {};
                const lastClaim = cooldowns[taskId] || 0;

                // Cek Cooldown (Server Time)
                if (now - lastClaim < taskData.cooldown) {
                    const timeLeftMin = Math.ceil((taskData.cooldown - (now - lastClaim)) / 60000);
                    throw `Tunggu ${timeLeftMin} menit lagi untuk klaim task ini.`;
                }

                // Berikan Hadiah
                t.update(userRef, {
                    'user.coins': admin.firestore.FieldValue.increment(taskData.reward),
                    [`user.task_cooldowns.${taskId}`]: now // Update waktu klaim ke sekarang
                });

                res.json({ success: true, message: `Task Selesai! +${taskData.reward} PTS`, reward: taskData.reward });
            }
        });

    } catch (e) {
        if (!res.headersSent) res.status(400).json({ success: false, message: e.toString() });
    }
}