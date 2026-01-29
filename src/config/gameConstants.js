/**
 * SINGLE SOURCE OF TRUTH (SAFE MODE)
 * - Semua variable lama DIPERTAHANKAN.
 * - Variable baru (STORAGE_UPGRADES) DITAMBAHKAN.
 */

export const GAME_CONFIG = {
  CURRENCY: "PTS",
  
  // KONFIGURASI WITHDRAW (PUSAT DATA)
  WITHDRAW: {
     RATE: 0.000004,      // 1 PTS = $0.0001 USD (10.000 PTS = $1)
     MIN_WD_NEW: 100,   // Limit User Baru
     MIN_WD_MEMBER: 1000, // Limit Member Terverifikasi
     FEE_DIRECT: 0.10,  // Fee 10%
     FEE_FAUCETPAY: 0,  // Fee 0%
     ADMIN_WALLET: "" // Wallet Deposit Anda
  },

  LUCKY_WHEEL: {
     COST_PAID: 150, 
     JACKPOT: 15000, 
     COOLDOWN_FREE: 3600, 
  }
};



// --- VARIABLE LAMA (JANGAN DIHAPUS) ---
// Ini penghubung nyawa system lama
export const LAND_PLOTS = {
  SLOT_2: { cost: 10000, reqPlan: "FREE" },
  SLOT_3: { cost: 750000, reqPlan: "FREE" },
  SLOT_4: { cost: 0, reqPlan: "MORTGAGE" },
  SLOT_5_8: { cost: 0, reqPlan: "TENANT" }
};

// --- VARIABLE BARU (FITUR EXTRA SLOT) ---
export const EXTRA_SLOT_PRICE = {
  1: 10000,    // Extra Slot ke-1
  2: 750000    // Extra Slot ke-2
};

// --- [BARU] VARIABLE UPGRADE GUDANG ---
export const STORAGE_UPGRADES = {
  'STORAGE_20': { 
      id: 'STORAGE_20', 
      name: 'Gudang +20', 
      price: 20000, 
      capacity: 20,
      icon: '📦' 
  }
};

// --- LOGIKA PLAN ---
export const PLANS = {
  FREE:     { id: "FREE",     priceUsdt: 0,  plots: 2,  storage: 50,       bonusSell: 0,    ads: "High" },
  MORTGAGE: { id: "MORTGAGE", priceUsdt: 20, plots: 4,  storage: 240,      bonusSell: 0.05, ads: "Medium" },
  TENANT:   { id: "TENANT",   priceUsdt: 30, plots: 7,  storage: 500,      bonusSell: 0.15, ads: "None" },
  OWNER:    { id: "OWNER",    priceUsdt: 50, plots: 10, storage: Infinity, bonusSell: 0.30, ads: "None" },
};

export const REFERRAL_BONUSES = {
  SELL_PERCENT: 0.10,    // 10% dari penjualan teman
  JACKPOT_PERCENT: 0.10, // 10% jika teman dapat Jackpot
  PLAN_UPGRADE: {
      'MORTGAGE': 20000,  // Bonus jika teman upgrade ke Mortgage
      'TENANT': 50000,    // Bonus jika teman upgrade ke Tenant
      'OWNER': 100000     // Bonus jika teman upgrade ke Owner
  }
};

// --- ASET VISUAL ---
export const ITEM_DETAILS = {
  "Cabbage": { icon: "🥬", color: "#39FF14" },
  "Spinach": { icon: "🍃", color: "#39FF14" },
  "Water Spinach": { icon: "🌿", color: "#39FF14" },
  "Corn": { icon: "🌽", color: "#39FF14" },
  "Eggplant": { icon: "🍆", color: "#39FF14" },
  "Tomato": { icon: "🍅", color: "#00E5FF" },
  "Carrot": { icon: "🥕", color: "#00E5FF" },
  "Broccoli": { icon: "🥦", color: "#00E5FF" },
  "Potato": { icon: "🥔", color: "#00E5FF" },
  "Cucumber": { icon: "🥒", color: "#00E5FF" },
  "Asparagus": { icon: "🎋", color: "#2979FF" },
  "Bell Pepper": { icon: "🫑", color: "#2979FF" },
  "Cauliflower": { icon: "🏐", color: "#2979FF" }, 
  "Purple Cabbage": { icon: "🟣", color: "#2979FF" },
  "Oyster Mushroom": { icon: "🍄", color: "#2979FF" },
  "Shiitake Mushroom": { icon: "🤎", color: "#E040FB" },
  "Artichoke": { icon: "🥬", color: "#E040FB" }, 
  "Bamboo Shoot": { icon: "🎍", color: "#E040FB" },
  "Giant Pumpkin": { icon: "🎃", color: "#E040FB" },
  "Wasabi": { icon: "🍱", color: "#FFD700" },
  "Black Garlic": { icon: "🧄", color: "#FFD700" }, 
  "Black Truffle": { icon: "⚫", color: "#FFD700" },
  "SPEED_SOIL":   { icon: "⚡", color: "#03A9F4" }, 
  "GROWTH_FERT":  { icon: "🧪", color: "#00BCD4" }, 
  "TRADE_PERMIT": { icon: "📜", color: "#673AB7" }, 
  "RARE_ESSENCE": { icon: "✨", color: "#E91E63" },
  "SCARECROW":    { icon: "🎃", color: "#FFD700" } 
};

export const CROPS = {
  COMMON: { chance: 0.10, growthTime: 240, priceRange: [20, 50], items: ["Cabbage", "Spinach", "Water Spinach", "Corn", "Eggplant"] },
  UNCOMMON: { chance: 0.06, growthTime: 300, priceRange: [50, 70], items: ["Tomato", "Carrot", "Broccoli", "Potato", "Cucumber"] },
  RARE: { chance: 0.02, growthTime: 420, priceRange: [120, 250], items: ["Asparagus", "Bell Pepper", "Cauliflower", "Purple Cabbage", "Oyster Mushroom"] },
  EPIC: { chance: 0.005, growthTime: 480, priceRange: [400, 800], items: ["Shiitake Mushroom", "Artichoke", "Bamboo Shoot", "Giant Pumpkin"] },
  LEGENDARY: { chance: 0.001, growthTime: 720, priceRange: [2000, 8000], items: ["Wasabi", "Black Garlic", "Black Truffle"] }
};

export const CONSUMABLES = {
  SPEED_SOIL: { id: 'SPEED_SOIL', name: 'Speed Soil', price: 500, desc: '-10% Waktu Tumbuh (24 Jam)' },
  GROWTH_FERT: { id: 'GROWTH_FERT', name: 'Growth Fertilizer', price: 1000, desc: '-20% Waktu Tumbuh (24 Jam)' },
  TRADE_PERMIT: { id: 'TRADE_PERMIT', name: 'Trade Permit', price: 1500, desc: '+10% Harga Jual (24 Jam)' },
  RARE_ESSENCE: { id: 'RARE_ESSENCE', name: 'Rare Essence', price: 2000, desc: '+20% Peluang Rare (24 Jam)' },
  SCARECROW: { id: 'SCARECROW', name: 'Golden Scarecrow', price: 3000, desc: 'Lucky! Peluang Rare-Legend x3 (24 Jam)' },
};

export const DAILY_TASK_CONFIG = { TOTAL_REWARD_POOL: 1200, TOTAL_TASKS: 9 };
export const DAILY_TASKS_LIST = [
  { id: 'LOGIN', label: 'Daily Login', icon: '📅' },
  { id: 'GIFT', label: 'Send Gift', icon: '🎁' },
  { id: 'CLEAN', label: 'Clean Farm', icon: '🧹' },
  { id: 'WATER', label: 'Water Plants', icon: '💧' },
  { id: 'FERTILIZER', label: 'Use Fertilizer', icon: '🧪' },
  { id: 'PEST', label: 'Kill Pests', icon: '🐛' },
  { id: 'HARVEST', label: 'Harvest Crop', icon: '🌾' },
  { id: 'SELL', label: 'Sell Items', icon: '💰' },
  { id: 'SPIN', label: 'Lucky Spin', icon: '🎡' } 
];


// --- SPIN CONFIGURATION (INI YANG HILANG SEBELUMNYA) ---
export const SPIN_CONFIG = {
  COST_PAID: 150,     
  COOLDOWN_FREE: 3600 // 1 Jam
};

export const SPIN_PRIZES = [
  { id: 'COIN_50',      type: 'COIN', val: 50,    label: '50 PTS',      color: '#B0BEC5', weight: 300 }, 
  { id: 'COMMON_CROP',  type: 'ITEM', val: 'Cabbage', label: 'Cabbage', color: '#4CAF50', weight: 200 }, 
  { id: 'BOOSTER_1',    type: 'ITEM', val: 'SPEED_SOIL', label: 'Speed Soil', color: '#03A9F4', weight: 150 }, 
  { id: 'COIN_100',     type: 'COIN', val: 100,   label: '100 PTS',     color: '#81D4FA', weight: 120 }, 
  { id: 'RARE_CROP',    type: 'ITEM', val: 'Bell Pepper', label: 'Pepper', color: '#2196F3', weight: 80 },  
  { id: 'BOOSTER_2',    type: 'ITEM', val: 'GROWTH_FERT', label: 'Fertilizer', color: '#00BCD4', weight: 60 },  
  { id: 'COIN_200',     type: 'COIN', val: 200,   label: '200 PTS',     color: '#FF9800', weight: 40 },  
  { id: 'EPIC_CROP',    type: 'ITEM', val: 'Shiitake Mushroom', label: 'Shiitake', color: '#9C27B0', weight: 25 },  
  { id: 'BOOSTER_3',    type: 'ITEM', val: 'TRADE_PERMIT', label: 'Permit', color: '#673AB7', weight: 15 },  
  { id: 'LEGENDARY',    type: 'ITEM', val: 'Wasabi', label: 'WASABI',   color: '#FFD700', weight: 5 },   
  { id: 'BOOSTER_4',    type: 'ITEM', val: 'RARE_ESSENCE', label: 'Essence', color: '#E91E63', weight: 4 },   
  { id: 'JACKPOT',      type: 'COIN', val: 1000,  label: 'JACKPOT',     color: '#FF1744', weight: 1 }    
];
