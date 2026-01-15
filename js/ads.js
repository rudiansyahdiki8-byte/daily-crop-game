// js/ads.js
// ==========================================
// ULTIMATE ADS MANAGER (ENGLISH & FIREBASE SYNC)
// Fitur: Anti-Reset Data, Bahasa Inggris, & Fail-Safe Waterfall
// ==========================================

const AdsManager = {
    ids: {
        adsgramReward: "21143",           
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329",          
        adsgramInter: "int-21085"         
    },

    ADEXIUM_COOLDOWN: 60, // Menit

    async startAdsSequence(jumlahAds, kategori, onReward) {
        console.log(`🚀 [System] Start Stack. Mode: ${kategori.toUpperCase()}`);
        let sukses = 0;

        for (let i = 0; i < jumlahAds; i++) {
            
            // Tampilkan Loading (BAHASA INGGRIS AGAR CPM NAIK)
            if(window.UIEngine) {
                let judul = kategori === 'vip' ? "PRIORITY SPONSOR" : "SPONSOR";
                UIEngine.showRewardPopup(judul, "Loading Advertisement...", null, `⏳ Ad ${i+1}/${jumlahAds}`);
            }

            let antrianIklan = [];

            if (kategori === 'vip') {
                // Mode VIP (Wallet/Spin) - Prioritas Adsgram
                antrianIklan = [
                    { name: "Adsgram Reward", func: () => this.callAdsgram(this.ids.adsgramReward) },
                    { name: "Adexium",        func: () => this.callAdexium() },
                    { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                    { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') }
                ];
            } else {
                // Mode Regular - Cek Cooldown dari SERVER (Bukan LocalStorage)
                let adexiumReady = this.checkAdexiumCooldown();

                if (adexiumReady && (i % 2 === 0)) { 
                    antrianIklan = [
                        { name: "Adexium",        func: () => this.callAdexium() },
                        { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                        { name: "Monetag Pop",    func: () => this.callMonetag('pop') }
                    ];
                } else {
                    antrianIklan = [
                        
                        { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                        { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') },
                        { name: "Monetag Pop",    func: () => this.callMonetag('pop') }
                    ];
                }
            }

            // Jalankan Waterfall
            let berhasilDiStackIni = false;
            for (let source of antrianIklan) {
                try {
                    console.log(`▶️ Trying: ${source.name}...`);
                    await source.func();
                    
                    console.log(`✅ Success via ${source.name}`);
                    berhasilDiStackIni = true;
                    
                    // Simpan Waktu Adexium ke SERVER (Firebase)
                    if (source.name === "Adexium") this.setAdexiumLastShown();
                    break;
                } catch (err) {
                    console.warn(`⚠️ ${source.name} Skip. Next backup...`);
                }
            }

            if (berhasilDiStackIni) {
                sukses++;
                await new Promise(r => setTimeout(r, 1500));
            } else {
                console.error(`❌ Failed at Stack ${i+1}.`);
            }
        }

        if (sukses > 0) {
            this.handleSuccess(onReward, kategori);
        } else {
            // Pesan Error Bahasa Inggris
            alert("Ads failed to load. Please check your connection or VPN.");
            const popup = document.getElementById('system-popup');
            if(popup) popup.remove();
        }
    },

    // --- PERBAIKAN LOGIC WAKTU (FIREBASE SYNC) ---
    checkAdexiumCooldown() {
        // Ambil dari GameState.user (Data Server), JANGAN LocalStorage
        if (!window.GameState || !GameState.user) return false;
        
        // Ambil data ad_timers dari user
        const timers = GameState.user.ad_timers || {};
        const last = timers['adexium'];
        
        if (!last) return true; // Belum pernah nonton -> Boleh
        const diff = (Date.now() - parseInt(last)) / 1000 / 60;
        return diff >= this.ADEXIUM_COOLDOWN;
    },

    setAdexiumLastShown() {
        if (!window.GameState || !GameState.user) return;
        
        if (!GameState.user.ad_timers) GameState.user.ad_timers = {};
        GameState.user.ad_timers['adexium'] = Date.now();
        
        // PENTING: Langsung simpan ke Firebase agar tidak hilang saat refresh
        GameState.save(); 
    },

    // --- HELPER (SDK) ---
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
    // Helper: Adexium (Promise Wrapper karena dia pakai Event Listener)
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


    handleSuccess(cb, mode) {
        console.log(`🎉 Sequence Finished!`);
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        if (cb) cb();
    }
};

window.AdsManager = AdsManager;



