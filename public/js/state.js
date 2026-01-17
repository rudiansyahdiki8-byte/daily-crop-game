// js/state.js
// STATE MANAGEMENT (Client-Side Read Only)
// Versi Fixed: Menggunakan Syntax Firebase Compat (db.collection...)

const PlanConfig = window.PlanConfig || {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" }
};

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
    upline: null,
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {} },
    isLoaded: false,

    async load() {
        if (!window.db) {
            console.error("[STATE] Database not found. Cek urutan script di index.html");
            return;
        }

        // 1. Identifikasi User (Telegram / Debug)
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const finalUserId = tgUser ? ("TG-" + tgUser.id) : "TG-DEBUG-123"; // ID untuk testing di browser
        
        this.user.userId = finalUserId;
        this.user.username = tgUser ? tgUser.first_name : "Farmer";

        console.log(`[STATE] Listening to data for: ${finalUserId}`);

        try {
            // 2. LISTEN REALTIME (Syntax Compat)
            // Gunakan db.collection().doc() bukan window.fs.doc()
            const userRef = window.db.collection("users").doc(finalUserId);
            
            userRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    
                    // Update State Lokal
                    this.user = { ...this.user, ...data.user };
                    this.warehouse = data.warehouse || {};
                    this.farmPlots = data.farmPlots || [];
                    
                    if(data.market) this.market = data.market;

                    this.isLoaded = true;
                    this.refreshAllUI();
                } else {
                    console.log("[STATE] Data user belum ada di DB (User Baru).");
                    this.isLoaded = true;
                    // Nanti API 'init' yang akan membuat data ini
                }
            }, (error) => {
                console.error("[STATE] Error listening to DB:", error);
            });

        } catch (e) {
            console.error("[STATE] Fatal Error in load:", e);
        }
    },

    save() {
        // Kosongkan - Write hanya lewat Server API
        console.log("[STATE] Save skipped (Client is Read-Only)");
    },

    refreshAllUI() {
        if(window.UIEngine) {
            UIEngine.updateHeader();
            // Update tampilan kebun jika sedang terbuka
            if(window.FarmSystem && !FarmSystem.isSpinning) {
                FarmSystem.renderFarmGrid();
            }
        }
    },

    getPrice(key) {
        if (!window.GameConfig || !window.GameConfig.Crops) return 10;
        const range = window.GameConfig.Crops[key];
        return range ? range.minPrice : 10;
    }
};

window.GameState = GameState;
