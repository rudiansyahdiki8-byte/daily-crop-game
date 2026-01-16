// public/js/state.js
// State Management Client-Side (Connected to API)

// 1. KONFIGURASI VISUAL (Diperlukan oleh UI.js)
const PlanConfig = {
    FREE: { name: "Free Farmer", basePlots: 1, warehouseLimit: 50 },
    MORTGAGE: { name: "Mortgage Farmer", basePlots: 1, warehouseLimit: 50 },
    TENANT: { name: "Tenant Farmer", basePlots: 1, warehouseLimit: 50 },
    OWNER: { name: "Owner Farmer", basePlots: 1, warehouseLimit: 9999 }
};

// 2. GAME STATE UTAMA
const GameState = {
    user: {},      
    warehouse: {}, 
    farmPlots: [], 
    isLoaded: false,

    // --- FUNGSI LOAD UTAMA (Panggil API) ---
    async load() {
        try {
            console.log("Fetching User Data from Server...");
            
            // Panggil API kita yang aman
            const userData = await API.loadUser(); 
            
            if (userData) {
                this.user = userData;
                this.warehouse = userData.warehouse || {};
                this.farmPlots = userData.farmPlots || [];
                
                // Handle market prices jika server kirim
                if(userData.market) this.market = userData.market;
                
                // Konversi Timestamp HarvestAt (Server string -> JS Number)
                // Ini penting agar timer di farm.js jalan
                if (this.farmPlots) {
                    this.farmPlots.forEach(plot => {
                        // Cek berbagai format timestamp yang mungkin dikirim Firestore
                        if (plot.harvestAt) {
                             if (typeof plot.harvestAt === 'string') {
                                plot.harvestAt = new Date(plot.harvestAt).getTime();
                            } else if (plot.harvestAt.seconds) {
                                plot.harvestAt = plot.harvestAt.seconds * 1000;
                            } else if (plot.harvestAt._seconds) {
                                plot.harvestAt = plot.harvestAt._seconds * 1000;
                            }
                        }
                    });
                }

                this.isLoaded = true;
                console.log("Data Loaded!", this.user);
            }
        } catch (e) {
            console.error("Load Failed:", e);
        }
    },

    // Save sekarang tidak melakukan apa-apa karena semua aksi (Tanam, Panen)
    // sudah otomatis save via API masing-masing.
    // Kita biarkan function kosong agar kode lama (seperti ads.js) tidak error saat memanggilnya.
    async save() {
        console.log("State auto-saved by Server Actions.");
    },

    // Helper Harga untuk UI Market
    getPrice(key) {
        // Cek harga dari data user (jika server mengirim harga dinamis)
        if (this.user.market && this.user.market.prices && this.user.market.prices[key]) {
            return this.user.market.prices[key];
        }
        // Fallback visual jika data belum ada (agar tidak error)
        return 10; 
    }
};

// Export ke Window
window.PlanConfig = PlanConfig;
window.GameState = GameState;