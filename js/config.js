// js/config.js
// ==========================================
// PUSAT DATA GAME (GAME CONFIGURATION)
// Membership System Updated: Free, Mortgage, Tenant, Landlord
// ==========================================

window.GameConfig = {
    // 1. SETTING TANAMAN (Tetap Sama)
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

    // 2. KONFIGURASI MEMBERSHIP (DATA BARU SESUAI PETA KASIR)
    Plans: {
        FREE: { 
            name: "Free Farmer", 
            price: 0, 
            duration: Infinity, 
            // Land Rules
            displayPlots: 4,      // 4 land ditampilkan
            autoActive: 1,        // 1 auto aktif
            buyableSlots: 2,      // 2 bisa dibeli di shop
            // Stats
            storage: 50,          
            sellBonus: 0,         // Base harga system
            luck: 'Normal',       
            adsLevel: 'High'      // Iklan Tinggi
        },
        MORTGAGE: { 
            name: "Mortgage", 
            price: 50000,         // Harga Upgrade (PTS)
            duration: 30,         // Durasi Hari
            // Land Rules
            displayPlots: 7,      // 7 land ditampilkan
            autoActive: 4,        // 4 auto aktif
            buyableSlots: 2,      // 2 bisa dibeli
            // Stats
            storage: 150, 
            sellBonus: 0.05,      // +5% Kenaikan Harga
            luck: 'Rare',         // Kemungkinan Rare meningkat
            adsLevel: 'NoHarvest' // Bebas Iklan saat Harvest
        },
        TENANT: { 
            name: "Tenant", 
            price: 150000, 
            duration: 30, 
            // Land Rules
            displayPlots: 9,      // 9 land ditampilkan
            autoActive: 7,        // 7 auto aktif
            buyableSlots: 2,      // 2 bisa dibeli
            // Stats
            storage: 300, 
            sellBonus: 0.10,      // +10% Kenaikan Harga
            luck: 'Epic',         // Kemungkinan Rare & Epic meningkat
            adsLevel: 'NoHarvestSpin' // Bebas Iklan Harvest & Spin
        },
        LANDLORD: { 
            name: "Landlord", 
            price: 500000, 
            duration: 30, 
            // Land Rules
            displayPlots: 12,     // 12 land ditampilkan
            autoActive: 9,        // 9 auto aktif
            buyableSlots: 3,      // 3 bisa dibeli
            // Stats
            storage: Infinity,    // No Limit (Unlimited)
            sellBonus: 0.50,      // +50% Kenaikan Harga
            luck: 'Legendary',    // Kemungkinan Legendary meningkat
            adsLevel: 'FreeAds'   // Bebas Semua Iklan
        }
    },

    // 3. SETTING MARKET (Tetap Sama)
    ShopItems: {
        LandPrice_2: 10000,      // Harga Tanah Beli Tambahan
        LandPrice_3: 750000,    
        StoragePlus: 5000,      
        BuffSpeed: 500,         
        BuffGrowth: 1000,       
        BuffTrade: 2000,        
        BuffYield: 2500,        
        BuffRare: 3000          
    },

    // 4. SETTING SPIN/RODA (Tetap Sama)
    Spin: {
        CostPaid: 150,       
        CooldownFree: 3600000,  
        Jackpot: 1000,          
        RewardCoinLow: 50,
        RewardCoinMid: 100,
        RewardCoinHigh: 200
    },

    // 5. SETTING WITHDRAW (Tetap Sama)
    Finance: {
        RateUSDT: 0.00001,      
        MinWdNew: 100,          
        MinWdOld: 1000,         
        DirectFee: 0.05         
    },

    // 6. HADIAH TUGAS HARIAN (Tetap Sama)
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

console.log("[CONFIG] Game Configuration Loaded");