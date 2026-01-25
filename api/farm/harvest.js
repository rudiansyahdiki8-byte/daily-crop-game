import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { CROPS } from '../../src/config/gameConstants.js';

// Helper: Pilih Tanaman Acak (Sama seperti start.js)
const pickRarity = (hasRareBuff) => {
  const rand = Math.random();
  const buffMod = hasRareBuff ? 0.2 : 0.0; 
  if (rand < CROPS.LEGENDARY.chance + (buffMod/10)) return 'LEGENDARY';
  if (rand < CROPS.EPIC.chance + (buffMod/5)) return 'EPIC';
  if (rand < CROPS.RARE.chance + buffMod) return 'RARE';
  if (rand < CROPS.UNCOMMON.chance) return 'UNCOMMON';
  return 'COMMON';
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. VALIDASI SLOT
      const slotData = userData.farm?.[slotId];
      if (!slotData) throw new Error("Slot kosong, tidak bisa panen.");
      if (Date.now() < slotData.harvestAt) throw new Error("Tanaman belum matang!");

      // 2. CEK GUDANG PENUH 
      const inventory = userData.inventory || {};
      const currentTotal = Object.values(inventory).reduce((a,b)=>a+b, 0);
      const limit = userData.storageLimit || 50;
      
      if (currentTotal >= limit) {
        throw new Error("Gudang Penuh! Jual hasil panen dulu.");
      }

      // 3. HITUNG HASIL (YIELD BOOSTER) 
      const buffs = userData.buffs || {};
      const now = Date.now();
      let yieldAmount = 1;
      let isDouble = false;

      // Cek apakah punya buff Yield Booster Permanen atau Item
      if (buffs.YIELD_BOOSTER > now) {
         // Chance 25% dapat double
         if (Math.random() < 0.25) {
            yieldAmount = 2;
            isDouble = true;
         }
      }

      // 4. UPDATE INVENTORY
      const cropName = slotData.cropName;
      const newQty = (inventory[cropName] || 0) + yieldAmount;
      
      // 5. AUTO-REPLANT (TANAM ULANG OTOMATIS) 
      // Kita langsung generate tanaman baru di slot ini
      const hasRareBuff = buffs.RARE_ESSENCE > now;
      const nextRarity = pickRarity(hasRareBuff);
      const nextCropGroup = CROPS[nextRarity];
      const nextCropName = nextCropGroup.items[Math.floor(Math.random() * nextCropGroup.items.length)];
      
      // Hitung durasi (kena efek Speed Soil/Fertilizer gak?)
      let durationSec = nextCropGroup.growthTime;
      if (buffs.SPEED_SOIL > now) durationSec *= 0.9;
      if (buffs.GROWTH_FERT > now) durationSec *= 0.8;
      
      const nextHarvestAt = now + (durationSec * 1000);

      const newFarmData = {
        cropName: nextCropName,
        rarity: nextRarity,
        plantedAt: now,
        harvestAt: Math.ceil(nextHarvestAt),
        isReady: false
      };

      // Simpan semua perubahan
      t.update(userRef, {
        [`inventory.${cropName}`]: newQty,
        [`farm.${slotId}`]: newFarmData // Timpa data lama dengan tanaman baru
      });

      return { 
        harvested: cropName, 
        amount: yieldAmount, 
        isDouble,
        nextCrop: newFarmData
      };
    });

    return sendSuccess(res, result, `Panen ${result.amount}x ${result.harvested}!`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}