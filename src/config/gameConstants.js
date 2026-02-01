/**
 * SINGLE SOURCE OF TRUTH (SAFE MODE)
 * - All old variables are MAINTAINED.
 * - New variables (STORAGE_UPGRADES) are ADDED.
 */

export const GAME_CONFIG = {
  CURRENCY: "PTS",
  EXCHANGE_RATE: 250000, // 1 USD = 250,000 PTS

  // WITHDRAW CONFIGURATION (DATA CENTER)
  WITHDRAW: {
    RATE: 0.000004,    // 1 PTS = $0.000004 USD (250,000 PTS = 1 USD)
    MIN_WD_NEW: 100,   // Limit for New Users
    MIN_WD_MEMBER: 1000, // Limit for Verified Members
    FEE_DIRECT: 0.10,  // Fee 10%
    FEE_FAUCETPAY: 0,  // Fee 0%
    ADMIN_WALLET: "YOUR_USDT_WALLET_HERE" // Set your deposit wallet address
  }
  // Note: LUCKY_WHEEL config removed - use SPIN_CONFIG instead
};



// --- OLD VARIABLES (DO NOT DELETE) ---
// This connects the old system life
export const LAND_PLOTS = {
  SLOT_2: { cost: 10000, reqPlan: "FREE" },
  SLOT_3: { cost: 750000, reqPlan: "FREE" },
  SLOT_4: { cost: 0, reqPlan: "MORTGAGE" },
  SLOT_5_8: { cost: 0, reqPlan: "TENANT" }
};

// --- NEW VARIABLES (EXTRA SLOT FEATURE) ---
export const EXTRA_SLOT_PRICE = {
  1: 10000,   // 1st Extra Slot (balanced with SLOT_2)
  2: 100000   // 2nd Extra Slot
};

// --- [NEW] STORAGE UPGRADE VARIABLES ---
export const MAX_STORAGE_UPGRADES = 3; // Maximum storage upgrades allowed

export const STORAGE_UPGRADES = {
  'STORAGE_20': {
    id: 'STORAGE_20',
    name: 'Storage +20',
    price: 5000,  // Increased from 2000 for better balance
    capacity: 20,
    icon: '📦'
  }
};

// --- PLAN LOGIC (Prices doubled for economy balance) ---
export const PLANS = {
  FREE: { id: "FREE", priceUsdt: 0, plots: 1, storage: 50, bonusSell: 0, ads: "High" },
  MORTGAGE: { id: "MORTGAGE", priceUsdt: 40, plots: 4, storage: 240, bonusSell: 0.05, ads: "Medium" },
  TENANT: { id: "TENANT", priceUsdt: 60, plots: 7, storage: 500, bonusSell: 0.15, ads: "None" },
  OWNER: { id: "OWNER", priceUsdt: 100, plots: 10, storage: Infinity, bonusSell: 0.30, ads: "None" },
};

export const REFERRAL_BONUSES = {
  SELL_PERCENT: 0.10,    // 10% from friend's sales
  JACKPOT_PERCENT: 0.10, // 10% if friend wins Jackpot
  PLAN_UPGRADE: {
    'MORTGAGE': 20000,  // Bonus if friend upgrades to Mortgage
    'TENANT': 50000,    // Bonus if friend upgrades to Tenant
    'OWNER': 100000     // Bonus if friend upgrades to Owner
  }
};

// --- VISUAL ASSETS ---
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
  "Cauliflower": { icon: "🥦", color: "#2979FF" },
  "Purple Cabbage": { icon: "🟪", color: "#2979FF" },
  "Oyster Mushroom": { icon: "🍄", color: "#2979FF" },
  "Shiitake Mushroom": { icon: "🍄‍🟫", color: "#E040FB" },
  "Artichoke": { icon: "🌰", color: "#E040FB" },
  "Bamboo Shoot": { icon: "🎍", color: "#E040FB" },
  "Giant Pumpkin": { icon: "🎃", color: "#E040FB" },
  "Wasabi": { icon: "🍱", color: "#FFD700" },
  "Black Garlic": { icon: "🧄", color: "#FFD700" },
  "Black Truffle": { icon: "🍄", color: "#FFD700" },
  "SPEED_SOIL": { icon: "⚡", color: "#03A9F4" },
  "GROWTH_FERT": { icon: "🧪", color: "#00BCD4" },
  "TRADE_PERMIT": { icon: "📜", color: "#673AB7" },
  "RARE_ESSENCE": { icon: "✨", color: "#E91E63" },
  "SCARECROW": { icon: "🎃", color: "#FFD700" }
};

export const CROPS = {
  COMMON: { chance: 0.10, growthTime: 240, priceRange: [20, 50], items: ["Cabbage", "Spinach", "Water Spinach", "Corn", "Eggplant"] },
  UNCOMMON: { chance: 0.06, growthTime: 300, priceRange: [50, 70], items: ["Tomato", "Carrot", "Broccoli", "Potato", "Cucumber"] },
  RARE: { chance: 0.02, growthTime: 420, priceRange: [120, 250], items: ["Asparagus", "Bell Pepper", "Cauliflower", "Purple Cabbage", "Oyster Mushroom"] },
  EPIC: { chance: 0.005, growthTime: 480, priceRange: [400, 800], items: ["Shiitake Mushroom", "Artichoke", "Bamboo Shoot", "Giant Pumpkin"] },
  LEGENDARY: { chance: 0.001, growthTime: 720, priceRange: [2000, 8000], items: ["Wasabi", "Black Garlic", "Black Truffle"] }
};

export const CONSUMABLES = {
  SPEED_SOIL: { id: 'SPEED_SOIL', name: 'Speed Soil', price: 500, desc: '-10% Growth Time (24h)' },
  GROWTH_FERT: { id: 'GROWTH_FERT', name: 'Growth Fertilizer', price: 1000, desc: '-20% Growth Time (24h)' },
  TRADE_PERMIT: { id: 'TRADE_PERMIT', name: 'Trade Permit', price: 1500, desc: '+10% Sell Price (24h)' },
  RARE_ESSENCE: { id: 'RARE_ESSENCE', name: 'Rare Essence', price: 2000, desc: '+20% Rare Chance (24h)' },
  SCARECROW: { id: 'SCARECROW', name: 'Golden Scarecrow', price: 3000, desc: 'Lucky! x3 Rare-Legend Chance (24h)' },
};

// --- DAILY TASKS CONFIG (Single Source of Truth) ---
export const DAILY_TASKS = {
  'LOGIN': { min: 50, max: 100, label: 'Daily Login', icon: '📅' },
  'GIFT': { min: 50, max: 100, label: 'Send Gift', icon: '🎁' },
  'CLEAN': { min: 80, max: 120, label: 'Clean Farm', icon: '🧹' },
  'WATER': { min: 80, max: 120, label: 'Water Plants', icon: '💧' },
  'FERTILIZER': { min: 90, max: 130, label: 'Use Fertilizer', icon: '🧪' },
  'PEST': { min: 100, max: 150, label: 'Kill Pests', icon: '🐛' },
  'HARVEST': { min: 100, max: 200, label: 'Harvest Crop', icon: '🌾' },
  'SELL': { min: 120, max: 200, label: 'Sell Items', icon: '💰' },
  'SPIN': { min: 150, max: 250, label: 'Lucky Spin', icon: '🎡' }
};

// Helper: Convert DAILY_TASKS to array for frontend iteration
export const DAILY_TASKS_LIST = Object.entries(DAILY_TASKS).map(([id, config]) => ({
  id,
  label: config.label,
  icon: config.icon
}));


// --- SPIN CONFIGURATION (THIS WAS MISSING BEFORE) ---
export const SPIN_CONFIG = {
  COST_PAID: 150,
  COOLDOWN_FREE: 3600 // 1 Hour
};

export const SPIN_PRIZES = [
  { id: 'COIN_50', type: 'COIN', val: 50, label: '50 PTS', color: '#B0BEC5', weight: 300 },
  { id: 'COMMON_CROP', type: 'ITEM', val: 'Cabbage', label: 'Cabbage', color: '#4CAF50', weight: 200 },
  { id: 'BOOSTER_1', type: 'ITEM', val: 'SPEED_SOIL', label: 'Speed Soil', color: '#03A9F4', weight: 150 },
  { id: 'COIN_100', type: 'COIN', val: 100, label: '100 PTS', color: '#81D4FA', weight: 120 },
  { id: 'RARE_CROP', type: 'ITEM', val: 'Bell Pepper', label: 'Pepper', color: '#2196F3', weight: 80 },
  { id: 'BOOSTER_2', type: 'ITEM', val: 'GROWTH_FERT', label: 'Fertilizer', color: '#00BCD4', weight: 60 },
  { id: 'COIN_200', type: 'COIN', val: 200, label: '200 PTS', color: '#FF9800', weight: 40 },
  { id: 'EPIC_CROP', type: 'ITEM', val: 'Shiitake Mushroom', label: 'Shiitake', color: '#9C27B0', weight: 25 },
  { id: 'BOOSTER_3', type: 'ITEM', val: 'TRADE_PERMIT', label: 'Permit', color: '#673AB7', weight: 15 },
  { id: 'LEGENDARY', type: 'ITEM', val: 'Wasabi', label: 'WASABI', color: '#FFD700', weight: 5 },
  { id: 'BOOSTER_4', type: 'ITEM', val: 'RARE_ESSENCE', label: 'Essence', color: '#E91E63', weight: 4 },
  { id: 'JACKPOT', type: 'COIN', val: 15000, label: 'JACKPOT', color: '#FF1744', weight: 1 }
];
