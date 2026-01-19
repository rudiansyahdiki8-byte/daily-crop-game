// js/state.js
// STATE MANAGEMENT (FRONTEND)
// Versi Fix: Ditambahkan 'isSyncing' untuk mencegah bentrok data dengan API

// 1. DATA DEFAULT
const defaultUser = {
    username: "Juragan Baru",
    userId: null, 
    plan: "FREE", 
    coins: 100, 
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
    user: { ...defaultUser }, 
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,
    isSaving: false,
    isSyncing: false, // <--- TAMBAHAN PENTING: Flag untuk menahan autosave saat API jalan

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
            
            // Cek jika response HTML (error Vercel biasanya HTML)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server response is not JSON");
            }

            const result = await response.json();

            if (result.exists && result.data) {
                // USER LAMA: Load data dari server
                console.log("✅ [STATE] Data loaded from Server");
                const data = result.data;
                
                // Merge data server dengan defaultUser
                this.user = { ...defaultUser, ...data.user };
                this.user.username = finalUsername; 
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                // USER BARU: Inisialisasi data awal
                console.log("🆕 [STATE] New User detected, initializing...");
                this.user.username = finalUsername;
                
                // Beri lahan awal (Default 4 slot sesuai farm.js Anda)
                this.farmPlots = [
                    { id: 1, status: 'empty', plant: null, harvestAt: 0 },
                    { id: 2, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 3, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 4, status: 'locked', plant: null, harvestAt: 0 }
                ];
                
                await this.save(true);
            }
            this.isLoaded = true;
            
            // Refresh UI
            if(window.UIEngine) UIEngine.updateHeader();
            if(window.FarmSystem) FarmSystem.init(); // Render ulang farm setelah data masuk
            
        } catch (e) {
            console.error("❌ [STATE] Load Failed:", e);
            // Tetap set loaded agar game tidak stuck loading
            this.isLoaded = true;
        }
    },

    // --- FUNGSI SAVE (KE SERVER) ---
    async save(force = false) {
        // PERBAIKAN: Jangan save jika sedang Sync API (biar data server tidak tertimpa data lama)
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
    // Logika Harga Dinamis (Tetap dipertahankan untuk tampilan UI)
    getPrice(cropKey) {
        if (!window.GameConfig || !window.GameConfig.Crops) return 10;
        const crop = window.GameConfig.Crops[cropKey];
        if (!crop) return 10;

        const now = new Date();
        const timeSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
        const uniqueFactor = cropKey.length + (crop.time || 0);
        const randomFactor = Math.abs(Math.sin(timeSeed + uniqueFactor));
        const range = crop.maxPrice - crop.minPrice;
        const finalPrice = Math.floor(crop.minPrice + (range * randomFactor));
        
        return finalPrice;
    },
    
    refreshMarketPrices() {
        const now = Date.now();
        // Update tiap jam
        if (now - this.market.lastRefresh > 3600000) {
            this.market.lastRefresh = now;
            if(window.MarketSystem && document.getElementById('Shop') && !document.getElementById('Shop').classList.contains('hidden')) {
                MarketSystem.renderShop();
            }
        }
    }
};

// Autosave setiap 10 detik (Hanya jika tidak sedang Sync)
setInterval(() => {
    if(GameState.isLoaded && !GameState.isSyncing) GameState.save();
}, 10000);

window.GameState = GameState;

// Placeholder PlanConfig
window.PlanConfig = {
    FREE: { name: "Free Farmer" },
    MORTGAGE: { name: "Mortgage Farmer" },
    TENANT: { name: "Tenant Farmer" },
    OWNER: { name: "Owner Farmer" }
};
