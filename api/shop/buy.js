import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, itemId } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User data not found");

            const userData = doc.data();
            const shopConfig = GameConfig.ShopItems;
            
            // Mapping Item
            const items = {
                'land_2': { price: shopConfig.LandPrice_2, type: 'land', tier: 1 },
                'land_3': { price: shopConfig.LandPrice_3, type: 'land', tier: 2 },
                'storage_plus': { price: shopConfig.StoragePlus, type: 'storage' },
                'speed_soil': { price: shopConfig.BuffSpeed, type: 'buff', key: 'speed_soil' },
                'growth_fert': { price: shopConfig.BuffGrowth, type: 'buff', key: 'growth_speed' },
                'trade_permit': { price: shopConfig.BuffTrade, type: 'buff', key: 'sell_bonus' },
                'yield_boost': { price: shopConfig.BuffYield, type: 'buff', key: 'yield_bonus' },
                'rare_boost': { price: shopConfig.BuffRare, type: 'buff', key: 'rare_luck' }
            };

            const selectedItem = items[itemId];
            if (!selectedItem) throw new Error("Invalid item ID");

            // Validasi Saldo
            if ((userData.user.coins || 0) < selectedItem.price) {
                throw new Error("Insufficient funds");
            }

            // Siapkan Update Data
            const updates = {
                "user.coins": admin.firestore.FieldValue.increment(-selectedItem.price),
                "user.totalSpent": admin.firestore.FieldValue.increment(selectedItem.price)
            };

            // --- LOGIKA KHUSUS LAND (FIX BUG NO EMPTY PLOT) ---
            if (selectedItem.type === 'land') {
                updates["user.landPurchasedCount"] = admin.firestore.FieldValue.increment(1);
                
                // KITA HARUS UPDATE ARRAY farmPlots DI DATABASE JUGA!
                // Ambil data plot sekarang atau buat baru jika kosong
                let currentPlots = userData.farmPlots || [];
                
                // Pastikan array memiliki setidaknya 4 slot (agar tidak error index)
                while(currentPlots.length < 4) {
                    currentPlots.push({ 
                        id: currentPlots.length + 1, 
                        status: 'locked', 
                        plant: null, 
                        harvestAt: 0 
                    });
                }

                // Buka Slot Sesuai Tier
                // Land #2 -> Index 1
                // Land #3 -> Index 2
                const targetIndex = selectedItem.tier; 

                if (currentPlots[targetIndex]) {
                    // Ubah status dari 'locked' menjadi 'empty' agar bisa ditanami
                    currentPlots[targetIndex].status = 'empty';
                    
                    // Masukkan array yang sudah diedit ke dalam update
                    updates["farmPlots"] = currentPlots;
                }
            } 
            // --- LOGIKA LAINNYA ---
            else if (selectedItem.type === 'storage') {
                updates["user.extraStorage"] = admin.firestore.FieldValue.increment(20);
            } else if (selectedItem.type === 'buff') {
                const expiry = Date.now() + 86400000; // 24 jam
                updates[`user.activeBuffs.${selectedItem.key}`] = expiry;
            }

            t.update(userRef, updates);
            res.status(200).json({ success: true, newBalance: (userData.user.coins || 0) - selectedItem.price });
        });
    } catch (e) {
        console.error("Buy Error:", e);
        res.status(400).json({ error: e.message });
    }
}
