// api/_utils/config.js

export const GameConfig = {
    // 1. SETTING TANAMAN (Full 21 Tanaman sesuai aset lama + Aturan Rarity Baru)
    Crops: {
        // --- KELOMPOK COMMON (Mudah) ---
        ginger:     { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'common' }, 
        turmeric:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'common' },
        galangal:   { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'common' },
        lemongrass: { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'common' },
        cassava:    { time: 240, minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'common' },
        
        // --- KELOMPOK UNCOMMON ---
        chili:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, rarity: 'uncommon' }, 
        pepper:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, rarity: 'uncommon' },
        onion:      { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, rarity: 'uncommon' },
        garlic:     { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, rarity: 'uncommon' },
        paprika:    { time: 300, minPrice: 50, maxPrice: 70, chance: 6.0, rarity: 'uncommon' },

        // --- KELOMPOK RARE ---
        aloeVera:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, rarity: 'rare' }, 
        mint:       { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, rarity: 'rare' },
        lavender:   { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, rarity: 'rare' },
        stevia:     { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, rarity: 'rare' },
        basil:      { time: 420, minPrice: 120, maxPrice: 250, chance: 2.0, rarity: 'rare' },

        // --- KELOMPOK EPIC ---
        cinnamon:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, rarity: 'epic' }, 
        nutmeg:     { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, rarity: 'epic' },
        cardamom:   { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, rarity: 'epic' },
        clove:      { time: 480, minPrice: 400, maxPrice: 800, chance: 0.5, rarity: 'epic' },

        // --- KELOMPOK LEGENDARY ---
        vanilla:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1, rarity: 'legendary' }, 
        saffron:    { time: 720, minPrice: 2000, maxPrice: 8000, chance: 0.1, rarity: 'legendary' }
    },

    // 2. SETTING PLAN (Sesuai Data XLSX Anda)
    Plans: {
        'FREE': { 
            name: "Free Farmer",
            price: 0, 
            baseLands: 1,       // 1 Auto Aktif
            buyableLands: 2,    // 2 Bisa dibeli
            totalDisplayed: 4,  // 4 Ditampilkan (Sisa locked/disabled)
            warehouse: 50,
            sellBonus: 0.00,    // 0%
            luckBonus: 1.0,     // Normal Chance
            ads: true           // Iklan Aktif
        },
        'MORTGAGE': { 
            name: "Mortgage",
            price: 20,          // USDT
            baseLands: 4,       // 4 Auto Aktif
            buyableLands: 2,    // 2 Bisa dibeli
            totalDisplayed: 7,  // 7 Ditampilkan
            warehouse: 150,
            sellBonus: 0.05,    // +5% Harga Jual
            luckBonus: 1.2,     // Rare chance up
            ads: "partial"      // Harvest bebas ads
        },
        'TENANT': { 
            name: "Tenant",
            price: 30,          // USDT
            baseLands: 7,       // 7 Auto Aktif
            buyableLands: 2,    // 2 Bisa dibeli
            totalDisplayed: 9,  // 9 Ditampilkan
            warehouse: 300,
            sellBonus: 0.10,    // +10% Harga Jual
            luckBonus: 1.5,     // Rare & Epic chance up
            ads: "partial_plus" // Harvest & Spin no ads
        },
        'OWNER': { 
            name: "Landlord",
            price: 50,          // USDT
            baseLands: 9,       // 9 Auto Aktif
            buyableLands: 3,    // 3 Bisa dibeli
            totalDisplayed: 12, // 12 Ditampilkan
            warehouse: 999999,  // No Limit
            sellBonus: 0.50,    // +50% Harga Jual
            luckBonus: 2.0,     // Legendary chance up
            ads: false          // No Ads
        }
    },

    // 3. SETTING MARKET (Item Shop - Harga Tanah & Buff)
    ShopItems: {
        // Harga tanah tambahan (bisa disesuaikan jika ingin beda tiap tier)
        LandPrice_2: 5000,      
        LandPrice_3: 10000,    
        
        // Upgrade Gudang & Buff (Tetap dipertahankan)
        StoragePlus: 5000,      
        BuffSpeed: 500,         
        BuffGrowth: 1000,       
        BuffTrade: 2000,        
        BuffYield: 2500,        
        BuffRare: 3000          
    },

    // 4. SETTING SPIN/RODA
    Spin: {
        CostPaid: 150,       
        CooldownFree: 3600000,  
        Jackpot: 1000,          
        RewardCoinLow: 50,
        RewardCoinMid: 100,
        RewardCoinHigh: 200
    },

    // 5. SETTING WITHDRAW (Sesuai XLSX Baris 3: 1 USDT = 100000 Coin)
    Finance: {
        RateUSDT: 0.00001, 
        MinWdNew: 100,
        MinWdOld: 1000,
        DirectFee: 0.05
    },

    // 6. HADIAH TUGAS HARIAN
    Tasks: {
        Login: 120, Visit: 120, Gift: 120, Clean: 120,
        Water: 150, Fertilizer: 150, Pest: 150,
        Harvest: 180, Sell: 180
    },

    // Helper untuk Konversi Plan di Backend
    PlanConfig: {
        ConversionRate: 100000 
    }
};

console.log("[SERVER CONFIG] Game Configuration Loaded with Full 21 Crops");
