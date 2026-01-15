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
                        { name: "Monetag Pop",    func: () => this.callMonetag('pop') },
                        { name: "Adsgram Inter",  func: () => this.callAdsgram(this.ids.adsgramInter) },
                        { name: "Monetag Inter",  func: () => this.callMonetag('interstitial') }
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

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const f = window[`show_${this.ids.monetagZone}`];
            if (typeof f !== 'function') return reject("SDK Missing");
            f(type === 'pop' ? 'pop' : undefined).then(() => resolve()).catch(e => reject(e));
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

