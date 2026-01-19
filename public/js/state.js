// js/state.js
// STATE MANAGEMENT (FRONTEND)
// Versi Baru: Terkoneksi ke Backend Vercel (API) & Harga Dinamis Per Jam.

// 1. DATA DEFAULT (PENTING: JANGAN DIHAPUS)
// Ini template untuk user baru. Jika dihapus, user baru akan error.
const defaultUser = {
    username: "Juragan Baru",
    userId: null, 
    plan: "FREE", 
    coins: 100, // Modal awal
    lastActive: Date.now(),
    isFirstPlantDone: false, 
    totalHarvest: 0,
    totalSold: 0,
    has_withdrawn: false,
    faucetpay_email: null,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    
    // Data Iklan & Cooldown
    task_cooldowns: {},      
    ad_timers: {},           
    
    activeBuffs: {},
    upline: null,
    referral_status: 'Pending',
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

// 2. GAME STATE UTAMA
let GameState = {
    user: { ...defaultUser }, // Copy data default ke user saat ini
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,
    isSaving: false,

    // --- FUNGSI LOAD (DARI SERVER) ---
    async load() {
        console.log("🔄 [STATE] Connecting to Server...");
        let finalUserId, finalUsername;

        // Deteksi Telegram vs Browser
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            finalUserId = "TG-" + tgUser.id;
            finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
            window.Telegram.WebApp.expand();
        } else {
            console.warn("⚠️ Mode Browser: Menggunakan ID Tester");
            finalUserId = "TG-TESTER-123";
            finalUsername = "Juragan Lokal";
        }

        this.user.userId = finalUserId;

        try {
            const response = await fetch(`/api/load?userId=${finalUserId}`);
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            
            const result = await response.json();

            if (result.exists && result.data) {
                // USER LAMA: Load data dari server
                console.log("✅ [STATE] Data loaded from Server");
                const data = result.data;
                
                // Merge data server dengan defaultUser (agar field baru tidak error)
                this.user = { ...defaultUser, ...data.user };
                this.user.username = finalUsername; // Update nama
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                // USER BARU: Inisialisasi data awal
                console.log("🆕 [STATE] New User detected, initializing...");
                this.user.username = finalUsername;
                
                // Beri lahan awal
                this.farmPlots = [
                    { id: 1, status: 'empty', plant: null, harvestAt: 0 },
                    { id: 2, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 3, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 4, status: 'locked', plant: null, harvestAt: 0 }
                ];
                
                // Simpan ke server agar terdaftar
                await this.save(true);
            }
            this.isLoaded = true;
            
            // Refresh UI
            if(window.UIEngine) UIEngine.updateHeader();
            if(window.FarmSystem) FarmSystem.init();

        } catch (e) {
            console.error("❌ [STATE] Load Failed:", e);
            // Tetap masuk game (mode offline sementara) agar tidak stuck
            this.isLoaded = true; 
        }
    },

    // --- FUNGSI SAVE (KE SERVER) ---
    async save(force = false) {
        if (!this.isLoaded && !force) return;
        if (this.isSaving) return;

        this.isSaving = true;
        this.user.lastActive = Date.now();

        const payload = {
            user: this.user,
            warehouse: this.warehouse,
            farmPlots: this.farmPlots,
            market: this.market
        };

        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.userId,
                    payload: payload
                })
            });
            if (!response.ok) throw new Error("Save rejected by server");
            if(window.UIEngine) UIEngine.updateHeader();
        } catch (e) {
            console.error("⚠️ [STATE] Save Failed (Background):", e);
        } finally {
            this.isSaving = false;
        }
    },

    // --- UTILITIES (HELPER) ---
    
    // [LOGIKA BARU] HARGA BERGERAK TIAP JAM (CRYPTO STYLE)
    getPrice(cropKey) {
        // 1. Cek Config
        if (!window.GameConfig || !window.GameConfig.Crops) return 10;
        
        const crop = window.GameConfig.Crops[cropKey];
        if (!crop) return 10;

        // 2. Buat "Seed" Berdasarkan Jam (Agar harga berubah tiap jam)
        const now = new Date();
        const timeSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
        
        // 3. Tambah Variasi Nama Tanaman (Agar harga Jahe != harga Cabai)
        const uniqueFactor = cropKey.length + (crop.time || 0);
        
        // 4. Rumus Sinus (Gelombang Naik Turun 0.0 - 1.0)
        const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor)); 

        // 5. Hitung Harga Akhir (Antara Min dan Max)
        const range = crop.maxPrice - crop.minPrice;
        const finalPrice = Math.floor(crop.minPrice + (range * randomFactor));
        
        return finalPrice;
    },
    
    refreshMarketPrices() {
        const now = Date.now();
        // Cek apakah sudah ganti jam?
        if (now - this.market.lastRefresh > 3600000) {
            this.market.lastRefresh = now;
            // Update UI jika sedang buka Shop
            if(window.MarketSystem && document.getElementById('Shop') && !document.getElementById('Shop').classList.contains('hidden')) {
                MarketSystem.renderShop();
            }
        }
    }
};

// Autosave setiap 10 detik
setInterval(() => {
    if(GameState.isLoaded) GameState.save();
}, 10000);

window.GameState = GameState;

// Placeholder PlanConfig (Biar UI tidak error sebelum load config server)
window.PlanConfig = {
    FREE: { name: "Free Farmer" },
    MORTGAGE: { name: "Mortgage Farmer" },
    TENANT: { name: "Tenant Farmer" },
    OWNER: { name: "Owner Farmer" }
};
