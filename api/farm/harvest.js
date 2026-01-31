import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData, calculateYield } from '../_services/farmService.js'; // Import Otak Utama

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. Validasi Tanaman (Matang?)
      const slotData = userData.farm?.[slotId];
      if (!slotData) throw new Error("Slot kosong!");
      if (Date.now() < slotData.harvestAt) throw new Error("Tanaman belum siap panen!");

      // 2. Validasi Gudang (Penuh?)
      const inventory = userData.inventory || {};
      const currentTotal = Object.values(inventory).reduce((a,b)=>a+b, 0);
      const limit = userData.storageLimit || 50;
      
      // Owner (Unlimited) tidak kena limit
      if (userData.plan !== 'OWNER' && currentTotal >= limit) {
        throw new Error("Gudang Penuh! Jual dulu hasil panen.");
      }

      // 3. HITUNG HASIL PANEN (Panggil Service)
      // Logic Yield Booster diurus di sini
      const { amount, isDouble } = calculateYield(userData.buffs || {});

      // 4. AUTO REPLANT (Panggil Service Lagi)
      // Langsung generate tanaman baru dengan RNG & Buff yang sama
      const nextCrop = rollCropData(userData.buffs || {});

      // 5. Update DB (Sekaligus Panen & Tanam Ulang)
      const cropName = slotData.cropName;
      const newQty = (inventory[cropName] || 0) + amount;

      t.update(userRef, {
        [`inventory.${cropName}`]: newQty, // Tambah stok
        [`farm.${slotId}`]: nextCrop       // Timpa slot dengan tanaman baru
      });

      return { 
        harvested: cropName, 
        amount, 
        isDouble,
        nextCrop // Kirim data tanaman baru agar Frontend langsung update gambar
      };
    });

    return sendSuccess(res, result, `Panen ${result.amount}x ${result.harvested}!`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}