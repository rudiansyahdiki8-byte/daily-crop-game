import { CROPS, PLANS } from '../../src/config/gameConstants.js';

// Helper: Ambil harga acak dari range (Harga Dinamis)
const getRandomPrice = (rarityType) => {
  // Cari config tanaman berdasarkan Rarity string (COMMON, RARE, dll)
  // Kita loop object CROPS untuk cari yang cocok
  const cropConfig = Object.values(CROPS).find(c => c.items.includes(rarityType)) || CROPS.COMMON;
  
  // Kalau parameter inputnya nama tanaman (misal "Spinach"), kita cari rarity-nya dulu
  // Tapi untuk simplifikasi, asumsi input fungsi ini sudah Rarity Config atau kita cari manual
  return Math.floor(Math.random() * (cropConfig.priceRange[1] - cropConfig.priceRange[0] + 1)) + cropConfig.priceRange[0];
};

// Helper: Cari Rarity berdasarkan nama tanaman
const getRarityByCropName = (cropName) => {
  for (const [rarityKey, config] of Object.entries(CROPS)) {
    if (config.items.includes(cropName)) return config; // Return object config
  }
  return CROPS.COMMON; // Fallback
};

export const calculateSellTotal = (userPlanId, inventoryToSell) => {
  let subTotal = 0;
  
  // 1. Hitung Base Price
  for (const [cropName, qty] of Object.entries(inventoryToSell)) {
    if (qty <= 0) continue;
    
    const cropConfig = getRarityByCropName(cropName);
    // Ambil harga acak sesuai range rarity 
    const pricePerUnit = Math.floor(Math.random() * (cropConfig.priceRange[1] - cropConfig.priceRange[0] + 1)) + cropConfig.priceRange[0];
    
    subTotal += (pricePerUnit * qty);
  }

  // 2. Hitung Bonus Plan 
  const planData = PLANS[userPlanId] || PLANS.FREE;
  const bonusPercentage = planData.bonusSell || 0;
  const bonusAmount = Math.floor(subTotal * bonusPercentage);

  // 3. Hitung Total Akhir
  const totalReceived = subTotal + bonusAmount;

  return {
    subTotal,
    bonusAmount,
    totalReceived,
    planName: planData.id
  };
};