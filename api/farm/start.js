import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { CROPS } from '../../src/config/gameConstants.js';

// Helper Random Rarity dengan Bobot
const pickRarity = (hasRareBuff) => {
  const rand = Math.random();
  // Jika punya Buff Rare Essence, peluang Rare naik +20% (Logic simple: kurangi threshold) [cite: 70]
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
      const userData = doc.data();

      // Cek Slot Kosong?
      if (userData.farm?.[slotId]) throw new Error("Slot sedang dipakai!");

      // 1. CEK BUFF AKTIF (RARE ESSENCE)
      const buffs = userData.buffs || {};
      const now = Date.now();
      const hasRareBuff = buffs.RARE_ESSENCE > now;

      // 2. PILIH TANAMAN
      const rarity = pickRarity(hasRareBuff);
      const cropGroup = CROPS[rarity];
      const cropName = cropGroup.items[Math.floor(Math.random() * cropGroup.items.length)];

      // 3. HITUNG WAKTU TUMBUH (DENGAN BUFF) [cite: 67-68]
      let durationSec = cropGroup.growthTime;
      
      // Speed Soil (-10%)
      if (buffs.SPEED_SOIL > now) {
        durationSec *= 0.9; 
      }
      // Growth Fertilizer (-20%) - Bisa ditumpuk (Stacking) atau pilih salah satu
      if (buffs.GROWTH_FERT > now) {
        durationSec *= 0.8; 
      }

      const harvestAt = now + (durationSec * 1000);

      const farmData = {
        cropName,
        rarity,
        plantedAt: now,
        harvestAt: Math.ceil(harvestAt),
        isReady: false
      };

      t.update(userRef, {
        [`farm.${slotId}`]: farmData
      });

      return { slotId, ...farmData, speedBonus: durationSec < cropGroup.growthTime };
    });

    return sendSuccess(res, result, "Berhasil Menanam!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}