// js/ads.js
// ==========================================
// FULL WATERFALL SYSTEM (5 TIERS) + STACKING
// ==========================================

const AdsManager = {
    // KONFIGURASI ID
    ids: {
        adsgramReward: "21143",           
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329",          
        adsgramInter: "int-21085"         
    },

// --- FUNGSI 1: SINGLE AD (UTAMA DENGAN 5 TIER - ENGLISH VERSION) ---
    async showAd(type, onReward) {
        console.log("🌊 [Waterfall] Initializing ad sequence...");
        
        // Loading Popup in English
        if(window.UIEngine) {
            UIEngine.showRewardPopup("ADVERTISEMENT", "Looking for the best sponsor...", null, "⏳ Loading...");
        }

        // --- TIER 1: ADSGRAM REWARD ---
        try {
            console.log("1️⃣ [Tier 1] Trying Adsgram Reward...");
            await this.callAdsgram(this.ids.adsgramReward);
            this.handleSuccess(onReward, "Adsgram Reward");
            return;
        } catch (e) {
            console.warn("❌ Tier 1 Failed:", e);
        }

        // --- TIER 2: ADSGRAM INTERSTITIAL ---
        try {
            console.log("2️⃣ [Tier 2] Trying Adsgram Interstitial...");
            await this.callAdsgram(this.ids.adsgramInter);
            this.handleSuccess(onReward, "Adsgram Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 2 Failed:", e);
        }

        // --- TIER 3: ADEXIUM ---
        try {
            console.log("3️⃣ [Tier 3] Trying Adexium...");
            await this.callAdexium();
            this.handleSuccess(onReward, "Adexium");
            return;
        } catch (e) {
            console.warn("❌ Tier 3 Failed:", e);
        }

        // --- TIER 4: MONETAG INTERSTITIAL ---
        try {
            console.log("4️⃣ [Tier 4] Trying Monetag Interstitial...");
            await this.callMonetag('interstitial');
            this.handleSuccess(onReward, "Monetag Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 4 Failed:", e);
        }

        // --- TIER 5: MONETAG REWARD POP (Final Backup) ---
        try {
            console.log("5️⃣ [Tier 5] Trying Monetag Reward Pop...");
            await this.callMonetag('pop');
            this.handleSuccess(onReward, "Monetag Pop");
            return;
        } catch (e) {
            console.warn("❌ Tier 5 Failed:", e);
        }

        // IF ALL TIERS FAIL
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        alert("Sorry, no ads available at the moment. Please try again later.");
    },

    // --- Update handleSuccess message ---
    handleSuccess(callback, source) {
        console.log(`✅ [Waterfall] Success! Reward granted from: ${source}`);
        
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        if (callback) callback();
    }
        // JIKA SEMUA GAGAL
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        alert("Maaf, stok iklan sedang kosong. Coba beberapa saat lagi.");
    },

    // --- FUNGSI 2: STACK ADS (UNTUK MULTI-ADS) ---
async showStackAd(type, count, onFinalReward) {
    console.log(`🌀 Starting Priority Stack: Target ${count} ads`);
    let completed = 0;

    const runStep = async () => {
        if (completed >= count) {
            console.log("🏆 All stacked ads completed!");
            if (onFinalReward) onFinalReward();
            return;
        }

        // --- LANGKAH 1: Selalu coba ADSGRAM dulu sampai jatah 'count' habis ---
        try {
            console.log(`Trying Adsgram for ad #${completed + 1}`);
            await this.callAdsgram(this.ids.adsgramReward);
            completed++;
            setTimeout(() => runStep(), 1500); 
        } 
        // --- LANGKAH 2: Jika Adsgram GAGAL/HABIS, baru lari ke Waterfall vendor lain ---
        catch (e) {
            console.warn("Adsgram exhausted, moving to backup vendors...");
            this.showAd(type, () => {
                completed++;
                setTimeout(() => runStep(), 1500);
            });
        }
    };

    runStep();
}
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


window.AdsManager = AdsManager;

