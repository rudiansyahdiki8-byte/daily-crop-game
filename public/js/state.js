// js/state.js
// State Management & Configuration - SECURITY UPDATED V2

const PlanConfig = {
    FREE: { name: "Free Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "High" },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "Medium" },
    TENANT: { name: "Tenant Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 50, ads: "None" },
    OWNER: { name: "Owner Farmer", basePlots: 1, maxPlots: 1, warehouseLimit: 9999, ads: "None" }
};

const PriceRanges = {};
if (window.HerbData) {
    for (const key in HerbData) {
        PriceRanges[key] = { min: HerbData[key].minPrice, max: HerbData[key].maxPrice };
    }
}

const defaultUser = {
    userId: null,
    username: "Farmer",
    coins: 0,
    plan: 'FREE',
    lastActive: Date.now(),
    settings: { music: true, sfx: true },
    adBoosterCooldown: 0
};

const GameState = {
    user: { ...defaultUser },
    warehouse: {},
    farmPlots: [],
    market: { prices: {}, lastRefresh: 0 },
    isLoaded: false,

    async load() {
        // --- 1. STRICT TELEGRAM CHECK ---
        if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background: radial-gradient(circle at center, #1f2937, #000); color:white; text-align:center; font-family: sans-serif; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 20px;">⛔</div>
                    <h1 style="color:#ef4444; font-size:24px; margin-bottom:10px; font-weight: 900; letter-spacing: 2px;">ACCESS DENIED</h1>
                    <p style="color:#9ca3af; margin-bottom:30px; font-size: 14px;">This game is designed exclusively for Telegram.<br>Please open the bot to play.</p>
                </div>`;
            return;
        }

        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        const finalUserId = "TG-" + tgUser.id;
        const finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
        
        window.Telegram.WebApp.expand();
        this.user.userId = finalUserId;

        // --- 2. LOAD DATA FIREBASE (COMPAT STYLE) ---
        try {
            const userRef = window.db.collection("users").doc(this.user.userId);
            const docSnap = await userRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                this.user = { ...defaultUser, ...data.user };
                this.user.username = finalUsername; // Update nama dari TG
                this.warehouse = data.warehouse || {};
                this.farmPlots = data.farmPlots || [];
                this.market = data.market || { prices: {}, lastRefresh: 0 };
            } else {
                this.user.username = finalUsername;
                await this.initialSave(); // Save pertama untuk user baru
            }
            this.isLoaded = true;
        } catch (e) {
            console.error("Load Failed:", e);
            this.isLoaded = true; 
        }
    },

    // Digunakan hanya untuk inisialisasi user baru
    async initialSave() {
        const userRef = window.db.collection("users").doc(this.user.userId);
        await userRef.set({
            user: this.user,
            warehouse: {},
            farmPlots: [],
            market: { prices: {}, lastRefresh: 0 }
        });
    },

    async save() {
        if (!window.db || !this.isLoaded || !this.user.userId) return;
        
        try {
            const userRef = window.db.collection("users").doc(this.user.userId);
            
            // --- KEAMANAN KRUSIAL ---
            // Kita HANYA mengupdate field yang tidak kritis (Settings & Username).
            // Coins, Warehouse, dan Plan TIDAK boleh diupdate dari sini.
            // Itu semua dilakukan oleh API di folder /api/
            await userRef.update({
                'user.lastActive': Date.now(),
                'user.username': this.user.username,
                'user.settings': this.user.settings || {}
            });
            
            if(window.UIEngine) UIEngine.updateHeader();
            console.log("State synced with server (Non-critical fields)");
        } catch (e) {
            console.error("Save Failed:", e);
        }
    },

    refreshMarketPrices() {
        const now = Date.now();
        // Cek refresh 1 jam
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

// Autosave setiap 5 menit untuk data ringan
setInterval(() => {
    if (GameState.isLoaded) GameState.save();

}, 300000);

window.GameState = GameState;
