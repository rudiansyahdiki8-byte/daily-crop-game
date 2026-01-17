// lib/game-config.js
// KONFIGURASI SERVER (SOURCE OF TRUTH)
// Server menggunakan file ini untuk validasi harga & waktu.

const GameConfig = {
    // 1. DATA TANAMAN (Waktu Tumbuh & Harga Jual)
   // Disalin dari config.js frontend [cite: 710-715]
    Crops: {
        // Common
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

    // 2. DATA MARKET (Harga Barang Toko)
   // Disalin dari config.js frontend [cite: 716-717]
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

    // 3. SETTING SPIN (Biaya & Hadiah)
   // Disalin dari config.js frontend 
    Spin: {
        CostPaid: 150,          // Biaya Spin Berbayar (PTS)
        CooldownFree: 3600000,  // Waktu Tunggu Gratis (1 Jam dalam milidetik)
        Jackpot: 1000,          // Hadiah Jackpot (PTS)
        RewardCoinLow: 50,
        RewardCoinMid: 100,
        RewardCoinHigh: 200
    },

    // 4. HADIAH TUGAS HARIAN
    // Disalin dari config.js frontend [cite: 720]
    Tasks: {
        daily_login: 120, // (Di config lama namanya Login, disesuaikan ID-nya)
        visit_farm: 120,
        free_reward: 120,
        clean_farm: 120,
        water_plants: 150,
        fertilizer: 150,
        kill_pests: 150,
        harvest_once: 180,
        sell_item: 180
    },

    // 5. KEUANGAN (Rate Withdraw)
   // Disalin dari config.js frontend [cite: 719]
    Finance: {
        RateUSDT: 0.00001,      // 100.000 PTS = 1 USDT
        MinWdNew: 100,          // Limit User Baru
        MinWdOld: 1000,         // Limit User Lama
        DirectFee: 0.05         // Fee 5%
    }
};

// Helper function untuk mengambil data tanaman dengan aman
const getCropData = (cropName) => {
    return GameConfig.Crops[cropName] || null;
};

// Export agar bisa dipakai oleh file lain di folder api/
module.exports = { GameConfig, getCropData };