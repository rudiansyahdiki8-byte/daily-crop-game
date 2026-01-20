// api/market/sell.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import { GameConfig } from '../_utils/config.js';

export default async function handler(req, res) {
  // 1. Hanya Terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { initData, itemKey, qty } = req.body;

  // 2. Validasi AUTH (Wajib!)
  const user = verifyTelegramWebAppData(initData);
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized: Invalid Telegram Data' });
  }

  const userId = "TG-" + user.id; // Format ID sesuaikan dengan state.js Anda
  const userRef = db.collection('users').doc(userId);

  try {
    // 3. Jalankan Transaksi Database (Atomic Operation)
    // Transaksi menjamin data tidak akan rusak jika ada 2 request bersamaan
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      
      if (!doc.exists) {
        throw new Error("User not found. Please login first.");
      }

      const userData = doc.data();
      const warehouse = userData.warehouse || {};
      const currentStock = warehouse[itemKey] || 0;

      // 4. Validasi Stok (Anti-Cheat Stok Negatif)
      if (currentStock < qty) {
        throw new Error(`Insufficient stock for ${itemKey}. Have: ${currentStock}, Need: ${qty}`);
      }

      // 5. Validasi Item & Hitung Harga Server
      const itemConfig = GameConfig.Crops[itemKey];
      if (!itemConfig) {
        throw new Error("Invalid item type");
      }

      // Disini kita bisa buat harga random server-side atau fix minimal
      // Agar aman, kita ambil rata-rata atau minimal, atau hitung ulang random
      // Contoh: Kita pakai harga minimal config agar user tidak bisa manipulasi harga
      // (Bisa dikembangkan jadi random range server-side)
      const pricePerUnit = Math.floor(Math.random() * (itemConfig.maxPrice - itemConfig.minPrice + 1)) + itemConfig.minPrice;
      
      const totalEarn = pricePerUnit * qty;

      // 6. Update Data Memory
      const newStock = currentStock - qty;
      const newCoins = (userData.user.coins || 0) + totalEarn;
      const newTotalSold = (userData.user.totalSold || 0) + totalEarn;

      // Update Object Warehouse
      warehouse[itemKey] = newStock;
      if (newStock <= 0) delete warehouse[itemKey];

      // Update History Penjualan
      const newHistory = userData.user.sales_history || [];
      newHistory.unshift({
          item: itemKey,
          qty: qty,
          price: totalEarn,
          date: new Date().toLocaleTimeString('en-US', { hour12: false })
      });
      if (newHistory.length > 10) newHistory.pop(); // Batasi history

      // 7. Simpan ke Database
      t.update(userRef, {
        "warehouse": warehouse,
        "user.coins": newCoins,
        "user.totalSold": newTotalSold,
        "user.sales_history": newHistory
      });
      
      // Kirim respon sukses ke client dengan data terbaru
      res.status(200).json({ 
        success: true, 
        message: `Sold ${qty} ${itemKey} for ${totalEarn} PTS`,
        newBalance: newCoins,
        earned: totalEarn
      });
    });

  } catch (error) {
    console.error("Transaction failed:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
}