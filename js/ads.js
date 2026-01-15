// js/ads.js
// ==========================================
// ADS MANAGER FINAL (Ultimate Waterfall)
// Urutan: Adsgram -> Adexium -> Monetag Inter -> Monetag Pop (Last Resort)
// ==========================================

const AdsManager = {
    // 1. KONFIGURASI ID
    ids: {
        adsgramReward: "21143",           
        adsgramInter: "int-21085",        
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
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

            // Cek Cooldown Adexium
            let adexiumReady = this.checkAdexiumCooldown();

            // STRATEGI WATERFALL (URUTAN DIPERBAIKI)
            let antrianIklan = [];

            if (kategori === 'vip') {
                // Mode VIP
                antrianIklan = [
                    // 1. Adsgram (Bayaran Tertinggi)
                    { name: "Adsgram Reward", func: () => this.callAdsgram(this.ids.adsgramReward) },
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    
                    // 2. Adexium (Jika Timer Ready)
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),
                    
                    // 3. Monetag Interstitial (Iklan Layar Penuh)
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') }
    
                ];
            } else {
                // Mode Regular
                antrianIklan = [
                   
                    // 2. Adexium
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),
                    
                    // 3. Monetag Inter
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') },
                    
                    // 4. Monetag Pop (TERAKHIR)
                    { name: "Monetag Pop",    func: () => this.callMonetag('pop') }
                ];
            }

            // Eksekusi Waterfall
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
                    // Jangan spam console, cukup info singkat
                    // console.warn(`Skipped: ${source.name}`); 
                }
            }

            if (berhasil) {
                sukses++;
                // Reset timer hanya jika Adexium yang muncul
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

    // --- 1. ADSGRAM (DEBUG FALSE) ---
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Adsgram script missing");

            const AdController = window.Adsgram.init({ 
                blockId: blockId, 
                debug: false, 
                debugBannerType: "FullscreenMedia" 
            });

            AdController.show().then((result) => {
                if (result.done) {
                    resolve(); 
                } else {
                    reject("User skipped Adsgram");
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    // --- 2. ADEXIUM (MANUAL REQUEST) ---
    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium SDK missing");

            try {
                const adexiumAds = new AdexiumWidget({
                    wid: this.ids.adexiumWidget,
                    adFormat: 'interstitial',
                    isFullScreen: true,
                    debug: false
                });

                adexiumAds.on('adReceived', (ad) => { adexiumAds.displayAd(ad); });
                adexiumAds.on('noAdFound', () => { reject("Adexium No Fill"); });
                adexiumAds.on('adClosed', () => { resolve(); }); // Close = Sukses
                adexiumAds.on('adPlaybackCompleted', () => { resolve(); });

                adexiumAds.requestAd('interstitial');

            } catch (e) {
                reject("Adexium Error");
            }
        });
    },

    // --- 3. MONETAG (INTERSTITIAL & POP) ---
    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const f = window[`show_${this.ids.monetagZone}`];
            if (typeof f !== 'function') return reject("Monetag SDK missing");
            
            // Jika type == 'pop', panggil show('pop'). 
            // Jika type == 'interstitial', panggil show().
            const param = (type === 'pop') ? 'pop' : undefined;

            f(param).then(() => {
                resolve();
            }).catch(e => {
                reject("Monetag Error");
            });
        });
    },

    // --- UTILS ---
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
