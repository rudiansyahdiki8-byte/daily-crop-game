// js/ads.js
// ==========================================
// ULTIMATE ADS MANAGER (NO POPUP VERSION)
// Fitur: Fail-Safe Waterfall, Anti-Tuyul, Langsung Jalan (No Loading UI)
// ==========================================

const AdsManager = {
    ids: {
        adsgramReward: "21143",           // Menu 1 (Tier Dewa)
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", // Menu 2
        monetagZone: "10457329",          // Menu 3 & 5
        adsgramInter: "int-21085"         // Menu 4
    },

    // Cooldown Adexium (Menit)
    ADEXIUM_COOLDOWN: 60,

    // ==========================================
    // FUNGSI UTAMA
    // ==========================================
    async startAdsSequence(jumlahAds, kategori, onReward) {
        console.log(`🚀 [System] Memulai ${jumlahAds} Stack. Mode: ${kategori.toUpperCase()}`);

        let sukses = 0;

        // LOOPING SETIAP IKLAN
        for (let i = 0; i < jumlahAds; i++) {
            
            // --- [BAGIAN POPUP DIHAPUS DISINI AGAR LANGSUNG JALAN] ---
            
            // --- TENTUKAN URUTAN PRIORITAS IKLAN ---
            let antrianIklan = [];

            if (kategori === 'vip') {
                // === MODE VIP (Wallet & Spin) ===
                antrianIklan = [
                    { name: "Adsgram Reward", func: () => this.callAdsgram(this.ids.adsgramReward) },
                    { name: "Adexium",        func: () => this.callAdexium() },
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') }
                ];
            } else {
                // === MODE REGULAR (Task, Harvest, Booster) ===
                let adexiumReady = this.checkAdexiumCooldown();

                if (adexiumReady && (i % 2 === 0)) { 
                    // Iklan Ganjil & Ready
                    antrianIklan = [
                        { name: "Adexium",        func: () => this.callAdexium() },
                        { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                        { name: "Monetag Pop",    func: () => this.callMonetag('pop') }
                    ];
                    this.markAdexiumAsShown = true; 
                } else {
                    // Iklan Genap / Cooldown
                    antrianIklan = [
                        { name: "Monetag Pop",    func: () => this.callMonetag('pop') },
                        { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') },
                        { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) }
                    ];
                    this.markAdexiumAsShown = false;
                }
            }

            // --- JALANKAN WATERFALL (JEBOL SISTEM) ---
            let berhasilDiStackIni = false;

            for (let source of antrianIklan) {
                try {
                    console.log(`▶️ Mencoba: ${source.name}...`);
                    // Langsung eksekusi tanpa babibu
                    await source.func();
                    
                    console.log(`✅ Sukses via ${source.name}`);
                    berhasilDiStackIni = true;
                    
                    if (source.name === "Adexium") this.setAdexiumLastShown();
                    break; 
                } catch (err) {
                    console.warn(`⚠️ ${source.name} Skip. Lanjut backup...`);
                }
            }

            if (berhasilDiStackIni) {
                sukses++;
                // Jeda sedikit biar user tidak kaget perpindahan antar iklan
                await new Promise(r => setTimeout(r, 1000)); 
            } else {
                console.error(`❌ Gagal Total di Stack ke-${i+1}.`);
            }
        }

        // --- CEK HASIL AKHIR ---
        if (sukses > 0) {
            this.handleSuccess(onReward, kategori);
        } else {
            // Popup error tetap kita munculkan kalau gagal total, biar user tau kenapa reward gak masuk
            alert("Gagal memuat iklan. Reward tidak dapat diberikan.");
        }
    },

    // ==========================================
    // LOGIC WAKTU
    // ==========================================
    checkAdexiumCooldown() {
        const last = localStorage.getItem('last_adexium_time');
        if (!last) return true;
        const diff = (Date.now() - parseInt(last)) / 1000 / 60;
        return diff >= this.ADEXIUM_COOLDOWN;
    },

    setAdexiumLastShown() {
        localStorage.setItem('last_adexium_time', Date.now());
    },

    // ==========================================
    // HELPER (SDK)
    // ==========================================
    
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script Missing");
            try {
                const AdController = window.Adsgram.init({ blockId: blockId });
                AdController.show().then((res) => {
                    if (res.done) resolve(); 
                    else reject("User SKIP");
                }).catch((e) => reject(e));
            } catch(e) { reject("Init Error"); }
        });
    },

    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("SDK Missing");
            const w = new AdexiumWidget({ wid: this.ids.adexiumWidget, adFormat: 'interstitial', debug: false });
            w.on('adReceived', (a) => w.displayAd(a));
            w.on('noAdFound', () => reject("No Fill"));
            w.on('adClosed', () => resolve());
            w.on('adPlaybackCompleted', () => resolve());
            w.on('error', () => reject("Error"));
            setTimeout(() => reject("Timeout"), 8000);
            w.requestAd('interstitial');
        });
    },

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const f = window[`show_${this.ids.monetagZone}`];
            if (typeof f !== 'function') return reject("SDK Missing");
            f(type === 'pop' ? 'pop' : undefined).then(() => resolve()).catch(e => reject(e));
        });
    },

    handleSuccess(cb, mode) {
        console.log(`🎉 Sequence Selesai!`);
        // Tidak perlu closePopup() karena tidak pernah dibuka
        if (cb) cb();
    }
};

window.AdsManager = AdsManager;