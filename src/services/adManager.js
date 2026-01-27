/**
 * AD MANAGER - FINAL (WITH SMARTLINK FALLBACK)
 * Urutan Waterfall:
 * 1. Adsgram Interstitial (TON)
 * 2. Adexium (USD - High CPM)
 * 3. Adsgram Reward (TON)
 * 4. Monetag (USD SDK)
 * 5. SMARTLINK (Fallback Terakhir - Pasti Terbuka)
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
    MONETAG_ZONE: 10457329,
    
    // 🔴 GANTI INI DENGAN URL SMARTLINK ASLI ANDA
    // Contoh: "https://example.com/direct-link-anda"
    SMARTLINK_URL: "https://link.gigapub.tech/l/vi8999zpr" 
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
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
};

// --- HELPER: TIMEOUT ---
const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
    ]);
};

// --- UI HELPERS ---
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

// --- CORE WATERFALL LOGIC ---
const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INTERSTITIAL
    if (checkCooldown('last_adsgram_int')) {
        try {
            if (window.Adsgram) {
                console.log("➡️ Step 1: Adsgram Int");
                const AdController = window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false });
                await AdController.show();
                setCooldown('last_adsgram_int');
                return true;
            }
        } catch (e) { console.warn("⚠️ Step 1 Skip:", e); }
    }

    // 2. ADEXIUM (CODE VALID - JANGAN DIUBAH)
    if (checkCooldown('last_adexium')) {
        try {
            if (window.AdexiumWidget) {
                console.log("➡️ Step 2: Adexium");
                await new Promise((resolve, reject) => {
                    const adexium = new window.AdexiumWidget({
                        wid: IDS.ADEXIUM,
                        adFormat: 'interstitial',
                        isFullScreen: true,
                        debug: false
                    });

                    // Logic: Received -> Display
                    adexium.on('adReceived', (ad) => {
                        console.log("✅ Adexium Received, Displaying...");
                        adexium.displayAd(ad); 
                    });

                    adexium.on('noAdFound', () => { cleanup(); reject('No Fill'); });
                    
                    const onFinish = () => { cleanup(); resolve(); };
                    adexium.on('adPlaybackCompleted', onFinish);
                    adexium.on('adClosed', onFinish);

                    const cleanup = () => { try { adexium.destroy?.(); } catch(e){} };

                    adexium.requestAd('interstitial');
                    setTimeout(() => { cleanup(); reject('Timeout'); }, 15000); 
                });
                setCooldown('last_adexium');
                return true;
            }
        } catch (e) { console.warn("⚠️ Step 2 Skip:", e); }
    }

    // 3. ADSGRAM REWARD
    if (checkCooldown('last_adsgram_rew')) {
        try {
            if (window.Adsgram) {
                console.log("➡️ Step 3: Adsgram Reward");
                const AdController = window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false });
                const res = await AdController.show();
                if (res.done) {
                    setCooldown('last_adsgram_rew');
                    return true;
                }
            }
        } catch (e) { console.warn("⚠️ Step 3 Skip:", e); }
    }

    // 4. MONETAG
    if (checkCooldown('last_monetag')) {
        try {
            console.log("➡️ Step 4: Monetag");
            const funcName = `show_${IDS.MONETAG_ZONE}`;
            
            if (typeof window[funcName] === 'function') {
                // Trik: Kita coba panggil yang biasa dulu (Interstitial)
                try {
                    console.log("   👉 Coba Monetag Video...");
                    await withTimeout(window[funcName](), 6000); // Tunggu 6 detik
                } catch (errVideo) {
                    console.warn("   ⚠️ Monetag Video Kosong, ganti ke Popup...", errVideo);
                    // Jika Video gagal, kita paksa pakai mode 'pop' (Popup)
                    // Mode 'pop' biasanya fill ratenya tinggi
                    await withTimeout(window[funcName]('pop'), 6000);
                }
                
                setCooldown('last_monetag');
                return true;
            }
        } catch (e) { console.log("⚠️ Step 4 Skip:", e); }
    }

    // 5. SMARTLINK (PENGGANTI GIGAPUB)
    // Syarat: URL harus diisi dan valid
    if (checkCooldown('last_smartlink') && IDS.SMARTLINK_URL.startsWith('http')) {
        try {
            console.log("➡️ Step 5: Smartlink Fallback");
            
            // Gunakan Telegram WebApp untuk membuka link dengan aman
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(IDS.SMARTLINK_URL);
            } else {
                // Fallback untuk browser biasa
                window.open(IDS.SMARTLINK_URL, '_blank');
            }
            
            // Kita anggap sukses karena link pasti terbuka
            setCooldown('last_smartlink');
            return true;
        } catch (e) { console.warn("⚠️ Step 5 Skip:", e); }
    }

    console.error("❌ ALL ADS FAILED");
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
