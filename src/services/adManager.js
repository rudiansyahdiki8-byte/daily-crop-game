/**
 * AD MANAGER - HYBRID EDITION (SDK + LINKS)
 * * Slot 1-2: Adsgram (Plugin)
 * * Slot 3: Adsterra (Direct Link)
 * * Slot 4-5: Monetag (SDK Promise - show_10457329)
 * * Slot 6: RichAds (Script Lazy Load)
 * * Slot 7: Adsterra (Backup)
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    // ID ZONE MONETAG (Dipakai untuk panggil fungsi window[`show_${ZONE}`])
    MONETAG_ZONE: 10457329,

    // ✅ LINK ADSTERRA
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826", 

    // ✅ RICHADS CONFIG
    RICHADS: {
        SCRIPT_URL: "https://richinfo.co/richpartners/telegram/js/tg-ob.js",
        PUB_ID: "1000630",
        APP_ID: "5929"
    }
};

const COOLDOWN_MS = 180 * 1000; // 3 Menit
const WATCH_TIMEOUT = 60000;    // 1 Menit (Timeout Monetag)

let isAdProcessing = false; 

// --- HELPER: LAZY LOAD SCRIPT ---
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => { console.log(`✅ Loaded: ${src}`); resolve(); };
        script.onerror = () => { console.error(`❌ Error: ${src}`); reject(); };
        document.head.appendChild(script);
    });
};

// --- HELPER FUNCTIONS ---
const checkCooldown = (key) => {
    try {
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0; 
    } catch (e) { return true; }
};
const setCooldown = (key) => {
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
};

// UI Overlay
const showLoadingOverlay = (msg = "MENCARI IKLAN...") => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div id="ad-msg" style="margin-top: 15px; font-weight: bold;">${msg}</div>`;
        document.body.appendChild(overlay);
    }
    const msgEl = document.getElementById('ad-msg');
    if(msgEl) msgEl.innerText = msg;
    overlay.style.display = 'flex';
};
const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// UI POPUP
export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        const oldPopup = document.getElementById('ad-reward-popup');
        if (oldPopup) oldPopup.remove();

        const popup = document.createElement('div');
        popup.id = 'ad-reward-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);`;
        
        popup.innerHTML = `
            <div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div>
                <i class="fa-solid ${iconClass} fa-3x" style="color: #FFD700; margin-bottom: 15px;"></i>
                <div style="margin-bottom: 20px;">${message}</div>
                <button id="btn-claim-final" style="background: #00E5FF; color: black; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 1rem;">KLAIM SEKARANG</button>
            </div>`;
        document.body.appendChild(popup);
        const btn = document.getElementById('btn-claim-final');
        if(btn) { btn.onclick = () => { popup.remove(); resolve(true); }; } 
        else { popup.onclick = () => { popup.remove(); resolve(true); }; }
    });
};

export const showConfirmPopup = (title, message, iconClass = 'fa-question-circle') => {
    return new Promise((resolve) => {
        const old = document.getElementById('ad-confirm-popup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'ad-confirm-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2147483647 !important; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);`;
        popup.innerHTML = `
            <div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div>
                <i class="fa-solid ${iconClass} fa-3x" style="color: #00E5FF; margin-bottom: 15px;"></i>
                <p style="color: #E0E0E0; margin: 15px 0; font-size: 1rem; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center; width: 100%;">
                    <button id="btn-cancel" style="padding: 10px 20px; background: #333; color: #ccc; border: 1px solid #555; border-radius: 20px; cursor: pointer;">CANCEL</button>
                    <button id="btn-confirm" style="padding: 10px 30px; background: linear-gradient(90deg, #00E5FF, #2979FF); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold;">CONFIRM</button>
                </div>
            </div>`;
        document.body.appendChild(popup);
        document.getElementById('btn-confirm').onclick = () => { popup.remove(); resolve(true); };
        document.getElementById('btn-cancel').onclick = () => { popup.remove(); resolve(false); };
    });
};

// ==========================================
// === LOGIKA WATERFALL ===
// ==========================================

const openLink = async (url) => {
    try {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(url, {try_instant_view: false});
        else window.open(url, '_blank');
    } catch(e) {}
    await new Promise(r => setTimeout(r, 2000));
};

const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INT
    if (checkCooldown('cd_adsgram_int') && window.Adsgram) {
        try {
            console.log("➡️ [1] Adsgram Int");
            showLoadingOverlay("MEMUAT ADSGRAM...");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('cd_adsgram_int');
            return true;
        } catch (e) { console.warn("Skip Adsgram Int"); }
    }

    // 2. ADSGRAM REWARD
    if (checkCooldown('cd_adsgram_rew') && window.Adsgram) {
        try {
            console.log("➡️ [2] Adsgram Reward");
            showLoadingOverlay("MEMUAT ADSGRAM REWARD...");
            const res = await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
            if (res.done) { setCooldown('cd_adsgram_rew'); return true; }
        } catch (e) { console.warn("Skip Adsgram Rew"); }
    }

    // 3. ADSTERRA LINK
    if (checkCooldown('cd_adsterra_1') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [3] Adsterra Link");
        showLoadingOverlay("MEMBUKA SITUS SPONSOR...");
        await openLink(IDS.ADSTERRA_LINK);
        setCooldown('cd_adsterra_1');
        return true;
    }

    // 4. MONETAG POPUP (SDK METHOD)
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ [4] Monetag Popup");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                showLoadingOverlay("MEMUAT MONETAG...");
                // Pakai Promise sesuai request Anda
                await Promise.race([
                    f('pop').then(() => { 
                        console.log("✅ Monetag Popup Ditutup"); 
                        return true; 
                    }),
                    new Promise((_, reject) => setTimeout(() => reject("Timeout"), WATCH_TIMEOUT))
                ]);
                setCooldown('cd_monetag_pop');
                return true;
            } else {
                console.warn("Script Monetag belum load.");
            }
        } catch (e) { console.warn("Skip Monetag Pop:", e); }
    }

    // 5. MONETAG INTERSTITIAL (SDK METHOD)
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ [5] Monetag Interstitial");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                showLoadingOverlay("MEMUAT VIDEO MONETAG...");
                // Pakai Promise sesuai request Anda
                await Promise.race([
                    f().then(() => { 
                        console.log("✅ Monetag Inters Selesai"); 
                        return true; 
                    }),
                    new Promise((_, reject) => setTimeout(() => reject("Timeout"), WATCH_TIMEOUT))
                ]);
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Int:", e); }
    }

    // 6. RICHADS (SCRIPT)
    if (checkCooldown('cd_richads')) {
        try {
            console.log("➡️ [6] RichAds");
            showLoadingOverlay("MEMUAT RICHADS...");
            await loadScript(IDS.RICHADS.SCRIPT_URL);
            
            if (typeof window.TelegramAdsController !== 'undefined') {
                window.TelegramAdsController = new TelegramAdsController();
                window.TelegramAdsController.initialize({
                    pubId: IDS.RICHADS.PUB_ID,
                    appId: IDS.RICHADS.APP_ID,
                });
                await new Promise(r => setTimeout(r, 3000));
                setCooldown('cd_richads');
                return true;
            }
        } catch(e) { console.warn("RichAds Error:", e); }
    }

    // 7. BACKUP (Adsterra)
    if (checkCooldown('cd_backup') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [7] Backup Link");
        showLoadingOverlay("MEMBUKA SITUS SPONSOR...");
        await openLink(IDS.ADSTERRA_LINK);
        setCooldown('cd_backup');
        return true;
    }

    console.error("❌ SEMUA IKLAN HABIS / COOLDOWN");
    return false;
};

export const showAdStack = async (count = 1) => {
    if (isAdProcessing) return false;
    isAdProcessing = true;
    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                hideLoadingOverlay(); 
                if (i < count - 1) await new Promise(r => setTimeout(r, 2000));
            } else { break; }
        }
    } catch (e) { console.error("Ad Stack Error:", e); } 
    finally {
        hideLoadingOverlay();
        isAdProcessing = false;
        console.log("✅ Iklan Selesai.");
    }
    return successCount > 0;
};

window.resetAds = () => { isAdProcessing = false; hideLoadingOverlay(); console.log("Ads Reset!"); };
