// js/ads.js
// ==========================================
// CENTRAL ADS MANAGER (WATERFALL SYSTEM)
// Priority: Adsgram -> Monetag -> Skip
// ==========================================

const AdsManager = {
    // KONFIGURASI ID
    adsgramBlockId: "int-21085",    // ID Adsgram Kamu
    monetagZoneId: "10457329",      // ID Monetag Kamu

    // Fungsi Utama untuk Memanggil Iklan
    async showAd(title, onReward) {
        // 1. Tampilkan Loading Popup (Biar user tau lagi loading iklan)
        if(window.UIEngine) {
            UIEngine.showRewardPopup("ADVERTISEMENT", `Loading Ad from Partner...`, null, "...");
        }

        console.log("[ADS] Starting Waterfall...");

        // --- STEP 1: COBA ADSGRAM ---
        try {
            console.log("[ADS] Trying Adsgram...");
            
            if (window.Adsgram) {
                const AdController = window.Adsgram.init({ blockId: this.adsgramBlockId });
                await AdController.show();
                
                // Jika berhasil nonton sampai habis:
                console.log("[ADS] Adsgram Success!");
                this.handleSuccess(onReward);
                return;
            } else {
                throw new Error("Adsgram script not loaded");
            }

        } catch (error) {
            // Jika Adsgram Gagal/Error/No Fill/User Skip
            console.warn("[ADS] Adsgram Failed or Skipped:", error);
            console.log("[ADS] Switching to Monetag (Backup)...");
            
            // --- STEP 2: COBA MONETAG ---
            this.showMonetag(onReward);
        }
    },

    // Fungsi Backup Monetag
    showMonetag(onReward) {
        // Nama fungsi Monetag biasanya show_ZONEID
        const monetagFunc = window[`show_${this.monetagZoneId}`];

        if (typeof monetagFunc === 'function') {
            monetagFunc().then(() => {
                console.log("[ADS] Monetag Success!");
                this.handleSuccess(onReward);
            }).catch((err) => {
                console.error("[ADS] Monetag Failed:", err);
                // Jika Monetag juga gagal, tetap kasih reward biar user gak marah
                this.handleSuccess(onReward); 
            });
        } else {
            console.warn("[ADS] Monetag function not found. Check script in index.html");
            // Fallback terakhir: Langsung kasih reward
            this.handleSuccess(onReward);
        }
    },

    // Helper saat sukses
    handleSuccess(callback) {
        // Tutup popup loading jika ada
        const popup = document.getElementById('system-popup');
        if(popup) popup.remove();

        // Jalankan logika hadiah game
        if (callback) callback();
    }
};

// Expose ke Window
window.AdsManager = AdsManager;