// js/state.js
// ==========================================
// STATE MANAGEMENT (CLIENT-SIDE READ ONLY)
// Update: Fungsi save() ke Firebase dimatikan. 
// Data hanya diperbarui lewat API Server response.
// ==========================================

// Config Level Petani (Hanya visual, validasi asli di server)
const PlanConfig = window.PlanConfig || {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "Medium" },
    TENANT: { name: "Tenant Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "None" },
    OWNER: { name: "Owner Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 9999, ads: "None" }
};

// Data User Default
const defaultUser = {
    username: "New User",
    userId: null, 
    plan: "FREE", 
    coins: 0, 
    totalHarvest: 0,
    totalSold: 0,
    landPurchasedCount: 0,   
    extraStorage: 0,         
    activeBuffs: {},
    task_cooldowns: {},
    spin_free_cooldown: 0,
    // Data Affiliate & Finance
    upline: null,
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] },
    has_withdrawn: false,
    faucetpay_email: null
};

let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {} },
    isLoaded: false,

    // --- 1. LOAD DATA (MENDENGARKAN SERVER) ---
    async load() {
        if (!window.db) {
            console.error("Database belum terhubung (cek bootstrap.js)");
            return;
        }

        // Cek User Telegram
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        // JIKA DEBUG DI BROWSER BIASA (TANPA TELEGRAM):
        // Gunakan ID dummy untuk testing. 
        // Nanti saat deploy, pastikan baris ini aman atau dihapus.
        const finalUserId = tgUser ? ("TG-" + tgUser.id) : "TG-DEBUG-123";
        const finalUsername = tgUser ? tgUser.first_name : "Debug User";

        this.user.userId = finalUserId;
        this.user.username = finalUsername;

        console.log("[STATE] Listening to data for:", finalUserId);

        // LISTEN REALTIME (onSnapshot)
        // Ini fitur hebat Firebase: Saat Server Vercel update DB, 
        // Game di HP user akan otomatis berubah tanpa perlu refresh!
        const userRef = window.fs.doc(window.db, "users", this.user.userId);
        
        window.fs.onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                
                // Gabungkan data server ke state lokal
                this.user = { ...this.user, ...data.user };
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                
                if(data.market) this.market = data.market;

                this.isLoaded = true;
                
                // Refresh Semua Tampilan UI
                this.refreshAllUI();
            } else {
                console.log("[STATE] User baru / Belum ada data di DB.");
                // User baru biasanya dibuatkan data oleh server saat 'init' atau 'login'
                // Untuk sementara kita biarkan kosong, nanti ditangani API
                this.isLoaded = true; 
            }
        });
    },

    // --- 2. SAVE DATA (DIMATIKAN) ---
    // Dulu: Frontend kirim data ke DB.
    // Sekarang: Server yang kirim data ke DB.
    async save() {
        // Fungsi ini sengaja dikosongkan.
        // Kita tidak ingin Frontend menyentuh Database langsung.
        // Jika perlu menyimpan status sementara (seperti posisi scroll),
        // gunakan localStorage.
        console.log("[STATE] Save skipped (Handled by Server API)");
    },

    // --- HELPER UI ---
    refreshAllUI() {
        if(!window.UIEngine) return;
        
        UIEngine.updateHeader();
        
        // Update Grid Kebun jika FarmSystem aktif
        if(window.FarmSystem && !FarmSystem.isSpinning) {
            FarmSystem.renderFarmGrid();
        }
        
        // Update Market jika sedang dibuka
        if(window.MarketSystem) {
            // MarketSystem.render... (jika ada)
        }
    },

    // Helper Harga (Visual Only)
    getPrice(key) {
        if (!window.GameConfig || !window.GameConfig.Crops) return 10;
        const range = window.GameConfig.Crops[key];
        return range ? range.minPrice : 10;
    }
};

window.GameState = GameState;