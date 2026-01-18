// public/js/state.js REFACTOR VERSI VERCEL

const defaultUser = {
    username: "Petani Baru",
    coins: 0,
    plan: "FREE",
    warehouse: {},
    landPurchasedCount: 0
};

let GameState = {
    user: { ...defaultUser },
    warehouse: {},
    isLoaded: false,

// Di dalam js/state.js

    async load() {
        // --- 1. STRICT TELEGRAM CHECK (Tetap Sama) ---
        if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
             // ... (Kode Blokir Tampilan Tetap Sama [cite: 522-529]) ...
             document.body.innerHTML = `<div style="color:red; text-align:center; margin-top:50px;">Please open in Telegram</div>`;
             return; 
        }

        // --- 2. AMBIL DATA TELEGRAM ---
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        const finalUserId = tgUser.id.toString();
        const finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
        
        window.Telegram.WebApp.expand();
        console.log("Login:", finalUserId);
        this.user.userId = finalUserId; // Set ID lokal dulu

        // --- 3. LOAD DATA DARI SERVER (API) ---
        // INI BAGIAN YANG BARU (Menggantikan window.fs.getDoc)
        try {
            const response = await fetch('/api/user/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: finalUserId,
                    username: finalUsername
                    // Nanti bisa kirim initData untuk validasi hash
                })
            });

            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;
                
                // Masukkan data dari server ke State Frontend
                this.user = { ...defaultUser, ...data.user };
                this.warehouse = data.warehouse || {};
                this.market = data.market || { prices: {}, lastRefresh: 0 };
                this.farmPlots = data.farmPlots || [];
                
                this.isLoaded = true;
                console.log("[STATE] Data Loaded from API");
            } else {
                throw new Error(result.error || "Gagal memuat data");
            }

        } catch (e) {
            console.error("API Load Failed:", e);
            alert("Connection Error. Please Restart.");
        }
    },

    // Fungsi Save manual dikurangi, karena aksi penting (Spin/Beli) langsung ke server
    async sync() {
        await this.load(); // Reload data terbaru
    }
};


window.GameState = GameState;
