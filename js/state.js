// js/state.js
// State Management & Configuration
// Updated: Removed 'initSystems' because it is handled by 'bootstrap.js'

// 1. KONFIGURASI PLAN (Visual Badge Only)
// Limit gudang dan slot sekarang diatur logic, ini hanya referensi nama.
const PlanConfig = {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "Medium" },
    TENANT: { name: "Tenant Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "None" },
    OWNER: { name: "Owner Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 9999, ads: "None" }
};

// 2. DATA HARGA & RARITY (Otomatis ambil dari herbs.js)
const PriceRanges = {};
const CropRarity = {};
if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
        CropRarity[key] = { chance: HerbData[key].chance, rarity: HerbData[key].rarity };
    }
}

// 3. ENGINE GACHA (Untuk Tanam Random)
const DropEngine = {
    roll() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const key in CropRarity) {
            cumulative += CropRarity[key].chance;
            if (rand <= cumulative) return key;
        }
        return 'ginger';
    }
};

// 4. DATA DEFAULT USER (Struktur ini TIDAK BERUBAH agar Firebase Aman)
const defaultUser = {
    username: "Juragan Baru",
    userId: "DC-" + Math.floor(Math.random() * 900000),
    plan: "FREE", 
    
    // STARTING BALANCE: 500 PTS (Sesuai Ekonomi Baru)
    coins: 500, 
    
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    has_withdrawn: false,
    faucetpay_email: null,
    
    // ITEM BARU (Market Integration)
    landPurchasedCount: 0,   
    extraStorage: 0,         
    adBoosterCooldown: 0,    
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

    // LOAD FUNCTION (Firebase)
    async load() {
        if (!window.db) return;

        const localId = localStorage.getItem('dc_user_id');
        if (localId) this.user.userId = localId;

        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        try {
            const docSnap = await window.fs.getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Merge agar field baru (seperti activeBuffs) masuk ke user lama
                this.user = { ...defaultUser, ...data.user };
                this.warehouse = data.warehouse || {};
                this.market = data.market || { prices: {}, lastRefresh: 0 };
                this.farmPlots = data.farmPlots || [];
                console.log("Firebase Data Loaded");
            } else {
                localStorage.setItem('dc_user_id', this.user.userId);
                await this.save();
            }

            this.isLoaded = true;
            // CATATAN: initSystems() DIHAPUS DARI SINI
            // Karena sekarang dijalankan oleh bootstrap.js setelah load selesai.
            
        } catch (e) {
            console.error("Load Failed:", e);
        }
    },

    // SAVE FUNCTION
    async save() {
        if (!window.db || !this.isLoaded) return;
        this.user.lastActive = Date.now();
        
        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        try {
            await window.fs.setDoc(userRef, {
                user: this.user,
                warehouse: this.warehouse,
                market: this.market,
                farmPlots: this.farmPlots
            }, { merge: true });
            
            // Update Header UI setiap kali save agar saldo sinkron
            if(window.UIEngine) UIEngine.updateHeader();
        } catch (e) {
            console.error("Save Failed:", e);
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
            this.save();
            return true;
        }
        return false;
    },

    getPrice(key) {
        return (this.market.prices && this.market.prices[key]) ? this.market.prices[key] : (PriceRanges[key]?.min || 10);
    }
};

// Autosave setiap 10 detik
setInterval(() => {
    if(GameState.isLoaded) GameState.save();
}, 10000);

window.GameState = GameState;
window.PlanConfig = PlanConfig;
window.CropRarity = CropRarity;
window.DropEngine = DropEngine;
window.PriceRanges = PriceRanges;