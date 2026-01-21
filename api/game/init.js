// api/game/init.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js'; 
import admin from 'firebase-admin';

export default async function handler(req, res) {
    // Hanya menerima metode POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData } = req.body;
    
    // 1. Validasi Keamanan: Pastikan yang akses benar-benar dari Telegram
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        // Gunakan Transaksi Database agar aman (tidak bentrok jika internet lambat)
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);

            if (doc.exists) {
                // === SKENARIO 1: PEMAIN LAMA ===
                // Update waktu terakhir aktif
                t.update(userRef, { "user.last_active": Date.now() });
                // Kembalikan data mereka apa adanya
                return { isNew: false, data: doc.data() };
            } else {
                // === SKENARIO 2: PEMAIN BARU (FIX DEADLOCK) ===
                // Kita buatkan data awal sesuai aturan Excel "Free Farmer"
                
                const freePlan = GameConfig.Plans['FREE'];
                let initialPlots = [];

                // ATURAN TANAH (Sesuai Excel Baris 21):
                // "4 land di tampilkan, 1 auto aktif, 2 bisa di beli di shop dan 1 total locked/disable"
                
                // Kita buat loop 12 slot (maksimal Landlord) biar database rapi
                for (let i = 1; i <= 12; i++) { 
                    let status = 'disabled'; // Default Mati
                    
                    if (i <= freePlan.baseLands) {
                        status = 'empty'; // 1 Tanah Aktif (Siap Tanam)
                    } else if (i <= (freePlan.baseLands + freePlan.buyableLands)) {
                        status = 'locked'; // 2 Tanah Terkunci (Bisa Beli)
                    }
                    // Sisanya tetap 'disabled' (Mati Total)
                    
                    initialPlots.push({
                        id: i,
                        status: status, 
                        plant: null, 
                        harvestAt: 0
                    });
                }

                // Struktur Data User Baru
                const newUser = {
                    user: {
                        userId: userId,
                        username: user.username || user.first_name || "Farmer",
                        plan: "FREE",
                        coins: 1000, // Modal Awal
                        lastActive: Date.now(),
                        totalHarvest: 0,
                        totalSold: 0,
                        landPurchasedCount: 0,
                        extraStorage: 0,
                        referral_status: 'Pending',
                        activeBuffs: {},
                        adBoosterCooldown: 0
                    },
                    warehouse: {}, 
                    farmPlots: initialPlots,
                    market: { prices: {}, lastRefresh: 0 }
                };

                // Simpan User Baru ke Database
                t.set(userRef, newUser);
                return { isNew: true, data: newUser };
            }
        });

        // === KUNCI PERBAIKAN CONFIG ===
        // Kita kirim data game (gameState) DAN Config Server (serverConfig)
        // Ini agar Frontend tahu harga/aturan terbaru tanpa perlu edit js/config.js lagi
        return res.status(200).json({ 
            success: true, 
            gameState: result.data,
            serverConfig: GameConfig 
        });

    } catch (error) {
        console.error("Init Error:", error);
        return res.status(500).json({ error: "Failed to load game data" });
    }
}
