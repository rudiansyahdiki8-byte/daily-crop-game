import { CROPS, PLANS } from '../../src/config/gameConstants.js';



// Helper: Cari Rarity berdasarkan nama tanaman
const getRarityByCropName = (cropName) => {
  for (const config of Object.values(CROPS)) {
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