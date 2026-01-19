// js/state.js
// STATE MANAGEMENT (FRONTEND)
// Versi Baru: Terkoneksi ke Backend Vercel (API), bukan Firebase langsung.

// 1. DATA DEFAULT (Template jika user baru main)
const defaultUser = {
    username: "Juragan Baru",
    userId: null, 
    plan: "FREE", 
    coins: 100, // Modal awal (Server yang menentukan validitasnya nanti)
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
    isSaving: false, // Flag untuk mencegah spam save

    // --- FUNGSI LOAD (PANGGIL API VERCEL) ---
    async load() {
        console.log("🔄 [STATE] Connecting to Server...");

        // A. Deteksi User ID (Telegram / Browser)
        let finalUserId, finalUsername;

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            // Mode Telegram Asli
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            finalUserId = "TG-" + tgUser.id;
            finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
            window.Telegram.WebApp.expand();
        } else {
            // Mode Testing Browser (Bypass)
            console.warn("⚠️ Mode Browser: Menggunakan ID Tester");
            finalUserId = "TG-TESTER-123";
            finalUsername = "Juragan Lokal";
        }

        this.user.userId = finalUserId;

        // B. Panggil API Load
        try {
            // Kita panggil file 'api/load.js' yang ada di Vercel
            const response = await fetch(`/api/load?userId=${finalUserId}`);
            
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            
            const result = await response.json();

            if (result.exists && result.data) {
                // KASUS 1: USER LAMA (Data ada di Server)
                console.log("✅ [STATE] Data loaded from Server");
                const data = result.data;
                
                this.user = { ...defaultUser, ...data.user }; // Merge agar field baru tidak hilang
                this.user.username = finalUsername; // Update nama sesuai Telegram terbaru
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                
                // Market prices diambil dari server config nanti, tapi kita load dulu yg tersimpan
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                // KASUS 2: USER BARU (Server belum punya data)
                console.log("🆕 [STATE] New User detected, initializing...");
                this.user.username = finalUsername;
                
                // Siapkan 4 Plot Awal
                this.farmPlots = [
                    { id: 1, status: 'empty', plant: null, harvestAt: 0 },
                    { id: 2, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 3, status: 'locked', plant: null, harvestAt: 0 },
                    { id: 4, status: 'locked', plant: null, harvestAt: 0 }
                ];

                // Paksa Simpan Pertama Kali agar data terbentuk di Server
                await this.save(true);
            }

            this.isLoaded = true;
            
            // Render Ulang Header & Farm jika UI sudah siap
            if(window.UIEngine) UIEngine.updateHeader();
            if(window.FarmSystem) FarmSystem.init();

        } catch (e) {
            console.error("❌ [STATE] Load Failed:", e);
            // Tampilkan pesan error ke user (opsional)
            // alert("Gagal terhubung ke Server. Cek koneksi internet.");
            
            // Tetap set true agar tidak stuck loading screen (User masuk mode offline sementara)
            this.isLoaded = true; 
        }
    },

    // --- FUNGSI SAVE (PANGGIL API VERCEL) ---
    async save(force = false) {
        // Jangan save jika belum load atau tidak dipaksa
        if (!this.isLoaded && !force) return;
        if (this.isSaving) return; // Mencegah double request

        this.isSaving = true;
        this.user.lastActive = Date.now();

        // Siapkan Paket Data
        const payload = {
            user: this.user,
            warehouse: this.warehouse,
            farmPlots: this.farmPlots,
            market: this.market
        };

        try {
            // Kita panggil file 'api/save.js'
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.userId,
                    payload: payload
                })
            });

            if (!response.ok) throw new Error("Save rejected by server");
            
            // Jika ingin debug: console.log("💾 [STATE] Saved.");
            
            if(window.UIEngine) UIEngine.updateHeader();

        } catch (e) {
            console.error("⚠️ [STATE] Save Failed (Background):", e);
        } finally {
            this.isSaving = false;
        }
    },

    // --- UTILITIES (HELPER) ---
    
    // Mengambil harga dari GameConfig yang sudah diload dari server
    getPrice(key) {
        // Fallback ke config lokal jika server belum respond
        if (window.GameConfig && window.GameConfig.Crops && window.GameConfig.Crops[key]) {
            // Ambil harga rata-rata atau min price sebagai display
            return window.GameConfig.Crops[key].minPrice;
        }
        return 10;
    },
    
    // Refresh market (sekarang logic ini bisa dipindah ke server, tapi untuk display visual tetap di sini)
    refreshMarketPrices() {
        const now = Date.now();
        // Cek apakah perlu refresh visual
        if (now - this.market.lastRefresh > 3600000) {
            this.market.lastRefresh = now;
            this.save();
        }
    }
};

// Autosave setiap 10 detik
setInterval(() => {
    if(GameState.isLoaded) GameState.save();
}, 10000);

// Expose ke Window
window.GameState = GameState;

// PlanConfig & DropEngine dipindah logic-nya ke Server, 
// tapi kita simpan placeholder di sini agar UI tidak error.
window.PlanConfig = {
    FREE: { name: "Free Farmer" },
    MORTGAGE: { name: "Mortgage Farmer" },
    TENANT: { name: "Tenant Farmer" },
    OWNER: { name: "Owner Farmer" }
};
