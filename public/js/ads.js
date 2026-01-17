// js/ads.js
// ==========================================
// ADS MANAGER: HYBRID STACK V1.1 (POP-UP LAST)
// Update: Adsterra & Monetag Pop dipindah ke urutan paling belakang.
// ==========================================

const AdsManager = {
    // --- 1. CONFIG ID & LINK ---
    ids: {
        adsgramReward: "21143",           
        adsgramInter: "int-21085",        
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329",
        adsterraDirectLink: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826"
    },

    // --- 2. CONFIG WAKTU ---
    config: {
        premiumCooldown: 30,   // Cooldown Iklan Mahal (Menit)
        clickSafety: 2         
    },

    isRunning: false, 

    async showHybridStack(jumlahAds, onReward) {
        if (this.isRunning) return; 
        this.isRunning = true;

        console.log(`🚀 [AdsSystem] Requesting Stack: ${jumlahAds} Ads`);
        
        // 1. Cek Status Premium
        const premiumStatus = this.checkPremiumTimer();
        const isPremiumReady = premiumStatus.ready;

        // 2. Tentukan Playlist (POP-UP DI TARUH BELAKANG)
        let playlist = [];

        if (isPremiumReady) {
            // --- MODE SULTAN (Timer Ready) ---
            // Prioritas: Video -> Gambar Native -> Gambar Inter -> Pop-up Terakhir
            playlist = [
                { name: "Adsgram (Video)",   type: 'adsgram_reward' }, 
                { name: "Adexium (Native)",  type: 'adexium' },        
                { name: "Monetag (Inter)",   type: 'monetag_inter' },  // Gambar (No Pop-up)
                { name: "Adsterra (Link)",   type: 'adsterra' },       // Pop-up 1
                { name: "Monetag (Pop)",     type: 'monetag_pop' }     // Pop-up 2
            ];
        } else {
            // --- MODE RECEH (Timer Cooldown) ---
            // Prioritas: Gambar Inter -> Pop-up -> Pop-up
            playlist = [
                { name: "Monetag (Inter)",   type: 'monetag_inter' },  // Gambar dulu (Lebih nyaman)
                { name: "Adsterra (Link)",   type: 'adsterra' },       // Baru Pop-up
                { name: "Monetag (Pop)",     type: 'monetag_pop' },    // Pop-up lagi
                { name: "Adsterra (Backup)", type: 'adsterra' }        // Loop
            ];
        }

        // 3. Ambil sesuai jumlah permintaan
        let antrianFinal = playlist.slice(0, jumlahAds);
        
        // 4. EKSEKUSI LOOPING
        let suksesCount = 0;

        for (let i = 0; i < antrianFinal.length; i++) {
            const ad = antrianFinal[i];

            // Tampilkan Loading UI
            if(window.UIEngine) {
                UIEngine.showRewardPopup("SPONSOR", `Loading Ad ${i+1} of ${jumlahAds}...`, null, "⏳ Please wait...");
            }

            try {
                console.log(`▶️ Playing: ${ad.name}`);
                await this.callProvider(ad.type);
                console.log(`✅ Success: ${ad.name}`);
                suksesCount++;
                await new Promise(r => setTimeout(r, 1500)); // Jeda
            } catch (err) {
                console.warn(`⚠️ Skipped: ${ad.name}`);
            }
        }

        // 5. SELESAI
        this.isRunning = false;
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        if (suksesCount > 0) {
            if (isPremiumReady) this.setPremiumTimer(); 
            if (onReward) onReward();
        } else {
            alert("No ads available. Please try again later.");
        }
    },

    // ==========================================
    // PROVIDER ROUTER
    // ==========================================
    async callProvider(type) {
        switch (type) {
            case 'adsgram_reward':
                return this.callAdsgram(this.ids.adsgramReward);
            case 'adexium':
                return this.callAdexium();
            case 'adsterra':
                return this.callAdsterra();
            case 'monetag_inter':
                return this.callMonetag('interstitial'); // Gambar Interstitial
            case 'monetag_pop':
                return this.callMonetag('pop'); // Pop-under (Tab Baru)
            default:
                return Promise.reject("Unknown Type");
        }
    },

    // ==========================================
    // SDK CALLS (TIDAK ADA PERUBAHAN)
    // ==========================================
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script missing");
            const AdController = window.Adsgram.init({ blockId: blockId, debug: false, debugBannerType: "FullscreenMedia" });
            AdController.show().then((r) => { r.done ? resolve() : reject("Skipped"); }).catch(reject);
        });
    },

    callAdsterra() {
        return new Promise((resolve, reject) => {
            if (!this.ids.adsterraDirectLink) return reject("Link missing");
            const tg = window.Telegram.WebApp;
            try {
                tg.openLink(this.ids.adsterraDirectLink);
                setTimeout(resolve, 3000); 
            } catch (e) { reject("Adsterra Failed"); }
        });
    },

    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium Missing");
            try {
                const w = new AdexiumWidget({ wid: this.ids.adexiumWidget, adFormat: 'interstitial', isFullScreen: true, debug: false });
                w.on('adReceived', (ad) => w.displayAd(ad));
                w.on('noAdFound', () => reject("No Fill"));
                w.on('adClosed', resolve); 
                w.on('adPlaybackCompleted', resolve);
                w.requestAd('interstitial');
            } catch (e) { reject("Adexium Error"); }
        });
    },

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const f = window[`show_${this.ids.monetagZone}`];
            if (typeof f !== 'function') return reject("SDK Missing");
            f(type === 'pop' ? 'pop' : undefined).then(resolve).catch(reject);
        });
    },

    // ==========================================
    // TIMER LOGIC (30 MENIT GLOBAL)
    // ==========================================
    checkPremiumTimer() {
        if (!window.GameState || !GameState.user) return { ready: false, timeLeft: 30 }; 
        const timers = GameState.user.ad_timers || {};
        const last = timers['premium_stack']; 
        if (!last) return { ready: true }; 
        const diffMinutes = (Date.now() - parseInt(last)) / 1000 / 60;
        if (diffMinutes >= this.config.premiumCooldown) return { ready: true };
        return { ready: false, timeLeft: Math.ceil(this.config.premiumCooldown - diffMinutes) };
    },

    setPremiumTimer() {
        if (!window.GameState || !GameState.user) return;
        if (!GameState.user.ad_timers) GameState.user.ad_timers = {};
        GameState.user.ad_timers['premium_stack'] = Date.now(); 
        if (GameState.save) GameState.save(); 
    }
};

window.AdsManager = AdsManager;
