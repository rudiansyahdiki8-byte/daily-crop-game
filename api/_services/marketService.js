import { CROPS, PLANS } from '../../src/config/gameConstants.js';

// --- HELPER 1: RUMUS HARGA (SEED HOUR) ---
// LOGIC INI MENYAMAKAN HARGA FRONTEND DAN BACKEND
const getHourlyPrice = (rarityConfig, seed) => {
  const [min, max] = rarityConfig.priceRange;
  // Gunakan Item Pertama sebagai "Garam" agar harga tiap tanaman beda
  const seedString = `${seed}-${rarityConfig.items[0]}`;
  
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }
  const rand01 = Math.abs(hash) / 2147483647;
  return Math.floor(min + (rand01 * (max - min)));
};

// --- HELPER 2: CARI RARITY ---
const getRarityByCropName = (cropName) => {
  for (const config of Object.values(CROPS)) {
    if (config.items.includes(cropName)) return config; 
  }
  return CROPS.COMMON; 
};

/**
 * Menghitung total harga jual dengan rumus Seeded Random (Jam)
 * Agar sinkron dengan tampilan di MarketModal.jsx
 */
export const calculateSellTotal = (userPlanId, inventoryToSell) => {
  let subTotal = 0;
  
  // 1. Ambil Jam Server (Seed)
  // Ini memastikan harga server = harga user (selama jamnya sama)
  const currentHourSeed = Math.floor(Date.now() / 3600000);

  // 2. Hitung Harga Dasar
  for (const [cropName, qty] of Object.entries(inventoryToSell)) {
    if (qty <= 0) continue;
    
    const cropConfig = getRarityByCropName(cropName);
    
    // GUNAKAN RUMUS JAM
    const pricePerUnit = getHourlyPrice(cropConfig, currentHourSeed);
    
    subTotal += (pricePerUnit * qty);
  }

  // 3. Hitung Bonus Membership
  const planData = PLANS[userPlanId] || PLANS.FREE;
  const bonusPercentage = planData.bonusSell || 0;
  const bonusAmount = Math.floor(subTotal * bonusPercentage);

  // 4. Total Akhir
  const totalReceived = subTotal + bonusAmount;

  return {
    subTotal,
    bonusAmount,
    totalReceived,
    planName: planData.id
  };
};
