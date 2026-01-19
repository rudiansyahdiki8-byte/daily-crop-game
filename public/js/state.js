// js/state.js
// VERSI API-ONLY: Tidak ada logika Firebase Client di sini.
// Semua komunikasi data lewat API Vercel.

// 1. DATA DEFAULT (Template User Baru)
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
    adBoosterCooldown: 0,    
    spin_free_cooldown: 0, 
    activeBuffs: {},
    upline: null,
    referral_status: 'Pending',
    affiliate: { total_friends: 0, total_earnings: 0, friends_list: [] }
};

let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,
    isSaving: false, // Mencegah save double

    // --- FUNGSI LOAD (VIA API) ---
    async load() {
        // 1. Tentukan ID User
        let finalUserId, finalUsername;

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            finalUserId = "TG-" + tgUser.id;
            finalUsername = tgUser.first_name;
            window.Telegram.WebApp.expand();
        } else {
            console.warn("⚠️ Mode Browser: Menggunakan ID Tester");
            finalUserId = "TG-TESTER-123";
            finalUsername = "Juragan Lokal";
        }

        this.user.userId = finalUserId;
        console.log("🔄 [STATE] Connecting to Backend for:", finalUserId);

        try {
            // PANGGIL API VERCEL (api/load.js)
            const response = await fetch(`/api/load?userId=${finalUserId}`);
            
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            
            const result = await response.json();

            if (result.exists && result.data) {
                // User Lama: Pakai data dari server
                console.log("✅ [STATE] Data loaded from Server");
                const data = result.data;
                this.user = { ...defaultUser, ...data.user }; // Merge agar field baru tidak hilang
                this.user.username = finalUsername; // Update nama jaga-jaga ganti nama di TG
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                // User Baru: Gunakan default dan langsung simpan ke server
                console.log("🆕 [STATE] New User detected, creating data...");
                this.user.username = finalUsername;
                this.farmPlots = Array(4).fill(null).map((_, i) => ({ id: i+1, status: i===0?'empty':'locked', plant: null }));
                await this.save(true); // Force save pertama
            }

            this.isLoaded = true;
            
            // Render Ulang UI setelah data masuk
            if(window.UIEngine) UIEngine.updateHeader();
            if(window.FarmSystem) FarmSystem.init();

        } catch (e) {
            console.error("❌ [STATE] Load Failed:", e);
            alert("Gagal terhubung ke Server. Cek koneksi internet anda.");
        }
    },

    // --- FUNGSI SAVE (VIA API) ---
    async save(force = false) {
        if (!this.isLoaded && !force) return;
        if (this.isSaving) return; // Jangan spam save

        this.isSaving = true;
        this.user.lastActive = Date.now();

        // Siapkan paket data yg mau dikirim
        const payload = {
            user: this.user,
            warehouse: this.warehouse,
            farmPlots: this.farmPlots,
            market: this.market
        };

        try {
            // PANGGIL API VERCEL (api/save.js)
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.userId,
                    payload: payload
                })
            });

            if (!response.ok) throw new Error("Save rejected by server");
            // console.log("💾 [STATE] Saved successfully");

        } catch (e) {
            console.error("⚠️ [STATE] Save Failed (Background):", e);
        } finally {
            this.isSaving = false;
        }
    },

    // --- UTILITIES LAINNYA ---
    refreshMarketPrices() {
        const now = Date.now();
        // Cek config harga dari window (config.js)
        const ranges = window.PriceRanges || {};
        
        if (now - this.market.lastRefresh > 3600000 || Object.keys(this.market.prices).length === 0) {
            let newPrices = {};
            for (const key in ranges) {
                const range = ranges[key];
                newPrices[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            }
            this.market.prices = newPrices;
            this.market.lastRefresh = now;
            this.save();
        }
    },

    getPrice(key) {
        return (this.market.prices && this.market.prices[key]) ? this.market.prices[key] : 10;
    }
};

// Autosave setiap 10 detik
setInterval(() => {
    if(GameState.isLoaded) GameState.save();
}, 10000);

window.GameState = GameState;