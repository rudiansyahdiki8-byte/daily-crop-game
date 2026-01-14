// js/ads.js
// ==========================================
// ADVANCED ADS MANAGER (3 MODES)
// 1. INTERSTITIAL (Untuk 5 Menit)
// 2. REWARDED (Untuk Daily Claim)
// 3. RANDOM (Untuk Booster)
// ==========================================

const AdsManager = {
    // KONFIGURASI ID
    ids: {
        adsgramReward: "21143",           // Khusus Daily/High Value
        adsgramInter: "int-21085",        // Khusus 5 Menit/Selingan
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329"
    },

    // --- FUNGSI UTAMA ---
    // type: 'interstitial' | 'reward' | 'random'
    async showAd(type, onReward) {
        console.log(`🎬 [AdsManager] Request tipe: ${type}`);
        
        // Loading Screen
        if(window.UIEngine) {
            UIEngine.showRewardPopup("ADVERTISEMENT", "Memuat iklan sponsor...", null, "⏳ Loading...");
        }

        // PILIH JALUR SESUAI TIPE
        if (type === 'interstitial') {
            // MODE 1: 5 MENIT (Fokus Interstitial)
            await this.runInterstitialFlow(onReward);
        } 
        else if (type === 'reward') {
            // MODE 2: DAILY CLAIM (Fokus Reward/Popup)
            await this.runRewardedFlow(onReward);
        } 
        else if (type === 'random') {
            // MODE 3: BOOSTER (Acak)
            await this.runRandomFlow(onReward);
        }
        else {
            // Default ke Interstitial kalau typo
            await this.runInterstitialFlow(onReward);
        }
    },

    // ==========================================
    // ALUR LOGIKA (FLOWS)
    // ==========================================

    // 1. ALUR INTERSTITIAL (Urutan: Adsgram Int -> Adexium -> Monetag Int)
    async runInterstitialFlow(cb) {
        try {
            console.log("🔹 Mode Interstitial: Coba Adsgram Interstitial...");
            await this.callAdsgram(this.ids.adsgramInter);
            this.handleSuccess(cb, "Adsgram Interstitial");
        } catch (e) {
            try {
                console.log("🔹 Gagal, Coba Adexium...");
                await this.callAdexium();
                this.handleSuccess(cb, "Adexium");
            } catch (e2) {
                try {
                    console.log("🔹 Gagal, Coba Monetag Interstitial...");
                    await this.callMonetag('interstitial');
                    this.handleSuccess(cb, "Monetag Interstitial");
                } catch (e3) {
                    this.handleFail();
                }
            }
        }
    },

    // 2. ALUR REWARD (Urutan: Adsgram Reward -> Monetag Pop)
    async runRewardedFlow(cb) {
        try {
            console.log("🎁 Mode Reward: Coba Adsgram Reward Video...");
            await this.callAdsgram(this.ids.adsgramReward);
            this.handleSuccess(cb, "Adsgram Reward");
        } catch (e) {
            try {
                console.log("🎁 Gagal, Coba Monetag Reward Pop...");
                await this.callMonetag('pop');
                this.handleSuccess(cb, "Monetag Pop");
            } catch (e2) {
                 // Terakhir coba Adexium sebagai cadangan darurat
                 this.runInterstitialFlow(cb);
            }
        }
    },

    // 3. ALUR RANDOM (Acak Startnya)
    async runRandomFlow(cb) {
        const rand = Math.random(); // Angka 0.0 sampai 1.0
        console.log(`🎲 Mode Random: Rolled ${rand.toFixed(2)}`);

        // 33% Adsgram, 33% Adexium, 33% Monetag
        if (rand < 0.33) {
            // Start Adsgram
            try { await this.callAdsgram(this.ids.adsgramInter); this.handleSuccess(cb, "Random-Adsgram"); }
            catch { this.runInterstitialFlow(cb); } // Kalau gagal, lari ke flow normal
        } 
        else if (rand < 0.66) {
            // Start Adexium
            try { await this.callAdexium(); this.handleSuccess(cb, "Random-Adexium"); }
            catch { this.runInterstitialFlow(cb); }
        } 
        else {
            // Start Monetag
            try { await this.callMonetag('interstitial'); this.handleSuccess(cb, "Random-Monetag"); }
            catch { this.runInterstitialFlow(cb); }
        }
    },

    // ==========================================
    // TEKNIS (JANGAN DIUBAH)
    // ==========================================
    
    handleSuccess(callback, source) {
        console.log(`✅ Sukses dari: ${source}`);
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        if (callback) callback();
    },

    handleFail() {
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        alert("Iklan habis sementara. Coba lagi nanti.");
    },

    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script missing");
            const AdController = window.Adsgram.init({ blockId: blockId });
            AdController.show().then((result) => {
                // Interstitial (selingan) dianggap sukses walau di skip
                // Reward (hadiah) harus done=true
                if (blockId === this.ids.adsgramInter) resolve(); 
                else if (result.done) resolve();
                else reject("Skipped");
            }).catch(reject);
        });
    },

    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium missing");
            const adWidget = new AdexiumWidget({
                wid: this.ids.adexiumWidget,
                adFormat: 'interstitial',
                debug: false
            });
            adWidget.on('adReceived', (ad) => adWidget.displayAd(ad));
            adWidget.on('noAdFound', () => reject("No Fill"));
            adWidget.on('adClosed', () => resolve());
            adWidget.on('adPlaybackCompleted', () => resolve());
            adWidget.requestAd('interstitial');
        });
    },

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const func = window[`show_${this.ids.monetagZone}`];
            if (typeof func !== 'function') return reject("Monetag missing");
            if (type === 'pop') func('pop').then(resolve).catch(reject);
            else func().then(resolve).catch(reject);
        });
    }
};

window.AdsManager = AdsManager;