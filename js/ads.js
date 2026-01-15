// js/ads.js
// ==========================================
// ADS MANAGER: HYBRID STACK V1.0
// Logic:
// 1. Premium Timer (30 Menit): Mengontrol Adsgram & Adexium.
// 2. Stack System: Request X iklan, sistem pilihkan urutannya otomatis.
// 3. Fallback: Jika Premium cooldown, otomatis switch ke Adsterra/Monetag.
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
        premiumCooldown: 30,   // Cooldown Iklan Mahal (Menit) - Global untuk semua tombol
        clickSafety: 2         // Jeda 2 detik agar tidak double click tombol start
    },

    isRunning: false, // Flag agar tidak tumpah tindih

    /**
     * FUNGSI UTAMA: Panggil ini di tombol game Anda.
     * @param {number} jumlahAds - Mau berapa iklan? (Contoh: Harvest=2, Task=3)
     * @param {function} onReward - Callback function setelah SEMUA iklan selesai.
     */
    async showHybridStack(jumlahAds, onReward) {
        if (this.isRunning) return; // Cegah spam tombol start
        this.isRunning = true;

        console.log(`🚀 [AdsSystem] Requesting Stack: ${jumlahAds} Ads`);
        
        // 1. Cek Status Premium (30 Menit Timer)
        const premiumStatus = this.checkPremiumTimer();
        const isPremiumReady = premiumStatus.ready;
        console.log(`💎 Premium Status: ${isPremiumReady ? "READY" : "COOLDOWN (" + premiumStatus.timeLeft + "m)"}`);

        // 2. Tentukan Playlist Iklan Berdasarkan Status
        let playlist = [];

        if (isPremiumReady) {
            // --- MODE SULTAN (Timer Ready) ---
            // Urutan: Adsgram (Video) -> Adexium (Inter) -> Adsterra -> Monetag
            playlist = [
                { name: "Adsgram (Premium)", type: 'adsgram_reward' }, // Wajib Nonton
                { name: "Adexium (Native)",  type: 'adexium' },        // Gambar Native
                { name: "Adsterra (Link)",   type: 'adsterra' },       // Tab Baru
                { name: "Monetag (Inter)",   type: 'monetag_inter' },
                { name: "Monetag (Pop)",     type: 'monetag_pop' }
            ];
        } else {
            // --- MODE RECEH (Timer Cooldown) ---
            // Urutan: Adsterra -> Monetag Inter -> Monetag Pop -> Adsterra (Lagi)
            playlist = [
                { name: "Adsterra (Link)",   type: 'adsterra' },       // Tab Baru (Priority Spam)
                { name: "Monetag (Inter)",   type: 'monetag_inter' },  // Gambar
                { name: "Monetag (Pop)",     type: 'monetag_pop' },    // Pop under
                { name: "Adsterra (Backup)", type: 'adsterra' },       // Ulangi Adsterra
                { name: "Monetag (Backup)",  type: 'monetag_inter' }
            ];
        }

        // 3. Potong Playlist sesuai jumlah permintaan (misal cuma minta 2)
        // Jika minta 3, ambil index 0, 1, 2
        let antrianFinal = playlist.slice(0, jumlahAds);
        
        // Safety: Jika user minta 5 tapi playlist cuma 4, looping aman.

        // 4. EKSEKUSI LOOPING (STACK)
        let suksesCount = 0;

        for (let i = 0; i < antrianFinal.length; i++) {
            const ad = antrianFinal[i];
            const stepInfo = `Ads ${i+1}/${jumlahAds}`;

            // Tampilkan Loading UI
            if(window.UIEngine) {
                UIEngine.showRewardPopup("SPONSOR", `Loading Ad ${i+1} of ${jumlahAds}...`, null, "⏳ Please wait...");
            }

            try {
                console.log(`▶️ Playing [${stepInfo}]: ${ad.name}`);
                
                // Panggil Provider
                await this.callProvider(ad.type);
                
                console.log(`✅ Success: ${ad.name}`);
                suksesCount++;
                
                // Jeda Sedikit Antar Iklan (Biar napas)
                await new Promise(r => setTimeout(r, 1500));

            } catch (err) {
                console.warn(`⚠️ Skipped: ${ad.name}. Reason: ${err}`);
                // Jika error, lanjut ke iklan berikutnya (Jangan berhenti total)
            }
        }

        // 5. SELESAI
        this.isRunning = false;
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        if (suksesCount > 0) {
            // Update Timer Premium HANYA JIKA tadi pakai mode Premium
            if (isPremiumReady) {
                this.setPremiumTimer(); 
            }
            
            // Beri Hadiah
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
            case 'adsgram_inter':
                return this.callAdsgram(this.ids.adsgramReward); // Pakai ID Reward biar aman
            case 'adexium':
                return this.callAdexium();
            case 'adsterra':
                return this.callAdsterra();
            case 'monetag_inter':
                return this.callMonetag('interstitial');
            case 'monetag_pop':
                return this.callMonetag('pop');
            default:
                return Promise.reject("Unknown Type");
        }
    },

    // ==========================================
    // SDK IMPLEMENTATION
    // ==========================================
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script missing");
            // DEBUG: FALSE (Wajib)
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
                setTimeout(resolve, 3000); // Asumsi sukses 3 detik
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
    // GLOBAL TIMER LOGIC (Premium Protection)
    // ==========================================
    checkPremiumTimer() {
        if (!window.GameState || !GameState.user) return { ready: false, timeLeft: 30 }; 
        
        const timers = GameState.user.ad_timers || {};
        const last = timers['premium_stack']; // Satu Timer untuk SEMUA
        
        if (!last) return { ready: true }; 
        
        const diffMinutes = (Date.now() - parseInt(last)) / 1000 / 60;
        if (diffMinutes >= this.config.premiumCooldown) return { ready: true };
        
        return { ready: false, timeLeft: Math.ceil(this.config.premiumCooldown - diffMinutes) };
    },

    setPremiumTimer() {
        if (!window.GameState || !GameState.user) return;
        if (!GameState.user.ad_timers) GameState.user.ad_timers = {};
        
        GameState.user.ad_timers['premium_stack'] = Date.now(); 
        console.log("🔒 Premium Timer Locked for 30 mins");
        
        if (GameState.save) GameState.save(); 
    }
};

window.AdsManager = AdsManager;
