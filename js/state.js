// js/state.js

// 1. Konfigurasi Level (Plan) - DISESUAIKAN DENGAN TEMA CYBERPUNK
const PlanConfig = {
    FREE: { name: "BASIC DECK", basePlots: 1, maxPlots: 3, warehouseLimit: 120, ads: "High Scan" },
    MORTGAGE: { name: "CYBER-LINK", basePlots: 4, maxPlots: 6, warehouseLimit: 240, ads: "Medium Scan" },
    TENANT: { name: "DATA STREAM", basePlots: 6, maxPlots: 8, warehouseLimit: 500, ads: "Zero" },
    OWNER: { name: "SYSTEM ROOT", basePlots: 8, maxPlots: 12, warehouseLimit: 9999, ads: "Zero" }
};

// 2. Generate Data Harga & Gacha dari herbs.js (Modular)
const PriceRanges = {};
const CropRarity = {};

if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
        CropRarity[key] = { chance: HerbData[key].chance, rarity: HerbData[key].rarity };
    }
}

// 3. Engine Gacha
const DropEngine = {
    roll() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const key in CropRarity) {
            cumulative += CropRarity[key].chance;
            if (rand <= cumulative) return key;
        }
        return 'ginger'; // Fallback ke Alpha Fragment (ginger)
    }
};

// 4. Data Default - DISESUAIKAN DENGAN NARASI NETRUNNER
const defaultUser = {
    username: "NETRUNNER_INIT", // Sebelumnya "Juragan Baru"
    userId: "ID-" + Math.floor(Math.random() * 900000),
    plan: "FREE", 
    coins: 500,
    lastActive: Date.now(), 
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    has_withdrawn: false,
    faucetpay_email: null,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    adBoosterCooldown: 0,    
    activeBuffs: {},
    upline: null,
    referral_status: 'AWAITING_LINK', // Sebelumnya 'Pending'
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

// 5. Load & GameState (Logika tidak diubah)
let savedUser = localStorage.getItem('dc_user_save');
let savedWarehouse = localStorage.getItem('dc_warehouse_save');
let savedMarket = localStorage.getItem('dc_market_save');

let GameState = {
    user: savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser,
    warehouse: savedWarehouse ? JSON.parse(savedWarehouse) : {},
    farmPlots: [],
    market: savedMarket ? JSON.parse(savedMarket) : { prices: {}, lastRefresh: 0 },

    refreshMarketPrices() {
        const now = Date.now();
        if (now - this.market.lastRefresh > 3600000 || Object.keys(this.market.prices).length === 0) {
            let newPrices = {};
            for (const key in PriceRanges) {
                const range = PriceRanges[key];
                newPrices[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            }
            this.market.prices = newPrices;
            this.market.lastRefresh = now;
            this.save();
            return true;
        }
        return false;
    },

    getPrice(key) {
        return (this.market.prices && this.market.prices[key]) ? this.market.prices[key] : (PriceRanges[key]?.min || 10);
    },

    save() {
        this.user.lastActive = Date.now(); 
        localStorage.setItem('dc_user_save', JSON.stringify(this.user));
        localStorage.setItem('dc_warehouse_save', JSON.stringify(this.warehouse));
        localStorage.setItem('dc_market_save', JSON.stringify(this.market));
        if(window.UIEngine) UIEngine.updateHeader();
    }
};

setInterval(() => GameState.save(), 3000);

window.GameState = GameState;
window.PlanConfig = PlanConfig;
window.CropRarity = CropRarity;
window.DropEngine = DropEngine;
window.PriceRanges = PriceRanges;