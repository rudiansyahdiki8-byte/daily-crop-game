/**
 * AD MANAGER - ADEXIUM ADVANCED INTEGRATION FIXED
 * Fitur:
 * 1. Adexium Fix: Menggunakan URL 'techtg.space' & pola request -> received -> display.
 * 2. Cooldown 3 Menit (180 Detik) untuk semua iklan.
 * 3. Urutan: Adsgram Int -> Adexium -> Reward -> Monetag -> GigaPub.
 */

// 1. CONFIG ID
const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
    GIGAPUB_ID: 5436,             
    MONETAG_ZONE: 10457329
};

// ATURAN COOLDOWN: 3 MENIT
const COOLDOWN_MS = 180 * 1000; 

// --- HELPER: LOCAL STORAGE ---
const checkCooldown = (key) => {
    try {
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        const remaining = COOLDOWN_MS - (Date.now() - lastTime);
        if (remaining > 0) {
            console.log(`⏳ ${key} Cooldown: Tunggu ${Math.ceil(remaining/1000)} detik`);
            return false; 
        }
        return true; 
    } catch (e) { return true; }
};

const setCooldown = (key) => {
    try {
        localStorage.setItem(key, Date.now().toString());
    } catch (e) {}
};

// --- HELPER: TIMEOUT ---
const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
    ]);
};

// --- 0. SCRIPT INJECTOR (UPDATED URL) ---
(function initAdScripts() {
    if (typeof window === 'undefined') return;

    // A. Adsgram
    if (!document.querySelector('script[src*="adsgram.ai"]')) {
        const sc = document.createElement('script');
        sc.src = "https://sad.adsgram.ai/js/sad.min.js";
        sc.async = true;
        document.head.appendChild(sc);
    }
    
    // B. ADEXIUM (UPDATED URL SESUAI DOKUMENTASI ANDA)
    // Menggunakan cdn.techtg.space
    if (!document.querySelector('script[src*="techtg.space"]')) {
        const sc = document.createElement('script');
        sc.src = "https://cdn.techtg.space/assets/js/tg-ads-co-widget.min.js";
        sc.async = true;
        document.head.appendChild(sc);
    }
    
    // C. GigaPub
    if (!document.getElementById('gigapub-loader')) {
        const p = IDS.GIGAPUB_ID;
        const d = ['https://ad.gigapub.tech','https://ru-ad.gigapub.tech'];
        let i = 0, t, sc;
        function l(){
             sc = document.createElement('script');
             sc.id = 'gigapub-loader';
             sc.async = true;
             sc.src = d[i] + '/script?id=' + p;
             t = setTimeout(function(){
                 sc.onload = sc.onerror = null;
                 sc.remove();
                 if(++i < d.length) l();
             }, 15000);
             sc.onload = function(){ clearTimeout(t); };
             sc.onerror = function(){ clearTimeout(t); if(++i < d.length) l(); };
             document.head.appendChild(sc);
        }
        l();
    }
    // D. Monetag
    if (!document.querySelector('script[src*="libtl.com"]')) {
        const sc = document.createElement('script');
        sc.src = "//libtl.com/sdk.js"; 
        sc.dataset.zone = IDS.MONETAG_ZONE;
        sc.dataset.sdk = `show_${IDS.MONETAG_ZONE}`;
        document.head.appendChild(sc);
    }
})();

// --- A. VISUAL LOADING ---
const showLoadingOverlay = () => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.92); z-index: 9999999;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = `
            <div class="ad-watching-container">
                <div class="ad-timer-circle"></div>
                <div class="ad-text">MEMUAT IKLAN...</div>
                <div style="font-size: 0.8rem; color: #aaa; margin-top:5px;">Jangan tutup iklan sebelum selesai</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
};

const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// --- B. POPUP HELPERS ---
export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        let popup = document.getElementById('ad-reward-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'ad-reward-popup';
            popup.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 100000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px);
            `;
            document.body.appendChild(popup);
        }

        popup.innerHTML = `
            <div class="reward-container">
                <div class="reward-title">${title}</div>
                <div class="reward-icon-wrapper">
                    <i class="fa-solid ${iconClass} fa-3x" style="color: #FFD700;"></i>
                </div>
                <div class="reward-amount">${message}</div>
                <button id="btn-claim-reward" class="btn-claim">KLAIM</button>
            </div>
        `;
        popup.style.display = 'flex';
        setTimeout(() => {
            const btn = document.getElementById('btn-claim-reward');
            if (btn) btn.onclick = () => { popup.style.display = 'none'; resolve(true); };
        }, 50);
    });
};

export const showConfirmPopup = (title, message, iconClass = 'fa-question-circle') => {
    return new Promise((resolve) => {
        const old = document.getElementById('ad-confirm-popup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'ad-confirm-popup';
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 2147483647 !important;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(10px);
        `;
        popup.innerHTML = `
            <div class="reward-container" style="border-color: #00E5FF;">
                <div class="reward-title" style="color: #00E5FF;">${title}</div>
                <div class="reward-icon-wrapper">
                    <i class="fa-solid ${iconClass} fa-3x" style="color: #00E5FF;"></i>
                </div>
                <p style="color: #E0E0E0; margin: 15px 0; font-size: 1rem; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center; width: 100%;">
                    <button id="btn-cancel" style="padding: 10px 20px; background: #333; color: #ccc; border: 1px solid #555; border-radius: 20px; cursor: pointer;">CANCEL</button>
                    <button id="btn-confirm" style="padding: 10px 30px; background: linear-gradient(90deg, #00E5FF, #2979FF); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold;">CONFIRM</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => {
            const btnYes = document.getElementById('btn-confirm');
            const btnNo = document.getElementById('btn-cancel');
            if (btnYes) btnYes.onclick = () => { popup.remove(); resolve(true); };
            if (btnNo) btnNo.onclick = () => { popup.remove(); resolve(false); };
        }, 50);
    });
};

// --- D. CORE LOGIC: WATERFALL SEQUENCE ---
const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INTERSTITIAL (TON)
    if (checkCooldown('last_adsgram_int')) {
        try {
            if (window.Adsgram) {
                console.log("➡️ Step 1: Adsgram Interstitial");
                const AdController = window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false });
                await AdController.show();
                setCooldown('last_adsgram_int');
                return true;
            }
        } catch (e) { console.warn("⚠️ Skip Step 1:", e); }
    }

    // 2. ADEXIUM INTERSTITIAL (USD) - UPDATED LOGIC "ADVANCED"
    if (checkCooldown('last_adexium')) {
        try {
            if (window.AdexiumWidget) {
                console.log("➡️ Step 2: Adexium Interstitial");
                await new Promise((resolve, reject) => {
                    const adexium = new window.AdexiumWidget({
                        wid: IDS.ADEXIUM,
                        adFormat: 'interstitial',
                        isFullScreen: true,
                        debug: false // Gunakan True hanya jika ingin test mode
                    });

                    // PENTING: Sesuai dokumentasi Advanced Integration
                    // 1. Listen kalau iklan diterima
                    adexium.on('adReceived', (ad) => {
                        console.log("✅ Adexium Received, Displaying...");
                        adexium.displayAd(ad); // <--- WAJIB DIPANGGIL
                    });

                    // 2. Listen kalau tidak ada iklan
                    adexium.on('noAdFound', () => {
                        cleanup();
                        reject('No Fill');
                    });

                    // 3. Listen kalau iklan selesai/ditutup (Untuk resume game)
                    const onFinish = () => { cleanup(); resolve(); };
                    adexium.on('adPlaybackCompleted', onFinish);
                    adexium.on('adClosed', onFinish);

                    // 4. Request Iklan
                    adexium.requestAd('interstitial');

                    // Cleanup function
                    const cleanup = () => { adexium.destroy?.(); };
                    
                    // Safety Timeout 10 detik
                    setTimeout(() => { cleanup(); reject('Adexium Timeout'); }, 10000);
                });

                setCooldown('last_adexium');
                return true;
            }
        } catch (e) { console.warn("⚠️ Skip Step 2:", e); }
    }

    // 3. ADSGRAM REWARD (TON)
    if (checkCooldown('last_adsgram_rew')) {
        try {
            if (window.Adsgram) {
                console.log("➡️ Step 3: Adsgram Reward");
                const AdControllerRew = window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false });
                const result = await AdControllerRew.show();
                if (result.done === true) {
                    setCooldown('last_adsgram_rew');
                    return true;
                } else throw new Error("Reward Skipped");
            }
        } catch (e) { console.warn("⚠️ Skip Step 3:", e); }
    }

    // 4. MONETAG (USD - RINGAN)
    if (checkCooldown('last_monetag')) {
        try {
            console.log("➡️ Step 4: Monetag");
            const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof monetagFunc === 'function') {
                await withTimeout(monetagFunc(), 5000);
                setCooldown('last_monetag'); 
                return true; 
            }
        } catch (e) { console.log("⚠️ Monetag Lewat:", e); }
    }

    // 5. GIGAPUB (TON/USDT - VIDEO BERAT)
    if (checkCooldown('last_gigapub')) {
        try {
            if (typeof window.showGiga === 'function') {
                console.log("➡️ Step 5: GigaPub");
                await withTimeout(window.showGiga(), 8000);
                setCooldown('last_gigapub'); 
                return true;
            }
        } catch (e) { console.warn("⚠️ Skip Step 5:", e); }
    }

    console.error("❌ ALL ADS FAILED / COOLDOWN");
    return false;
};

export const showAdStack = async (count = 1) => {
    showLoadingOverlay();
    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                if (i < count - 1) {
                    showLoadingOverlay(); 
                    await new Promise(r => setTimeout(r, 1000));
                }
            } else {
                console.log("Gagal memuat iklan atau sedang Cooldown.");
                break; 
            }
        }
    } catch (e) {
        console.error("Ad Stack Error:", e);
    } finally {
        hideLoadingOverlay();
    }
    return successCount > 0;
};
