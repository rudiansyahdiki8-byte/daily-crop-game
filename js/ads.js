// js/ads.js
// ==========================================
// ADS MANAGER ULTIMATE (4 LAYERS WATERFALL)
// Urutan: Adsgram -> Adexium -> Adsterra -> Monetag
// ==========================================

const AdsManager = {
    // 1. KONFIGURASI ID & LINK
    ids: {
        adsgramReward: "21143",           
        adsgramInter: "int-21085",        
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329",
        
        // ADSTERRA DIRECT LINK (YANG BARU ANDA DAPAT)
        adsterraDirectLink: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826"
    },

    ADEXIUM_COOLDOWN: 60, // Menit

    async startAdsSequence(jumlahAds, kategori, onReward) {
        console.log(`🚀 [AdsSystem] Requesting Ads. Mode: ${kategori}`);
        
        let sukses = 0;

        for (let i = 0; i < jumlahAds; i++) {
            // UI Loading
            if(window.UIEngine) {
                UIEngine.showRewardPopup("SPONSOR", "Watch ad to claim reward...", null, `⏳ Ad ${i+1}/${jumlahAds}`);
            }

            // Cek Cooldown Adexium
            let adexiumReady = this.checkAdexiumCooldown();

            // --- STRATEGI WATERFALL (URUTAN CUAN) ---
            let antrianIklan = [];

            if (kategori === 'vip') {
                // Mode VIP (Urutan Prioritas)
                antrianIklan = [
                    // 1. Adsgram (Bayaran Paling Mahal)
                    { name: "Adsgram Reward", func: () => this.callAdsgram(this.ids.adsgramReward) },
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    
                    // 2. Adexium (Iklan Native Telegram) - Cek Timer
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),
                    
                    // 3. Adsterra (Direct Link - Cuan Lumayan)
                    { name: "Adsterra",       func: () => this.callAdsterra() },

                    // 4. Monetag (Cadangan Terakhir)
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') },
                    { name: "Monetag Pop",    func: () => this.callMonetag('pop') }
                ];
            } else {
                // Mode Regular
                antrianIklan = [
                    // 1. Adsgram Interstitial
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    
                    // 2. Adexium
                    ...(adexiumReady ? [{ name: "Adexium", func: () => this.callAdexium() }] : []),

                    // 3. Adsterra (Direct Link)
                    { name: "Adsterra",       func: () => this.callAdsterra() },
                    
                    // 4. Monetag
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') },
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
                    // Lanjut ke provider berikutnya
                }
            }

            if (berhasil) {
                sukses++;
                // Reset timer jika Adexium yang muncul
                if (successProvider === "Adexium") this.setAdexiumLastShown();
                
                // Jeda sedikit biar tidak kaget
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        // Cleanup UI
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        if (sukses > 0) {
            if (onReward) onReward();
        } else {
            alert("Reward Failed. No ads available.");
        }
    },

    // --- 1. ADSGRAM (STRICT MODE: NO SKIP) ---
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Adsgram script missing");

            // Init (Debug: false untuk production)
            const AdController = window.Adsgram.init({ 
                blockId: blockId, 
                debug: false, 
                debugBannerType: "FullscreenMedia" 
            });

            AdController.show().then((result) => {
                if (result.done) resolve(); 
                else reject("User skipped Adsgram");
            }).catch((err) => reject(err));
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
                adexiumAds.on('adClosed', () => { resolve(); }); 
                adexiumAds.on('adPlaybackCompleted', () => { resolve(); });
                adexiumAds.requestAd('interstitial');
            } catch (e) {
                reject("Adexium Error");
            }
        });
    },

    // --- 3. ADSTERRA (DIRECT LINK) ---
    callAdsterra() {
        return new Promise((resolve, reject) => {
            const link = this.ids.adsterraDirectLink;
            if (!link) return reject("Adsterra Link Missing");

            // Kita pakai fitur Telegram untuk membuka link dengan aman
            const tg = window.Telegram.WebApp;
            
            try {
                // Tampilkan pesan konfirmasi (Opsional, biar sopan)
                // Tapi kalau mau langsung buka, langsung baris bawah ini:
                tg.openLink(link);
                
                // Karena ini buka tab baru, kita anggap sukses setelah 2 detik
                // (Kita tidak bisa kontrol apa yang user lakukan di browser luar)
                setTimeout(() => {
                    resolve();
                }, 2000);

            } catch (e) {
                reject("Adsterra Failed to Open");
            }
        });
    },

    // --- 4. MONETAG (INTERSTITIAL & POP) ---
    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const f = window[`show_${this.ids.monetagZone}`];
            if (typeof f !== 'function') return reject("Monetag SDK missing");
            
            const param = (type === 'pop') ? 'pop' : undefined;
            f(param).then(() => resolve()).catch(e => reject("Monetag Error"));
        });
    },

    // --- UTILS (TIMER) ---
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
