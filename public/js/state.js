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
        console.log("Memulai Load User...");
        
        // 1. CEK DATA TELEGRAM (STRICT MODE)
        let tgUser = null;
        
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        }

        // 2. JIKA DATA KOSONG -> STOP & BERI PERINGATAN
        if (!tgUser) {
            // Cek apakah ini di PC (untuk debugging saya izinkan dummy)
            // Tapi kalau di HP, harus ERROR.
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // TAMPILAN ERROR DI HP JIKA SALAH BUKA LINK
                document.body.innerHTML = `
                    <div style="background:black; color:red; height:100vh; display:flex; flex-col; justify-content:center; align-items:center; text-align:center; padding:20px;">
                        <h1 style="font-size:40px;">⚠️ AKSES DITOLAK</h1>
                        <p style="font-size:16px; margin-top:20px;">
                            Game tidak mendeteksi akun Telegram Anda.<br><br>
                            <b>JANGAN BUKA LINK VERCEL LANGSUNG!</b><br><br>
                            Silakan buat Bot di @BotFather, pasang link game di Menu Button, lalu buka lewat Bot.
                        </p>
                        <p style="color:gray; margin-top:50px;">Debug: initDataUnsafe is missing</p>
                    </div>
                `;
                return; // STOP DISINI. JANGAN LANJUT LOAD.
            } else {
                // Debug di Laptop boleh pakai dummy
                console.warn("Mode Debug Laptop Detected");
                tgUser = { id: "78797987", first_name: "Juragan", last_name: "Debug" };
            }
        }

        // 3. JIKA LOLOS, GUNAKAN DATA ASLI
        const finalUserId = tgUser.id.toString();
        const finalUsername = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");

        // Tampilkan Alert ID di HP (Hanya untuk memastikan, nanti dihapus)
        // alert("LOGIN BERHASIL: " + finalUserId); 

        this.user.userId = finalUserId;

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

