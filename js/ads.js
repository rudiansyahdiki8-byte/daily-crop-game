// js/ads.js
// ==========================================
// SUPER WATERFALL ADS SYSTEM (5 TIERS)
// 1. Adsgram Reward
// 2. Adexium
// 3. Monetag Reward Pop
// 4. Adsgram Interstitial (Backup)
// 5. Monetag Interstitial (Backup)
// ==========================================

const AdsManager = {
    // KONFIGURASI ID
    ids: {
        adsgramReward: "21143",           // Tier 1
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", // Tier 2
        monetagZone: "10457329",          // Tier 3 & 5
        adsgramInter: "int-21085"         // Tier 4
    },

    // --- FUNGSI UTAMA YANG DIPANGGIL GAME ---
    async showAd(title, onReward) {
        console.log("🌊 [Waterfall] Memulai pencarian iklan...");
        
        // Tampilkan Loading
        if(window.UIEngine) {
            UIEngine.showRewardPopup("ADVERTISEMENT", "Mencari sponsor terbaik...", null, "⏳ Loading...");
        }

        // --- TIER 1: ADSGRAM REWARD ---
        try {
            console.log("1️⃣ [Tier 1] Coba Adsgram Reward...");
            await this.callAdsgram(this.ids.adsgramReward);
            this.handleSuccess(onReward, "Adsgram Reward");
            return;
        } catch (e) {
            console.warn("❌ Tier 1 Gagal:", e);
        }

        // --- TIER 2: ADEXIUM ---
        try {
            console.log("2️⃣ [Tier 2] Coba Adexium...");
            await this.callAdexium();
            this.handleSuccess(onReward, "Adexium");
            return;
        } catch (e) {
            console.warn("❌ Tier 2 Gagal/Skip:", e);
        }

        // --- TIER 4: ADSGRAM INTERSTITIAL (Backup) ---
        try {
            console.log("4️⃣ [Tier 4] Coba Adsgram Interstitial...");
            // Interstitial tetap kita kasih reward jika muncul
            await this.callAdsgram(this.ids.adsgramInter);
            this.handleSuccess(onReward, "Adsgram Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 4 Gagal:", e);
        }

        // --- TIER 5: MONETAG INTERSTITIAL (Backup Terakhir) ---
        try {
            console.log("5️⃣ [Tier 5] Coba Monetag Interstitial...");
            await this.callMonetag('interstitial');
            this.handleSuccess(onReward, "Monetag Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 5 Gagal:", e);
        }

                // --- TIER 3: MONETAG REWARD POP ---
        try {
            console.log("3️⃣ [Tier 3] Coba Monetag Reward Pop...");
            await this.callMonetag('pop');
            this.handleSuccess(onReward, "Monetag Pop");
            return;
        } catch (e) {
            console.warn("❌ Tier 3 Gagal:", e);
        }

        // JIKA SEMUA GAGAL
        console.error("☠️ [Waterfall] Semua iklan habis/error.");
        if(window.UIEngine) {
            // Tutup popup loading manual karena tidak ada success
            const popup = document.getElementById('system-popup');
            if(popup) popup.remove();
            alert("Maaf, stok iklan sedang kosong. Coba beberapa saat lagi.");
        }
    },

    // ==========================================
    // FUNGSI PENGHUBUNG (HELPER)
    // ==========================================

    // Helper: Adsgram (Promise Wrapper)
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script not loaded");
            
            const AdController = window.Adsgram.init({ blockId: blockId });
            AdController.show().then((result) => {
                // done: true (nonton habis), done: false (skip)
                // Untuk Interstitial (Tier 4), kita anggap sukses walau di skip/done
                // Tapi untuk Reward (Tier 1), harus done=true
                
                // Logic: Jika BlockID Interstitial, langsung Resolve.
                // Jika BlockID Reward, cek result.done.
                if (blockId === this.ids.adsgramInter) {
                    resolve(); 
                } else {
                    if (result.done) resolve();
                    else reject("User skipped video");
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    // Helper: Adexium (Promise Wrapper karena dia pakai Event Listener)
    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium SDK missing");

            const adWidget = new AdexiumWidget({
                wid: this.ids.adexiumWidget,
                adFormat: 'interstitial',
                debug: false // Ubah true kalau mau test
            });

            // Listener
            adWidget.on('adReceived', (ad) => {
                adWidget.displayAd(ad); // Tampilkan jika dapat
            });

            adWidget.on('noAdFound', () => {
                reject("No Fill Adexium");
            });

            adWidget.on('adClosed', () => {
                resolve(); // Sukses ditonton/ditutup
            });
            
            // Listener tambahan untuk error/complete
            adWidget.on('adPlaybackCompleted', () => resolve());
            
            // Panggil Iklan
            adWidget.requestAd('interstitial');
        });
    },

    // Helper: Monetag
    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const funcName = `show_${this.ids.monetagZone}`;
            const monetagFunc = window[funcName];

            if (typeof monetagFunc !== 'function') return reject("Monetag SDK missing");

            if (type === 'pop') {
                // Reward Popup Mode
                monetagFunc('pop').then(() => resolve()).catch(e => reject(e));
            } else {
                // Interstitial Mode
                monetagFunc().then(() => resolve()).catch(e => reject(e));
            }
        });
    },

    // Helper: Saat Sukses
    handleSuccess(callback, source) {
        console.log(`✅ [Waterfall] Sukses dapat reward dari: ${source}`);
        
        // Tutup popup loading
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        // Jalankan callback hadiah (tambah koin, dll)
        if (callback) callback();
    }
};

// Expose ke Window agar bisa dipanggil file lain
window.AdsManager = AdsManager;

