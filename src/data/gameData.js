// src/data/gameData.js

// === KONFIGURASI UTAMA ===
export const GAME_CONFIG = {
  CURRENCY: "COIN",
  EXCHANGE_RATE: 100000, // 100k Coin = 1 USDT
  AUTO_REPLANT: true,    // Tanam sekali, panen selamanya
  SPIN_COST: 150         // Biaya spin berbayar
};

// === DATABASE SAYURAN (CROP TIERS) ===
// ID disesuaikan agar mudah cari icon nanti
export const CROP_DATA = {
  // TIER 1: COMMON (Cepat Tumbuh, Harga Murah)
  ginger: { id: 'ginger', name: 'Ginger', rarity: 'Common', time: 240, price: { min: 20, max: 50 }, img: '/assets/ginger.png' },
  carrot: { id: 'carrot', name: 'Carrot', rarity: 'Common', time: 240, price: { min: 20, max: 50 }, img: '/assets/carrot.png' },
  radish: { id: 'radish', name: 'Radish', rarity: 'Common', time: 240, price: { min: 20, max: 50 }, img: '/assets/radish.png' },
  potato: { id: 'potato', name: 'Potato', rarity: 'Common', time: 240, price: { min: 20, max: 50 }, img: '/assets/potato.png' },
  
  // TIER 2: UNCOMMON (Sedang)
  corn:   { id: 'corn',   name: 'Corn',   rarity: 'Uncommon', time: 300, price: { min: 50, max: 70 }, img: '/assets/corn.png' },
  tomato: { id: 'tomato', name: 'Tomato', rarity: 'Uncommon', time: 300, price: { min: 50, max: 70 }, img: '/assets/tomato.png' },
  chili:  { id: 'chili',  name: 'Chili',  rarity: 'Uncommon', time: 300, price: { min: 50, max: 70 }, img: '/assets/chili.png' },
  
  // TIER 3: RARE (Mahal)
  pumpkin:{ id: 'pumpkin',name: 'Pumpkin',rarity: 'Rare',     time: 420, price: { min: 120, max: 250 }, img: '/assets/pumpkin.png' },
  melon:  { id: 'melon',  name: 'Melon',  rarity: 'Rare',     time: 420, price: { min: 120, max: 250 }, img: '/assets/melon.png' },
  
  // TIER 4: LEGENDARY (Jackpot)
  truffle:{ id: 'truffle',name: 'Truffle',rarity: 'Legendary',time: 720, price: { min: 2000, max: 8000 }, img: '/assets/truffle.png' }
};

// === DATABASE MEMBERSHIP (PLAN) ===
export const MEMBERSHIP_PLANS = {
  FREE: { 
    id: 'free', name: 'Free Farmer', 
    land: { total: 4, active: 1, locked: 1 }, // 1 Aktif, 2 Beli, 1 Mati
    warehouse: 50, 
    bonus: 0 
  },
  MORTGAGE: { 
    id: 'mortgage', name: 'Mortgage', 
    land: { total: 7, active: 4, locked: 1 }, 
    warehouse: 150, 
    bonus: 5 
  },
  TENANT: { 
    id: 'tenant', name: 'Tenant', 
    land: { total: 9, active: 7, locked: 1 }, 
    warehouse: 300, 
    bonus: 10 
  },
  LANDLORD: { 
    id: 'owner', name: 'Landlord', 
    land: { total: 12, active: 9, locked: 0 }, 
    warehouse: 99999, 
    bonus: 50 
  }
};