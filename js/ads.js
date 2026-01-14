// js/ads.js
// ==========================================
// SUPER WATERFALL ADS SYSTEM (REORDERED TIER 5 POP)
// ==========================================

const AdsManager = {
    // ID CONFIGURATION
    ids: {
        adsgramReward: "21143",           
        adsgramInter: "int-21085",        
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329"           
    },

    // --- MAIN FUNCTION ---
    async showAd(title, onReward) {
        console.log(`🌊 [Waterfall] Requesting Ad for: ${title}`);
        
        // SHOW LOADING (ENGLISH)
        if(window.UIEngine && typeof UIEngine.showRewardPopup === 'function') {
            UIEngine.showRewardPopup(
                "ADVERTISEMENT", 
                "Loading Ad... Please watch until the end to claim reward.", 
                null, 
                "⏳ Loading..."
            );
        }

        // --- TIER 1: ADSGRAM REWARD ---
        try {
            console.log("1️⃣ [Tier 1] Trying Adsgram Reward...");
            await this.callAdsgram(this.ids.adsgramReward);
            this.handleSuccess(onReward, "Adsgram Reward");
            return;
        } catch (e) {
            console.warn("❌ Tier 1 Failed/Skipped:", e);
        }

        // --- TIER 2: ADEXIUM ---
        try {
            console.log("2️⃣ [Tier 2] Trying Adexium...");
            await this.callAdexium();
            this.handleSuccess(onReward, "Adexium");
            return;
        } catch (e) {
            console.warn("❌ Tier 2 Failed/Skipped:", e);
        }

        // --- TIER 3: ADSGRAM INTERSTITIAL (Moved Up) ---
        // Sebelumnya Tier 4, naik ke Tier 3 karena lebih strict dibanding Monetag
        try {
            console.log("3️⃣ [Tier 3] Trying Adsgram Interstitial...");
            await this.callAdsgram(this.ids.adsgramInter);
            this.handleSuccess(onReward, "Adsgram Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 3 Failed/Skipped:", e);
        }

        // --- TIER 4: MONETAG INTERSTITIAL (Moved Up) ---
        // Sebelumnya Tier 5, naik ke Tier 4
        try {
            console.log("4️⃣ [Tier 4] Trying Monetag Interstitial...");
            await this.callMonetag('interstitial');
            this.handleSuccess(onReward, "Monetag Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 4 Failed:", e);
        }

        // --- TIER 5: MONETAG POP (Moved Down - Last Resort) ---
        // Pindah ke posisi terakhir karena validasinya paling lemah
        try {
            console.log("5️⃣ [Tier 5] Trying Monetag Pop (Backup)...");
            await this.callMonetag('pop');
            this.handleSuccess(onReward, "Monetag Pop");
            return;
        } catch (e) {
            console.warn("❌ Tier 5 Failed:", e);
        }

        // ALL FAILED
        this.closeLoading();
        alert("Sorry, no ads available right now. Please try again later.");
    },

    // ==========================================
    // HELPER FUNCTIONS (STRICT MODE & ENGLISH)
    // ==========================================

    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Adsgram SDK missing");
            
            // Timeout 8 seconds
            const timer = setTimeout(() => reject("Timeout Adsgram"), 8000);

            try {
                const AdController = window.Adsgram.init({ blockId: blockId });
                AdController.show().then((result) => {
                    clearTimeout(timer);
                    
                    // STRICT LOGIC: done must be true
                    if (result.done) {
                        resolve();
                    } else {
                        reject("User skipped video");
                    }

                }).catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            } catch (e) {
                clearTimeout(timer);
                reject(e);
            }
        });
    },

    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium SDK missing");
            const timer = setTimeout(() => reject("Timeout Adexium"), 8000);

            try {
                const adWidget = new AdexiumWidget({
                    wid: this.ids.adexiumWidget,
                    adFormat: 'interstitial',
                    debug: false
                    fallback: false 
                });

                adWidget.on('adReceived', () => clearTimeout(timer));
                adWidget.on('noAdFound', () => { clearTimeout(timer); reject("No Fill"); });

                // STRICT LOGIC: Closing manually = Reject
                adWidget.on('adClosed', () => {
                   reject("User closed Adexium manually");
                });

                // Only resolve if playback completed
                adWidget.on('adPlaybackCompleted', () => resolve());
                
                adWidget.requestAd('interstitial');
            } catch (e) {
                clearTimeout(timer);
                reject(e);
            }
        });
    },

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const funcName = `show_${this.ids.monetagZone}`;
            if (typeof window[funcName] !== 'function') return reject("Monetag SDK missing");

            if (type === 'pop') {
                window[funcName]('pop').then(resolve, reject);
            } else {
                window[funcName]().then(resolve, reject);
            }
        });
    },

    handleSuccess(callback, source) {
        console.log(`✅ Success via: ${source}`);
        this.closeLoading();
        if (callback) callback();
    },

    closeLoading() {
        if(document.getElementById('system-popup')) {
            document.getElementById('system-popup').remove();
        }
    }
};

window.AdsManager = AdsManager;
