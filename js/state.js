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
        
        // Cek Buff Rare Luck dari User (jika ada)
        let rareBonus = 0;
        if (window.GameState && GameState.user && GameState.user.activeBuffs) {
            const buffs = GameState.user.activeBuffs;
            if (buffs['rare_luck'] && buffs['rare_luck'] > Date.now()) {
                rareBonus = 20.0; // Tambahan 20% Chance
            }
        }

        let cumulative = 0;
        for (const key in CropRarity) {
            let chance = CropRarity[key].chance;
            
            // Logika Bonus Rare:
            // Jika tanaman Rare/Epic/Legendary, tambah peluangnya
            if (CropRarity[key].rarity !== 'Common' && CropRarity[key].rarity !== 'Uncommon') {
                chance += (chance * (rareBonus / 100)); 
            }
            
            cumulative += chance;
            if (rand <= cumulative) return key;
        }
        return 'ginger'; // Fallback
    }
};

// 4. DATA DEFAULT USER (UPDATED)
const defaultUser = {
    username: "New Tycoon", // Ganti ke Inggris biar keren
    userId: null, 
    plan: "FREE", 
    coins: 0, 
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    totalFreeEarnings: 0, // Koin dari Task
    totalWithdrawn: 0,    // [BARU] Total yang sudah dicairkan
    has_withdrawn: false,
    faucetpay_email: null,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    
    // --- TEMPAT PENYIMPANAN BARU (SERVER SIDE) ---
    // Agar data tidak hilang saat ganti HP
    task_cooldowns: {},      // Simpan waktu claim daily task
    ad_timers: {},           // Simpan waktu cooldown iklan (Adexium)
    
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

        // --- 1. STRICT TELEGRAM CHECK ---
        // Cek apakah data user dari Telegram tersedia
        if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
            // JIKA BUKAN TELEGRAM: Blokir Total
            document.body.innerHTML = `
                <div style="
                    display:flex; 
                    flex-direction:column; 
                    align-items:center; 
                    justify-content:center; 
                    height:100vh; 
                    background: radial-gradient(circle at center, #1f2937, #000); 
                    color:white; 
                    text-align:center; 
                    font-family: sans-serif;
                    padding: 20px;
                ">
                    <div style="font-size: 50px; margin-bottom: 20px;">⛔</div>
                    <h1 style="color:#ef4444; font-size:24px; margin-bottom:10px; font-weight: 900; letter-spacing: 2px;">ACCESS DENIED</h1>
                    <p style="color:#9ca3af; margin-bottom:30px; font-size: 14px;">
                        This game is designed exclusively for Telegram.<br>
                        Please open the bot to play.
                    </p>
                    <a href="https://t.me/Daily_Cropbot" 
                       style="
                           background: linear-gradient(to right, #10b981, #059669); 
                           color:white; 
                           padding: 15px 30px; 
                           border-radius: 15px; 
                           text-decoration:none; 
                           font-weight:bold; 
                           font-size: 14px;
                           box-shadow: 0 10px 20px rgba(16,185,129,0.3);
                           transition: transform 0.2s;
                           border: 1px solid rgba(255,255,255,0.2);
                       ">
                        👉 OPEN TELEGRAM BOT
                    </a>
                </div>
            `;
            return; // Stop proses loading
        }

        // --- 2. JIKA LULUS, AMBIL DATA ---
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        const finalUserId = "TG-" + tgUser.id;
        const finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
        
        window.Telegram.WebApp.expand(); // Fullscreen
        console.log("Logged in as Telegram User:", finalUserId);

        this.user.userId = finalUserId;

        // --- 3. LOAD DATA FIREBASE ---
        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        try {
            const docSnap = await window.fs.getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.user = { ...defaultUser, ...data.user };
                this.user.username = finalUsername; // Selalu update nama asli
                this.warehouse = data.warehouse || {};
                this.market = data.market || { prices: {}, lastRefresh: 0 };
                this.farmPlots = data.farmPlots || [];
            } else {
                // User Baru
                this.user.username = finalUsername;
                await this.save();
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



