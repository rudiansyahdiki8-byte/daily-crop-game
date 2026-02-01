import { CROPS } from '../../src/config/gameConstants.js';

/**
 * 1. PLANTING LOGIC (RNG + BUFF CALCULATION)
 * Used by: start.js (Manual) AND harvest.js (Auto-Replant)
 */
export const rollCropData = (activeBuffs = {}) => {
  const now = Date.now();

  // A. Rarity Gacha Logic (Anti-Bad-Luck)
  // Check Rare Essence Buff (+20% Chance Rare)
  const hasRareBuff = (activeBuffs.RARE_ESSENCE || 0) > now;
  let buffMod = hasRareBuff ? 0.2 : 0.0;

  // Check SCARECROW Buff (x3 Rare-Legend Chance)
  const hasScarecrow = (activeBuffs.SCARECROW || 0) > now;
  if (hasScarecrow) {
    buffMod *= 3; // Triple the buff modifier
  }

  const rand = Math.random();
  let rarity = 'COMMON';

  // Check Order: Legendary -> Epic -> Rare -> Uncommon -> Common
  if (rand < CROPS.LEGENDARY.chance + (buffMod / 10)) rarity = 'LEGENDARY';
  else if (rand < CROPS.EPIC.chance + (buffMod / 5)) rarity = 'EPIC';
  else if (rand < CROPS.RARE.chance + buffMod) rarity = 'RARE';
  else if (rand < CROPS.UNCOMMON.chance) rarity = 'UNCOMMON';

  // Pick Random Crop from that Rarity
  const cropGroup = CROPS[rarity];
  const cropName = cropGroup.items[Math.floor(Math.random() * cropGroup.items.length)];

  // B. Growth Time Logic (Discount from Speed Soil/Fertilizer?)
  let durationSec = cropGroup.growthTime;

  // Speed Soil (-10%)
  if ((activeBuffs.SPEED_SOIL || 0) > now) durationSec *= 0.9;

  // Growth Fertilizer (-20%)
  if ((activeBuffs.GROWTH_FERT || 0) > now) durationSec *= 0.8;

  const harvestAt = now + (durationSec * 1000);

  // Return Data Ready to Save to DB
  return {
    cropName,
    rarity,
    plantedAt: now,
    harvestAt: Math.ceil(harvestAt),
    isReady: false
  };
};

/**
 * 2. HARVEST LOGIC (YIELD CALCULATION)
 * Used by: harvest.js
 */
export const calculateYield = (activeBuffs = {}) => {
  const now = Date.now();
  let amount = 1;
  let isDouble = false;

  // Check Yield Booster Buff (Permanent or Temporary)
  // Assumption: PERM_YIELD_BOOSTER value is boolean or future timestamp
  const hasYieldBuff = (activeBuffs.YIELD_BOOSTER || 0) > now || activeBuffs.PERM_YIELD_BOOSTER;

  if (hasYieldBuff) {
    // 25% Chance to get Double Crop
    if (Math.random() < 0.25) {
      amount = 2;
      isDouble = true;
    }
  }
  return { amount, isDouble };
};