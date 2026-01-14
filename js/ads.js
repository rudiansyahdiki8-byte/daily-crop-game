// js/ads.js
// ==========================================
// PRIORITY STACKING + 5-TIER WATERFALL SYSTEM
// ==========================================

const AdsManager = {
    // 1. CONFIGURATION (English IDs)
    ids: {
        adsgramReward: "21143",           
        adexiumWidget: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
        monetagZone: "10457329",          
        adsgramInter: "int-21085"         
    },

    // 2. MAIN FUNCTION: SINGLE AD (Waterfall 5 Tiers)
    async showAd(type, onReward) {
        console.log("🌊 [Waterfall] Initializing ad sequence...");
        
        if(window.UIEngine) {
            UIEngine.showRewardPopup("ADVERTISEMENT", "Looking for the best sponsor...", null, "⏳ Loading...");
        }

        // TIER 1: ADSGRAM REWARD
        try {
            console.log("1️⃣ [Tier 1] Trying Adsgram Reward...");
            await this.callAdsgram(this.ids.adsgramReward);
            this.handleSuccess(onReward, "Adsgram Reward");
            return;
        } catch (e) {
            console.warn("❌ Tier 1 Failed:", e);
        }

        // TIER 2: ADSGRAM INTERSTITIAL
        try {
            console.log("2️⃣ [Tier 2] Trying Adsgram Interstitial...");
            await this.callAdsgram(this.ids.adsgramInter);
            this.handleSuccess(onReward, "Adsgram Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 2 Failed:", e);
        }

        // TIER 3: ADEXIUM
        try {
            console.log("3️⃣ [Tier 3] Trying Adexium...");
            await this.callAdexium();
            this.handleSuccess(onReward, "Adexium");
            return;
        } catch (e) {
            console.warn("❌ Tier 3 Failed:", e);
        }

        // TIER 4: MONETAG INTERSTITIAL
        try {
            console.log("4️⃣ [Tier 4] Trying Monetag Interstitial...");
            await this.callMonetag('interstitial');
            this.handleSuccess(onReward, "Monetag Interstitial");
            return;
        } catch (e) {
            console.warn("❌ Tier 4 Failed:", e);
        }

        // TIER 5: MONETAG REWARD POP (Final Backup)
        try {
            console.log("5️⃣ [Tier 5] Trying Monetag Reward Pop...");
            await this.callMonetag('pop');
            this.handleSuccess(onReward, "Monetag Pop");
            return;
        } catch (e) {
            console.warn("❌ Tier 5 Failed:", e);
        }

        // IF ALL FAILED
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        alert("Sorry, no ads available at the moment. Please try again later.");
    },

    // 3. SPECIAL FUNCTION: PRIORITY STACK (3 Ads Priority to Adsgram)
    async showStackAd(type, count, onFinalReward) {
        console.log(`🌀 Starting Priority Stack: Target ${count} ads`);
        let completed = 0;

        const runStep = async () => {
            if (completed >= count) {
                console.log("🏆 All stacked ads completed!");
                if (onFinalReward) onFinalReward();
                return;
            }

            // TRY ADSGRAM REWARD FIRST (Repeat until 'count' is met)
            try {
                console.log(`Trying Adsgram for ad #${completed + 1}`);
                await this.callAdsgram(this.ids.adsgramReward);
                completed++;
                setTimeout(() => runStep(), 1500); 
            } 
            // IF ADSGRAM FAILS, FALLBACK TO WATERFALL (Tier 2-5)
            catch (e) {
                console.warn("Adsgram exhausted, moving to backup vendors...");
                this.showAd(type, () => {
                    completed++;
                    setTimeout(() => runStep(), 1500);
                });
            }
        };

        runStep();
    },

    // 4. HELPER FUNCTIONS
    callAdsgram(blockId) {
        return new Promise((resolve, reject) => {
            if (!window.Adsgram) return reject("Script not loaded");
            const AdController = window.Adsgram.init({ blockId: blockId });
            AdController.show().then((result) => {
                if (blockId === this.ids.adsgramInter) resolve(); 
                else {
                    if (result.done) resolve();
                    else reject("User skipped video");
                }
            }).catch((err) => reject(err));
        });
    },

    callAdexium() {
        return new Promise((resolve, reject) => {
            if (typeof AdexiumWidget === 'undefined') return reject("Adexium SDK missing");
            const adWidget = new AdexiumWidget({ wid: this.ids.adexiumWidget, adFormat: 'interstitial' });
            adWidget.on('adReceived', (ad) => adWidget.displayAd(ad));
            adWidget.on('noAdFound', () => reject("No Fill Adexium"));
            adWidget.on('adClosed', () => resolve());
            adWidget.on('adPlaybackCompleted', () => resolve());
            adWidget.requestAd('interstitial');
        });
    },

    callMonetag(type) {
        return new Promise((resolve, reject) => {
            const funcName = `show_${this.ids.monetagZone}`;
            const monetagFunc = window[funcName];
            if (typeof monetagFunc !== 'function') return reject("Monetag SDK missing");
            if (type === 'pop') monetagFunc('pop').then(() => resolve()).catch(e => reject(e));
            else monetagFunc().then(() => resolve()).catch(e => reject(e));
        });
    },

    handleSuccess(callback, source) {
        console.log(`✅ [Waterfall] Success from: ${source}`);
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();
        if (callback) callback();
    }
};

window.AdsManager = AdsManager;
