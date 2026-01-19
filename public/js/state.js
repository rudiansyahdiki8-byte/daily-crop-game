// js/state.js

const defaultUser = {
    userId: '123456',
    username: 'Farmer',
    coins: 1000,
    xp: 0,
    level: 1,
    energy: 100,
    landPurchasedCount: 0,
    lastSeen: Date.now()
};

const GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: {
        prices: {},
        lastRefresh: 0
    },
    isLoaded: false,
    isSaving: false,
    isSyncing: false, // Flag penting agar autosave tidak menabrak proses API

    async init() {
        console.log("📦 [STATE] Initializing Game State...");
        await this.load();
        
        // Autosave setiap 30 detik, tapi hanya jika tidak sedang sinkronisasi API
        setInterval(() => {
            if (!this.isSyncing) {
                this.save();
            }
        }, 30000);
    },

    async load() {
        let finalUserId = '123456';
        
        // Deteksi Telegram User
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                finalUserId = tg.initDataUnsafe.user.id.toString();
                this.user.username = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
            }
        }
        
        this.user.userId = finalUserId;

        try {
            console.log(`📡 [STATE] Loading data for UID: ${finalUserId}`);
            const response = await fetch(`/api/load?userId=${finalUserId}`);
            const result = await response.json();

            if (result.exists && result.data) {
                // Update data dari Server
                this.user = { ...this.user, ...result.data.user };
                this.warehouse = result.data.warehouse || {};
                this.farmPlots = result.data.farmPlots || [];
                console.log("✅ [STATE] Data loaded from Server.");
            } else {
                console.log("🆕 [STATE] No data found. Using default.");
                // Inisialisasi lahan kosong jika user baru
                this.farmPlots = Array(8).fill(null).map(() => ({
                    status: 'locked',
                    plant: null,
                    harvestAt: 0
                }));
            }
            
            this.isLoaded = true;
            
            // Re-render UI setelah load
            if (window.UIEngine) UIEngine.updateHeader();
            if (window.FarmSystem) FarmSystem.init();
            
        } catch (e) {
            console.error("❌ [STATE] Load Error:", e);
            this.isLoaded = true; // Set true agar game tidak macet di loading screen
        }
    },

    async save(force = false) {
        // Jangan save jika: belum load, sedang save, atau sedang ada proses API lain (isSyncing)
        if ((!this.isLoaded || this.isSaving || this.isSyncing) && !force) return;

        this.isSaving = true;
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.userId,
                    data: {
                        user: this.user,
                        warehouse: this.warehouse,
                        farmPlots: this.farmPlots,
                        lastUpdate: Date.now()
                    }
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log("💾 [STATE] Game Auto-Saved");
            }
        } catch (e) {
            console.error("❌ [STATE] Save Error:", e);
        } finally {
            this.isSaving = false;
        }
    }
};

window.GameState = GameState;
GameState.init();
