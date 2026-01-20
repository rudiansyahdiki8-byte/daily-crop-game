// CONFIGURATION FOR BACKEND (SERVER SIDE)
// Pastikan nilai di sini SELALU SAMA dengan js/config.js

export const GameConfig = {
    // 1. SETTING TANAMAN
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

    // 2. HARGA MEMBERSHIP
    Plans: {
        FREE: 0,
        MORTGAGE: 20,   // USDT
        TENANT: 30,     // USDT
        OWNER: 50       // USDT
    },

    // 3. SETTING MARKET
    ShopItems: {
        LandPrice_2: 10000,
        LandPrice_3: 750000,
        StoragePlus: 5000,
        BuffSpeed: 500,
        BuffGrowth: 1000,
        BuffTrade: 2000,
        BuffYield: 2500,
        BuffRare: 3000
    },

    // 4. SETTING SPIN
    Spin: {
        CostPaid: 150,       
        CooldownFree: 3600000,
        Jackpot: 1000,
        RewardCoinLow: 50,
        RewardCoinMid: 100,
        RewardCoinHigh: 200
    },

    // 5. SETTING WITHDRAW
    Finance: {
        RateUSDT: 0.00001,
        MinWdNew: 100,
        MinWdOld: 1000,
        DirectFee: 0.05
    },

    // 6. HADIAH TUGAS HARIAN
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
