// api/gameConfig.js
// INI ADALAH SOURCE OF TRUTH (Kebenaran Utama)
// Semua logika server akan mengacu ke sini.

export const GameConfig = {
    // 1. SETTING TANAMAN (Time dalam detik)
    Crops: {
        ginger:     { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, minYield: 1, maxYield: 2 }, 
        turmeric:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, minYield: 1, maxYield: 2 },
        galangal:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, minYield: 1, maxYield: 2 },
        lemongrass: { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, minYield: 1, maxYield: 2 },
        cassava:    { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, minYield: 1, maxYield: 2 },
        
        // Uncommon
        chili:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, minYield: 2, maxYield: 4 }, 
        pepper:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, minYield: 2, maxYield: 4 },
        onion:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, minYield: 2, maxYield: 4 },
        garlic:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, minYield: 2, maxYield: 4 },
        paprika:    { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, minYield: 2, maxYield: 4 },

        // Rare
        aloeVera:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, minYield: 3, maxYield: 6 }, 
        mint:       { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, minYield: 3, maxYield: 6 },
        lavender:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, minYield: 3, maxYield: 6 },
        stevia:     { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, minYield: 3, maxYield: 6 },
        basil:      { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, minYield: 3, maxYield: 6 },

        // Epic
        cinnamon:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, minYield: 5, maxYield: 10 }, 
        nutmeg:     { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, minYield: 5, maxYield: 10 },
        cardamom:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, minYield: 5, maxYield: 10 },
        clove:      { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, minYield: 5, maxYield: 10 },

        // Legendary
        vanilla:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1, minYield: 10, maxYield: 20 }, 
        saffron:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1, minYield: 10, maxYield: 20 }
    },

    // 2. HARGA MEMBERSHIP
    Plans: {
        FREE: 0,
        MORTGAGE: 20,
        TENANT: 30,
        OWNER: 50
    },

    // 3. SETTING MARKET (Harga Beli Item)
    ShopItems: {
        land_2: 10000,         // Saya ubah key-nya jadi lowercase agar konsisten dengan logic code
        land_3: 750000,
        storage_plus: 5000,
        speed_soil: 500,
        growth_fert: 1000,
        trade_permit: 2000,
        yield_boost: 2500,
        rare_boost: 3000
    },

    // 4. SETTING SPIN
    Spin: {
        CostPaid: 150,
        CooldownFree: 3600000,
        Rewards: [ // Struktur baru agar mudah dibaca API
            { id: 'coin_low', type: 'coin', val: 50, chance: 40 },
            { id: 'coin_mid', type: 'coin', val: 100, chance: 30 },
            { id: 'coin_high', type: 'coin', val: 200, chance: 20 },
            { id: 'jackpot', type: 'coin', val: 1000, chance: 10 }
        ]
    },

    // 5. SETTING WITHDRAW
    Finance: {
        RateUSDT: 0.00001,
        MinWdNew: 100,
        MinWdOld: 1000,
        DirectFee: 0.05
    },
    
    // 6. TASKS
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
