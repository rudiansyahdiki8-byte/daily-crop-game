// js/ads.js
// ==========================================
// ADS MANAGER FINAL (Waterfall: Adsgram -> Adexium -> Monetag)
// Fitur: Strict Mode (No Skip), Adexium Manual Trigger, Debug Fix
// ==========================================

const AdsManager = {
    // 1. KONFIGURASI ID
    ids: {
        adsgramReward: "21143",           
        adsgramInter: "int-21085",        
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", // ID Widget Adexium Anda
        monetagZone: "10457329"           
    },

    ADEXIUM_COOLDOWN: 60, // Menit

    async startAdsSequence(jumlahAds, kategori, onReward) {
        console.log(`🚀 [AdsSystem] Requesting Ads. Mode: ${kategori}`);
        
        let sukses = 0;

        for (let i = 0; i < jumlahAds; i++) {
            // UI Loading
            if(window.UIEngine) {
                UIEngine.showRewardPopup("SPONSOR", "Watch full ad to claim reward...", null, `⏳ Ad ${i+1}/${jumlahAds}`);
            }

            // Cek Cooldown Adexium (1 Jam sekali)
            let adexiumReady = this.checkAdexiumCooldown();

            // STRATEGI WATERFALL
            let antrianIklan = [];

            if (kategori === 'vip') {
                // Prioritas VIP: Adsgram -> Adexium (Jika Ready) -> Monetag
                antrianIklan = [
                    { name: "Adsgram Reward", func: () => this.callAdsgram(this.ids.adsgramReward) },
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),
                    { name: "Monetag",        func: () => this.callMonetag('interstitial') }
                ];
            } else {
                // Regular: Interstitial Only
                antrianIklan = [
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),
                    { name: "Monetag",        func: () => this.callMonetag('interstitial') }
                ];
            }

            // Eksekusi
            let berhasil = false;
            let successProvider = "";

            for (let source of antrianIklan) {
                try {
                    console.log(`▶️ Trying: ${source.name}...`);
                    await source.func();
                    
                    console.log(`✅ Success: ${source.name}`);
                    berhasil = true;
                    successProvider = source.name;
                    break; 
                } catch (err) {
                    console.warn(`⚠️ Failed/Skipped: ${source.name}. Reason:`, err);
                }
            }

            if (berhasil) {
                sukses++;
                if (successProvider === "Adexium") this.setAdexiumLastShown();
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // Cleanup UI
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        if (sukses > 0) {
            if (onReward) onReward();
        } else {
            alert("Reward Failed. Ad was skipped or not available.");
        }
    },

    // --- 1. ADSGRAM (FIXED DEBUG MODE) ---
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Adsgram script missing");

            // [FIX PENTING DARI DOKUMEN]
            // Debug mode harus diset FALSE untuk production agar iklan asli keluar
            const AdController = window.Adsgram.init({ 
                blockId: blockId, 
                debug: false, //  "debug mode left enabled... breaks everything"
                debugBannerType: "FullscreenMedia" 
            });

            AdController.show().then((result) => {
                // Strict Mode: done = true [cite: 2]
                if (result.done) {
                    resolve(); 
                } else {
                    reject("User skipped Adsgram");
                }
            }).catch((err) => {
                // Error saat load/render [cite: 4]
                reject(err);
            });
        });
    },

    // --- 2. ADEXIUM (MANUAL INTEGRATION) ---
    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium SDK missing");

            try {
                // Inisialisasi Widget [cite: 17]
                const adexiumAds = new AdexiumWidget({
                    wid: this.ids.adexiumWidget,
                    adFormat: 'interstitial',
                    isFullScreen: true, // Opsional: Paksa fullscreen [cite: 15]
                    debug: false // False untuk production
                });

                // Listener: Jika iklan diterima, tampilkan [cite: 19]
                adexiumAds.on('adReceived', (ad) => {
                    console.log("Adexium Received");
                    adexiumAds.displayAd(ad); 
                });

                // Listener: Jika tidak ada iklan [cite: 22]
                adexiumAds.on('noAdFound', () => {
                    reject("Adexium No Fill");
                });

                // Listener: Jika user tutup iklan (dianggap skip/selesai) [cite: 24]
                adexiumAds.on('adClosed', () => {
                    // Adexium tidak punya status 'done' sejelas Adsgram,
                    // tapi biasanya close = selesai lihat banner.
                    resolve(); 
                });

                // Listener: Jika video selesai diputar (Valid Success) 
                adexiumAds.on('adPlaybackCompleted', () => {
                    resolve();
                });

                // Request Iklan 
                adexiumAds.requestAd('interstitial');

            } catch (e) {
                reject("Adexium Error: " + e.message);
            }
        });
    },

    // --- 3. MONETAG (FALLBACK) ---
    callMonetag(type) {
        return new Promise((resolve, reject) => {
            // Sesuai dokumen: show_ZONEID() [cite: 9]
            const f = window[`show_${this.ids.monetagZone}`];
            
            if (typeof f !== 'function') return reject("Monetag SDK missing");
            
            // Pop untuk reward [cite: 8], kosong untuk interstitial [cite: 9]
            const param = (type === 'pop') ? 'pop' : undefined;

            f(param).then(() => {
                resolve();
            }).catch(e => {
                reject("Monetag Error");
            });
        });
    },

    // --- UTILS (Cooldown Logic) ---
    checkAdexiumCooldown() {
        if (!window.GameState || !GameState.user) return false;
        const timers = GameState.user.ad_timers || {};
        const last = timers['adexium'];
        if (!last) return true; 
        const diff = (Date.now() - parseInt(last)) / 1000 / 60;
        return diff >= this.ADEXIUM_COOLDOWN;
    },

    setAdexiumLastShown() {
        if (!window.GameState || !GameState.user) return;
        if (!GameState.user.ad_timers) GameState.user.ad_timers = {};
        GameState.user.ad_timers['adexium'] = Date.now();
        if (GameState.save) GameState.save(); 
    }
};

window.AdsManager = AdsManager;
