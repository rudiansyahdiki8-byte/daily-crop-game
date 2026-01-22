// js/state.js
// State Management & Configuration
// Updated for Membership System: Luck, Expiration, and Database

// 1. DATA HARGA & RARITY (Mengambil dari Config)
const PriceRanges = {};
const CropRarity = {};

// Pastikan Config sudah dimuat
if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
        CropRarity[key] = { chance: HerbData[key].chance, rarity: HerbData[key].rarity };
    }
}

// 2. ENGINE GACHA (UPDATED: Support Luck Level Membership)
const DropEngine = {
    roll() {
        // Ambil Data Plan User
        const userPlan = (window.GameState && GameState.user) ? GameState.user.plan : 'FREE';
        const planConfig = window.GameConfig.Plans[userPlan] || window.GameConfig.Plans['FREE'];
        const luckLevel = planConfig.luck; // Normal, Rare, Epic, Legendary

        const rand = Math.random() * 100;
        
        // LOGIKA PENINGKATAN PELUANG (Berdasarkan Membership)
        let multiplier = 1.0;
        if (luckLevel === 'Rare') multiplier = 1.2;      // +20% chance rare
        if (luckLevel === 'Epic') multiplier = 1.5;      // +50% chance rare/epic
        if (luckLevel === 'Legendary') multiplier = 2.0; // 2x Lipat chance semua bagus

        // Cek Buff Item User (Jika ada activeBuffs - Fortune Essence)
        if (window.GameState && GameState.user && GameState.user.activeBuffs) {
            const buffs = GameState.user.activeBuffs;
            if (buffs['rare_luck'] && buffs['rare_luck'] > Date.now()) {
                multiplier += 0.2; // Tambah lagi 20%
            }
        }

        let cumulative = 0;
        for (const key in CropRarity) {
            let baseChance = CropRarity[key].chance;
            
            // Apply Multiplier hanya untuk tanaman NON-COMMON
            // Agar user VIP lebih sering dapat barang mahal
            if (CropRarity[key].rarity !== 'Common' && CropRarity[key].rarity !== 'Uncommon') {
                baseChance = baseChance * multiplier;
            }
            
            cumulative += baseChance;
            if (rand <= cumulative) return key;
        }
        
        // Fallback jika roll gagal (biasanya dapat Ginger)
        return 'ginger'; 
    }
};

// 3. DATA DEFAULT USER
const defaultUser = {
    username: "New Farmer",
    userId: null, 
    
    // MEMBERSHIP DATA
    plan: "FREE", 
    planExpiresAt: 0, // 0 = Permanen/Belum aktif. Format: Timestamp (Date.now())

    coins: 0, 
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    
    // STATISTIK
    totalHarvest: 0,
    totalSold: 0,
    totalSpent: 0,
    
    // ASET
    landPurchasedCount: 0,   // Slot tambahan yang dibeli di shop
    extraStorage: 0,         // Kapasitas tambahan yang dibeli di shop
    
    // SYSTEM
    task_cooldowns: {},      
    ad_timers: {},           
    activeBuffs: {},
    
    // AFFILIATE
    upline: null,
    referral_status: 'Pending',
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] },
    
    // HISTORY
    history: [],      // Withdraw history
    sales_history: [], // Jualan history
    buy_history: []    // Beli Membership/Item history
};

// 4. GAME STATE UTAMA
let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,

    // FUNGSI BARU: Cek Status Membership (PENTING)
    getActivePlan() {
        const user = this.user;
        const now = Date.now();
        
        // Jika plan bukan FREE dan waktunya sudah habis (Expired)
        if (user.plan !== 'FREE' && user.planExpiresAt > 0 && now > user.planExpiresAt) {
            console.log("[SYSTEM] Membership Expired. Downgrading to FREE.");
            
            // Simpan notifikasi log (opsional)
            if (!user.history) user.history = [];
            user.history.unshift({
                date: new Date().toLocaleDateString(),
                method: 'System',
                amount: 0,
                destination: 'Membership Expired',
                status: 'Downgraded'
            });

            // Turunkan ke FREE
            user.plan = 'FREE';
            user.planExpiresAt = 0;
            this.save(); 
        }
        
        // Kembalikan Config Plan user saat ini agar bisa dibaca file lain
        return window.GameConfig.Plans[user.plan] || window.GameConfig.Plans['FREE'];
    },

    async load() {
        if (!window.db) return;
        
        // --- PROSES LOGIN TELEGRAM ---
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            this.user.userId = "TG-" + tgUser.id;
            const finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");

            const userRef = window.fs.doc(window.db, "users", this.user.userId);
            try {
                const docSnap = await window.fs.getDoc(userRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Gabungkan data user agar field baru (planExpiresAt) masuk
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
                
                // Cek apakah plan expired saat login pertama kali
                this.getActivePlan(); 
                
            } catch (e) {
                console.error("Load Failed:", e);
                // Tetap set true agar UI tidak stuck loading, tapi data kosong
                this.isLoaded = true; 
            }
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
            
            // Update UI Header (Koin/Nama) setiap kali save
            if(window.UIEngine) UIEngine.updateHeader();
        } catch (e) { console.error("Save Failed:", e); }
    },

    refreshMarketPrices() {
        const now = Date.now();
        // Refresh harga setiap 1 jam (3600000 ms)
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
setInterval(() => { if(GameState.isLoaded) GameState.save(); }, 10000);

// Expose ke Global Window
window.GameState = GameState;
window.CropRarity = CropRarity;
window.DropEngine = DropEngine;
window.PriceRanges = PriceRanges;