// js/state.js
// State Management & Configuration
// Updated: Connected to api/game/init.js

const defaultUser = {
    username: "New Tycoon",
    userId: null, 
    plan: "FREE", 
    coins: 0, 
    lastActive: Date.now()
};

let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,

    async load() {
        // 1. Cek Telegram Environment
        if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initData) {
            console.error("Telegram InitData missing. Are you running outside Telegram?");
            // Jika testing di browser biasa (bukan Telegram), uncomment baris ini untuk bypass:
            // this.isLoaded = true; return; 
            return;
        }

        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        if(tgUser) {
            console.log("Logged in as:", tgUser.id);
            this.user.userId = "TG-" + tgUser.id;
        }

        // 2. PANGGIL API INIT (Pengganti logika Firestore langsung)
        try {
            console.log("[STATE] Connecting to Server...");
            
            // Memanggil pintu masuk yang baru Anda buat
            const response = await fetch('/api/game/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: window.Telegram.WebApp.initData
                })
            });

            const result = await response.json();

            if (result.success) {
                // A. Load Data User dari Server
                const data = result.gameState;
                this.user = { ...defaultUser, ...data.user }; // Merge biar aman
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                
                // B. Load Config dari Server (SINKRONISASI PENTING)
                // Ini membuat frontend patuh pada aturan Free/Tenant/Landlord di server
                if(result.serverConfig) {
                    window.GameConfig = result.serverConfig;
                    console.log("[STATE] Config Synced from Server (XLSX Rules Applied)");
                }

                // C. Setup Helper Tambahan
                this.market = data.market || { prices: {}, lastRefresh: 0 };
                
                this.isLoaded = true;
                console.log("[STATE] Game Loaded Successfully");

            } else {
                console.error("Server Error:", result.error);
                alert("Gagal memuat game: " + result.error);
            }
        } catch (e) {
            console.error("Init API Connection Failed:", e);
            // alert("Koneksi bermasalah. Coba refresh.");
        }
    },
    
    // Fungsi Save Manual dimatikan total agar tidak konflik
    async save() {
        // console.log("[STATE] Save handled by Server Actions.");
    },

    // Helper Harga (Opsional, fallback ke Config jika data market server belum ada)
    getPrice(key) {
        if (this.market.prices && this.market.prices[key]) {
            return this.market.prices[key];
        }
        // Fallback ke Config
        if (window.GameConfig && window.GameConfig.Crops && window.GameConfig.Crops[key]) {
            return window.GameConfig.Crops[key].minPrice;
        }
        return 10;
    }
};

// Expose ke Global
window.GameState = GameState;
