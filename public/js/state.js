// js/state.js
// State Management & Configuration
// Updated: Connected to Vercel API (No more direct Firebase)

// 1. KONFIGURASI PLAN (Sesuai File Asli)
const PlanConfig = {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "Medium" },
    TENANT: { name: "Tenant Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "None" },
    OWNER: { name: "Owner Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 9999, ads: "None" }
};

// 2. DATA HARGA & RARITY (Sesuai File Asli)
const PriceRanges = {};
const CropRarity = {};
if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
        CropRarity[key] = { chance: HerbData[key].chance, rarity: HerbData[key].rarity };
    }
}

// 3. ENGINE GACHA (Sesuai File Asli)
const DropEngine = {
    roll() {
        const rand = Math.random() * 100;
        let rareBonus = 0;
        if (window.GameState && GameState.user && GameState.user.activeBuffs) {
            const buffs = GameState.user.activeBuffs;
            if (buffs['rare_luck'] && buffs['rare_luck'] > Date.now()) {
                rareBonus = 20.0;
            }
        }
        let cumulative = 0;
        for (const key in CropRarity) {
            let chance = CropRarity[key].chance;
            if (CropRarity[key].rarity !== 'Common' && CropRarity[key].rarity !== 'Uncommon') {
                chance += (chance * (rareBonus / 100));
            }
            cumulative += chance;
            if (rand <= cumulative) return key;
        }
        return 'ginger';
    }
};

// 4. DATA DEFAULT USER (SAMA PERSIS DENGAN FILE ASLI)
const defaultUser = {
    username: "New Tycoon",
    userId: null, 
    plan: "FREE", 
    coins: 0, 
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    totalAffiliateEarnings: 0,
    totalFreeEarnings: 0, 
    totalWithdrawn: 0,     
    totalSpent: 0,   
    has_withdrawn: false,
    faucetpay_email: null,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    
    // Data Backend
    task_cooldowns: {},      
    ad_timers: {},           
    activeBuffs: {},
    upline: null,
    referral_status: 'Pending',
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

// 5. GAME STATE UTAMA
let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,
    isSaving: false,
    isSyncing: false, // [BARU] Penahan Autosave saat Transaksi API

    // --- FUNGSI LOAD (DARI API) ---
    async load() {
        console.log("🔄 [STATE] Connecting to Server...");
        let finalUserId, finalUsername;

        // 1. Deteksi User Telegram
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            finalUserId = "TG-" + tgUser.id;
            finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
            window.Telegram.WebApp.expand();
        } else {
            // Mode Browser/Test (Hanya untuk Development)
            console.warn("⚠️ Mode Browser: Menggunakan ID Tester");
            finalUserId = "TG-TESTER-123";
            finalUsername = "Juragan Lokal";
        }

        this.user.userId = finalUserId;

        try {
            // 2. Panggil API Load yang baru Anda buat
            const response = await fetch(`/api/load?userId=${finalUserId}`);
            const result = await response.json();

            if (result.exists && result.data) {
                // USER LAMA: Load data dari server
                console.log("✅ [STATE] Data loaded from Server");
                const data = result.data;
                
                // Merge data server dengan defaultUser (agar variable baru tidak undefined)
                this.user = { ...defaultUser, ...data.user };
                this.user.username = finalUsername; // Update nama jika user ganti nama di TG
                
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                // USER BARU: Inisialisasi Lokal
                console.log("🆕 [STATE] New User detected.");
                this.user.username = finalUsername;
                this.farmPlots = []; // Biarkan kosong, nanti farm.js yang handle visualnya
                await this.save(true); // Save perdana ke server
            }
            
            this.isLoaded = true;
            
            // Refresh UI setelah data masuk
            if(window.UIEngine) UIEngine.updateHeader();
            if(window.FarmSystem) FarmSystem.init(); 
            
        } catch (e) {
            console.error("❌ [STATE] Load Failed:", e);
            this.isLoaded = true; // Tetap set true agar game tidak stuck loading
        }
    },

    // --- FUNGSI SAVE (KE API) ---
    async save(force = false) {
        // [PENTING] Jangan save jika belum load atau sedang sinkronisasi transaksi
        if (!this.isLoaded && !force) return;
        if (this.isSaving || this.isSyncing) return; 

        this.isSaving = true;
        this.user.lastActive = Date.now();

        const payload = {
            user: this.user,
            warehouse: this.warehouse,
            farmPlots: this.farmPlots,
            market: this.market
        };

        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.userId,
                    payload: payload
                })
            });
        } catch (e) {
            console.error("⚠️ [STATE] Save Background Error:", e);
        } finally {
            this.isSaving = false;
        }
    },

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
            this.save(); // Save harga baru ke server
            return true;
        }
        return false;
    },

    getPrice(key) {
        return (this.market.prices && this.market.prices[key]) ? this.market.prices[key] : (PriceRanges[key]?.min || 10);
    }
};

// Autosave setiap 10 detik (Hanya jika tidak sedang Sync)
setInterval(() => {
    if(GameState.isLoaded && !GameState.isSyncing) GameState.save();
}, 10000);

// Export ke Window (PENTING AGAR UI BISA BACA)
window.GameState = GameState;
window.PlanConfig = PlanConfig;
window.CropRarity = CropRarity;
window.DropEngine = DropEngine;
window.PriceRanges = PriceRanges;
