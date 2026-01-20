// js/config.js
// ==========================================
// PUSAT DATA GAME (GAME CONFIGURATION)
// Ubah angka di sini untuk balancing game!
// ==========================================

export const GameConfig = {
    // 1. SETTING TANAMAN (Dari herbs.js)
    Crops: {
        ginger:     { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0 }, 
        turmeric:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0 },
        galangal:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0 },
        lemongrass: { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0 },
        cassava:    { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0 },
        
        // Uncommon
        chili:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0 }, 
        pepper:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0 },
        onion:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0 },
        garlic:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0 },
        paprika:    { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0 },

        // Rare
        aloeVera:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0 }, 
        mint:       { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0 },
        lavender:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0 },
        stevia:     { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0 },
        basil:      { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0 },

        // Epic
        cinnamon:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5 }, 
        nutmeg:     { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5 },
        cardamom:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5 },
        clove:      { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5 },

        // Legendary
        vanilla:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1 }, 
        saffron:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1 }
    },

    // 2. HARGA MEMBERSHIP (Dari plan.js)
    Plans: {
        FREE: 0,
        MORTGAGE: 20,   // USDT
        TENANT: 30,     // USDT
        OWNER: 50       // USDT
    },

    // 3. SETTING MARKET (Dari market.js)
    ShopItems: {
        LandPrice_2: 10000,      // Harga Tanah 2 (PTS)
        LandPrice_3: 750000,    // Harga Tanah 3 (PTS)
        StoragePlus: 5000,      // Harga Tambah Gudang (PTS)
        BuffSpeed: 500,         // Harga Speed Soil (PTS)
        BuffGrowth: 1000,       // Harga Growth Fertilizer (PTS)
        BuffTrade: 2000,        // Harga Trade Permit (PTS)
        BuffYield: 2500,        // Harga Yield Booster (PTS)
        BuffRare: 3000          // Harga Rare Essence (PTS)
    },

    // 4. SETTING SPIN/RODA (Dari spin.js)
    Spin: {
        CostPaid: 150,          // Biaya Spin Berbayar (PTS)
        CooldownFree: 3600000,  // Waktu Tunggu Gratis (1 Jam dalam milidetik)
        Jackpot: 1000,          // Hadiah Jackpot (PTS)
        RewardCoinLow: 50,
        RewardCoinMid: 100,
        RewardCoinHigh: 200
    },

    // 5. SETTING WITHDRAW (Dari withdraw.js)
    Finance: {
        RateUSDT: 0.00001,      // 100.000 PTS = 1 USDT
        MinWdNew: 100,          // Limit User Baru
        MinWdOld: 1000,         // Limit User Lama
        DirectFee: 0.05         // Fee 5%
    },

    // 6. HADIAH TUGAS HARIAN (Dari farm.js)
    Tasks: {
        Login: 120,
        Visit: 120,
        Gift: 120,
        Clean: 120,
        Water: 150,
        Fertilizer: 150,
        Pest: 150,
        Harvest: 180,
        Sell: 180
    }

};

// Tambahkan ke api/_utils/config.js
export const PlanConfig = {
    Tiers: {
        'FREE': { level: 1, price: 0 },
        'MORTGAGE': { level: 2, price: 20 }, // Harga dalam USDT
        'TENANT': { level: 3, price: 30 },
        'OWNER': { level: 4, price: 50 }
    },
    // Konversi Internal (Contoh: 1 USDT = 100,000 PTS)
    ConversionRate: 100000 
};

console.log("[CONFIG] Game Configuration Loaded");