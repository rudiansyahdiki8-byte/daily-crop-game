import { CROPS } from '../../src/config/gameConstants.js';

/**
 * 1. LOGIC MENANAM (RNG + BUFF CALCULATION)
 * Digunakan oleh: start.js (Manual) DAN harvest.js (Auto-Replant)
 */
export const rollCropData = (activeBuffs = {}) => {
  const now = Date.now();
  
  // A. Logika Gacha Rarity (Anti-Zonk)
  // Cek Buff Rare Essence (+20% Chance Rare)
  const hasRareBuff = (activeBuffs.RARE_ESSENCE || 0) > now;
  const buffMod = hasRareBuff ? 0.2 : 0.0; 

  const rand = Math.random();
  let rarity = 'COMMON';

  // Urutan Cek: Legendary -> Epic -> Rare -> Uncommon -> Common
  if (rand < CROPS.LEGENDARY.chance + (buffMod/10)) rarity = 'LEGENDARY';
  else if (rand < CROPS.EPIC.chance + (buffMod/5)) rarity = 'EPIC';
  else if (rand < CROPS.RARE.chance + buffMod) rarity = 'RARE';
  else if (rand < CROPS.UNCOMMON.chance) rarity = 'UNCOMMON';
  
  // Pilih Tanaman Acak dari Rarity tersebut
  const cropGroup = CROPS[rarity];
  const cropName = cropGroup.items[Math.floor(Math.random() * cropGroup.items.length)];

  // B. Logika Waktu Tumbuh (Kena Diskon Speed Soil/Fertilizer?)
  let durationSec = cropGroup.growthTime;
  
  // Speed Soil (-10%)
  if ((activeBuffs.SPEED_SOIL || 0) > now) durationSec *= 0.9;
  
  // Growth Fertilizer (-20%)
  if ((activeBuffs.GROWTH_FERT || 0) > now) durationSec *= 0.8;

  const harvestAt = now + (durationSec * 1000);

  // Return Data Siap Simpan ke DB
  return {
    cropName,
    rarity,
    plantedAt: now,
    harvestAt: Math.ceil(harvestAt),
    isReady: false
  };
};

/**
 * 2. LOGIC PANEN (YIELD CALCULATION)
 * Digunakan oleh: harvest.js
 */
export const calculateYield = (activeBuffs = {}) => {
    const now = Date.now();
    let amount = 1;
    let isDouble = false;

    // Cek Buff Yield Booster (Permanen atau Sementara)
    // Asumsi: PERM_YIELD_BOOSTER nilainya boolean atau timestamp future
    const hasYieldBuff = (activeBuffs.YIELD_BOOSTER || 0) > now || activeBuffs.PERM_YIELD_BOOSTER;

    if (hasYieldBuff) {
         // 25% Chance dapat Double Crop
         if (Math.random() < 0.25) { 
            amount = 2;
            isDouble = true;
         }
    }
    return { amount, isDouble };
};