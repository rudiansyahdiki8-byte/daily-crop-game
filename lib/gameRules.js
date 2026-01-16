// lib/gameRules.js
// Ini adalah "Source of Truth". Client boleh punya config.js untuk tampilan,
// tapi Server HANYA percaya file ini untuk perhitungan uang & waktu.

const GameConfig = {
    // Copy dari config.js Anda
    Crops: {
   ginger:      { name: 'Ginger', img: 'https://img.icons8.com/color/96/ginger.png', rarity: 'Common' },
    turmeric:    { name: 'Turmeric', img: 'https://img.icons8.com/external-colored-outline-lafs/64/external-turmeric-flavors-colored-outline-part-3-colored-outline-lafs-2.png', rarity: 'Common' },
    galangal:    { name: 'Galangal', img: 'https://img.icons8.com/external-others-pike-picture/50/external-Ginger-aromatherapy-others-pike-picture.png', rarity: 'Common' },
    lemongrass:  { name: 'Lemongrass', img: 'https://img.icons8.com/external-ddara-lineal-color-ddara/64/external-lemongrass-natural-scent-ddara-lineal-color-ddara.png', rarity: 'Common' },
    cassava:     { name: 'Cassava', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-yucca-world-cuisine-flaticons-lineal-color-flat-icons.png', rarity: 'Common' },

    // UNCOMMON
    chili:       { name: 'Red Chili', img: 'https://img.icons8.com/color/96/chili-pepper.png', rarity: 'Uncommon' },
    pepper:      { name: 'Pepper', img: 'https://img.icons8.com/doodle/48/paprika--v1.png', rarity: 'Uncommon' },
    onion:       { name: 'Onion', img: 'https://img.icons8.com/color/96/onion.png', rarity: 'Uncommon' },
    garlic:      { name: 'White Garlic', img: 'https://img.icons8.com/color/96/garlic.png', rarity: 'Uncommon' },
    paprika:     { name: 'Paprika', img: 'https://img.icons8.com/color/96/paprika.png', rarity: 'Uncommon' },

    // RARE
    aloeVera:    { name: 'Aloe Vera', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-aloe-vera-plants-flaticons-lineal-color-flat-icons.png', rarity: 'Rare' },
    mint:        { name: 'Mint Leaf', img: 'https://img.icons8.com/color/96/mint.png', rarity: 'Rare' },
    lavender:    { name: 'Lavender', img: 'https://img.icons8.com/color/96/lavender.png', rarity: 'Rare' },
    stevia:      { name: 'Stevia', img: 'https://img.icons8.com/dusk/64/leaf.png', rarity: 'Rare' },
    basil:       { name: 'Basil', img: 'https://img.icons8.com/color/96/basil.png', rarity: 'Rare' },

    // EPIC
    cinnamon:    { name: 'Cinnamon', img: 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-cinnamon-coffee-flaticons-flat-flat-icons.png', rarity: 'Epic' },
    nutmeg:      { name: 'Nutmeg', img: 'https://img.icons8.com/color/96/nutmeg.png', rarity: 'Epic' },
    cardamom:    { name: 'Cardamom', img: 'https://img.icons8.com/external-others-pike-picture/50/external-Cardamom-aromatherapy-others-pike-picture.png', rarity: 'Epic' },
    clove:       { name: 'Clove', img: 'https://img.icons8.com/arcade/64/cloves.png', rarity: 'Epic' },

    // LEGENDARY
    vanilla:     { name: 'Vanilla', img: 'https://img.icons8.com/external-ddara-lineal-color-ddara/64/external-vanilla-natural-scent-ddara-lineal-color-ddara.png', rarity: 'Legendary' },
    saffron:     { name: 'Saffron', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-saffron-world-cuisine-flaticons-lineal-color-flat-icons-2.png', rarity: 'Legendary' }
    },
    
    Plans: {
        FREE: { name: "Free Farmer", basePlots: 1, warehouseLimit: 50 },
        OWNER: { name: "Owner Farmer", basePlots: 1, warehouseLimit: 9999 }
    },
    
    // Helper untuk hitung harga acak (Logic dari state.js refreshMarketPrices)
    getRandomPrice: (cropKey) => {
        const crop = GameConfig.Crops[cropKey];
        if (!crop) return 10;
        return Math.floor(Math.random() * (crop.maxPrice - crop.minPrice + 1)) + crop.minPrice;
    },

        // Hitung waktu panen berdasarkan Buff
    calculateHarvestTime: (cropKey, activeBuffs = {}) => {
        const crop = GameConfig.Crops[cropKey] || GameConfig.Crops['ginger'];
        let durationSec = crop.time;
        
        // Cek Buff
        const now = Date.now();
        
        // Buff: Growth Speed (20% faster)
        if (activeBuffs['growth_speed'] && activeBuffs['growth_speed'] > now) {
            durationSec *= 0.8;
        }
        
        // Buff: Speed Soil (10% faster)
        if (activeBuffs['speed_soil'] && activeBuffs['speed_soil'] > now) {
            durationSec *= 0.9;
        }

        // Bulatkan ke atas
        return Math.ceil(durationSec) * 1000; // Return Miliseconds
    },

    // Helper untuk Gacha (Logic dari DropEngine state.js)
    // Server side RNG (Random Number Generator)
    rollDrop: (activeBuffs = {}) => {
        const rand = Math.random() * 100;
        let rareBonus = 0;
        
        // Cek logic buff server-side
        if (activeBuffs['rare_luck'] && activeBuffs['rare_luck'] > Date.now()) {
            rareBonus = 20.0;
        }

        let cumulative = 0;
        const crops = GameConfig.Crops;
        
        for (const key in crops) {
            let chance = crops[key].chance;
            
            // Logic bonus rarity
            if (crops[key].rarity !== 'Common') {
                chance += (chance * (rareBonus / 100));
            }
            
            cumulative += chance;
            if (rand <= cumulative) return key;
        }
        return 'ginger'; // Fallback
    },



    // LOGIKA SLOT (Server Side Validation)
    // Menentukan slot mana yang terbuka berdasarkan jumlah tanah yang dibeli
    getMaxSlots: (user) => {
        // Base slot (Slot 0) selalu terbuka
        let maxSlots = 1; 
        
        // Cek pembelian tanah
        const purchased = user.landPurchasedCount || 0;
        
        // Slot 1 terbuka jika beli 1x
        if (purchased >= 1) maxSlots = 2;
        // Slot 2 terbuka jika beli 2x
        if (purchased >= 2) maxSlots = 3;
        // Slot 3 terbuka jika beli 3x
        if (purchased >= 3) maxSlots = 4;
        
        // Batas maksimal slot sementara (sesuai farm.js Anda)
        return Math.min(maxSlots, 4);
    },


    
   ShopItems: {
        // ASSETS
        'land_2':       { price: 10000, type: 'land', tier: 1 },
        'land_3':       { price: 750000, type: 'land', tier: 2 },
        'storage_plus': { price: 5000,  type: 'storage', amount: 20 },

        // CONSUMABLES (BUFFS)
        'speed_soil':   { price: 500,  type: 'buff', buffKey: 'speed_soil', duration: 86400000 },
        'growth_fert':  { price: 1000, type: 'buff', buffKey: 'growth_speed', duration: 86400000 },
        'trade_permit': { price: 2000, type: 'buff', buffKey: 'sell_bonus', duration: 86400000 },
        'yield_boost':  { price: 2500, type: 'buff', buffKey: 'yield_bonus', duration: 86400000 },
        'rare_boost':   { price: 3000, type: 'buff', buffKey: 'rare_luck', duration: 86400000 },
    },

    // Helper untuk hitung Multiplier Jual (Sesuai logic market.js)
    getSellMultiplier: (user) => {
        let multiplier = 1;
        const now = Date.now();
        
        // Cek Booster Iklan
        if (user.adBoosterCooldown && user.adBoosterCooldown > now) {
            multiplier += 0.2; 
        }
        
        // Cek Buff Trade Permit
        if (user.activeBuffs && user.activeBuffs['sell_bonus'] > now) {
            multiplier += 0.15;
        }
        
        return multiplier;
    },

    Spin: {
        CostPaid: 150,
        CooldownFree: 3600000, // 1 Jam
        Rewards: [
            // Bobot (weight) menentukan peluang. Total weight tidak harus 100.
            // ID: index array (0-7) sesuai visual roda Anda
            { id: 0, type: 'coin', val: 50, weight: 40 },    // Low Coin
            { id: 1, type: 'herb', rarity: 'Common', weight: 30 }, // Common Herb
            { id: 2, type: 'coin', val: 200, weight: 20 },   // High Coin
            { id: 3, type: 'herb', rarity: 'Common', weight: 30 }, // Common Herb
            { id: 4, type: 'coin', val: 100, weight: 20 },   // Mid Coin
            { id: 5, type: 'herb', rarity: 'Rare', weight: 9 },    // Rare Herb
            { id: 6, type: 'jackpot', val: 1000, weight: 1 }, // JACKPOT
            { id: 7, type: 'coin', val: 50, weight: 40 }     // Low Coin
        ]
    },

    // Helper RNG Server Side
    rollSpin: () => {
        const rewards = GameConfig.Spin.Rewards;
        const totalWeight = rewards.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of rewards) {
            if (random < item.weight) return item;
            random -= item.weight;
        }
        return rewards[0]; // Fallback
    }
};




module.exports = GameConfig;

