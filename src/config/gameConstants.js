/**
 * SINGLE SOURCE OF TRUTH
 * Dilarang mengubah angka tanpa referensi ke gamesystem.docx
 */

export const GAME_CONFIG = {
   CURRENCY: "PTS", // [cite: 4]
  WITHDRAW: {
     RATE: 100000, // 100,000 PTS = 1 USDT [cite: 80]
     MIN_NEW_USER: 100, // [cite: 85]
     MIN_EXISTING_USER: 1000, // [cite: 86]
     FEE_DIRECT: 0.05, // 5% Fee [cite: 83]
  },
  LUCKY_WHEEL: {
     COST_PAID: 150, // [cite: 46]
     JACKPOT: 1000, // [cite: 50]
     COOLDOWN_FREE: 3600, // 1 Jam dalam detik [cite: 45]
  }
};

export const PLANS = {
  FREE: {
    id: "FREE",
    price: 0,
    plots: 1,
    storage: 50,
    bonusSell: 0,
    ads: "High"
   }, // [cite: 18]
  MORTGAGE: {
    id: "MORTGAGE",
    priceUsdt: 20,
    plots: 4,
    storage: 240,
    bonusSell: 0.05, // +5%
    ads: "Medium"
   }, // [cite: 19]
  TENANT: {
    id: "TENANT",
    priceUsdt: 30,
    plots: 7,
    storage: 500,
    bonusSell: 0.15, // +15%
    ads: "None"
   }, // [cite: 20]
  OWNER: {
    id: "OWNER",
    priceUsdt: 50,
    plots: 8,
    storage: Infinity,
    bonusSell: 0.30, // +30%
    ads: "None"
   }, // [cite: 21]
};

export const CROPS = {
  COMMON: {
     chance: 0.10, // 10% [cite: 9]
     growthTime: 240, // Detik [cite: 9]
     priceRange: [20, 50], // [cite: 9]
     items: ["Cabbage", "Spinach", "Water Spinach", "Corn", "Eggplant"] // [cite: 9]
  },
  UNCOMMON: {
     chance: 0.06, // 6% [cite: 10]
     growthTime: 300, // Detik [cite: 10]
     priceRange: [50, 70], // [cite: 10]
     items: ["Tomato", "Carrot", "Broccoli", "Potato", "Cucumber"] // [cite: 10]
  },
  RARE: {
     chance: 0.02, // 2% [cite: 11]
     growthTime: 420, // Detik [cite: 11]
     priceRange: [120, 250], // [cite: 11]
     items: ["Asparagus", "Bell Pepper", "Cauliflower", "Purple Cabbage", "Oyster Mushroom"] // [cite: 11]
  },
  EPIC: {
     chance: 0.005, // 0.5% [cite: 12]
     growthTime: 480, // Detik [cite: 12]
     priceRange: [400, 800], // [cite: 12]
     items: ["Shiitake Mushroom", "Artichoke", "Bamboo Shoot", "Giant Pumpkin"] // [cite: 12]
  },
  LEGENDARY: {
    chance: 0.001, // 0.1% [cite: 13]
    growthTime: 720, // Detik [cite: 13]
    priceRange: [2000, 8000], // [cite: 13]
    items: ["Wasabi", "Black Garlic", "Black Truffle"] // [cite: 13]
  }
};

export const LAND_PLOTS = {
  SLOT_2: { cost: 10000, reqPlan: "FREE" }, // [cite: 26]
  SLOT_3: { cost: 750000, reqPlan: "FREE" }, // [cite: 27]
  SLOT_4: { cost: 0, reqPlan: "MORTGAGE" }, // [cite: 28]
  SLOT_5_8: { cost: 0, reqPlan: "TENANT" } // [cite: 29] (Tenant/Owner covers 5-8 logic)
};

export const CONSUMABLES = {
  SPEED_SOIL: { id: 'SPEED_SOIL', name: 'Speed Soil', price: 500, desc: '-10% Waktu Tumbuh (24 Jam)' },
  GROWTH_FERT: { id: 'GROWTH_FERT', name: 'Growth Fertilizer', price: 1000, desc: '-20% Waktu Tumbuh (24 Jam)' },
  TRADE_PERMIT: { id: 'TRADE_PERMIT', name: 'Trade Permit', price: 1500, desc: '+10% Harga Jual (24 Jam)' },
  RARE_ESSENCE: { id: 'RARE_ESSENCE', name: 'Rare Essence', price: 2000, desc: '+20% Peluang Rare (24 Jam)' },
};