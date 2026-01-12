// js/state.js
// State Management & Configuration
// Updated: Telegram ID Integration for Permanent Save

// 1. KONFIGURASI PLAN
const PlanConfig = {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "Medium" },
    TENANT: { name: "Tenant Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "None" },
    OWNER: { name: "Owner Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 9999, ads: "None" }
};

// 2. DATA HARGA & RARITY
const PriceRanges = {};
const CropRarity = {};
if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
        CropRarity[key] = { chance: HerbData[key].chance, rarity: HerbData[key].rarity };
    }
}

// 3. ENGINE GACHA
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

// 4. DATA DEFAULT USER
const defaultUser = {
    username: "Juragan Baru",
    userId: null, // Nanti diisi otomatis saat Load
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
    spin_free_cooldown: 0, 
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

    async load() {
        if (!window.db) return;

        // --- DETEKSI IDENTITAS USER (SANGAT PENTING) ---
        let finalUserId = null;
        let finalUsername = "Juragan Baru";
        let isTelegram = false;

        // 1. Cek Apakah di dalam Telegram?
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            // YES: Pakai ID Telegram (Permanen walaupun clear history)
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            finalUserId = "TG-" + tgUser.id;
            finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
            isTelegram = true;
            
            // Expand tampilan Telegram agar full screen
            window.Telegram.WebApp.expand(); 
            console.log("Logged in as Telegram User:", finalUserId);
        } 
        else {
            // NO: Pakai LocalStorage (Browser Biasa)
            const localId = localStorage.getItem('dc_user_id');
            if (localId) {
                finalUserId = localId;
            } else {
                // Buat ID baru jika belum ada
                finalUserId = "WEB-" + Math.floor(Math.random() * 9000000);
                localStorage.setItem('dc_user_id', finalUserId);
            }
            console.log("Logged in as Web User:", finalUserId);
        }

        this.user.userId = finalUserId;
        
        // --- AMBIL DATA DARI FIREBASE ---
        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        try {
            const docSnap = await window.fs.getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Merge data (Prioritas Data Cloud, tapi update Username jika dari Telegram)
                this.user = { ...defaultUser, ...data.user };
                if (isTelegram) this.user.username = finalUsername; // Selalu update nama sesuai Telegram
                
                this.warehouse = data.warehouse || {};
                this.market = data.market || { prices: {}, lastRefresh: 0 };
                this.farmPlots = data.farmPlots || [];
                console.log("Firebase Data Loaded Successfully");
            } else {
                // User Baru (Belum ada di Cloud)
                this.user.username = isTelegram ? finalUsername : "Juragan Baru";
                await this.save(); // Buat data baru di Cloud
                console.log("New User Created in Cloud");
            }

            this.isLoaded = true;
        } catch (e) {
            console.error("Load Failed:", e);
            this.isLoaded = true; 
        }
    },

    async save() {
        if (!window.db || !this.isLoaded || !this.user.userId) return;
        this.user.lastActive = Date.now();
        
        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        try {
            await window.fs.setDoc(userRef, {
                user: this.user,
                warehouse: this.warehouse,
                market: this.market,
                farmPlots: this.farmPlots
            }, { merge: true });
            
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

// Autosave
setInterval(() => {
    if(GameState.isLoaded) GameState.save();
}, 10000);

window.GameState = GameState;
window.PlanConfig = PlanConfig;
window.CropRarity = CropRarity;
window.DropEngine = DropEngine;
window.PriceRanges = PriceRanges;
