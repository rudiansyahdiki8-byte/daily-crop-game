/**
 * AD MANAGER - ULTIMATE TIMER EDITION
 * * Fitur: SEMUA SLOT (Link/Popup) memiliki timer mundur wajib 15 detik.
 * * Bahasa: Full English.
 * * Slot: Adsgram -> Adsterra -> Monetag (Pop/Int) -> RichAds -> GigaPub -> Backup.
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    MONETAG_ZONE: 10457329, // SDK ZONE

    // ✅ LINK ADSTERRA
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826", 

    // ✅ LINK GIGAPUB (Dimasukkan kembali sesuai request)
    GIGAPUB_LINK: "https://link.gigapub.tech/l/vi8999zpr",

    // ✅ RICHADS CONFIG
    RICHADS: {
        SCRIPT_URL: "https://richinfo.co/richpartners/telegram/js/tg-ob.js",
        PUB_ID: "1000630",
        APP_ID: "5929"
    }
};

const COOLDOWN_MS = 360 * 1000; // 3 Minutes
const WATCH_TIMEOUT = 60000;    

let isAdProcessing = false; 

// --- HELPER: COUNTDOWN TIMER (Visual) ---
const runCountdown = (seconds) => {
    return new Promise(resolve => {
        let counter = seconds;
        const msgEl = document.getElementById('ad-msg');
        
        // Update teks awal
        if(msgEl) msgEl.innerText = `PLEASE WAIT ${counter}s...`;

        const interval = setInterval(() => {
            counter--;
            if (counter > 0) {
                if(msgEl) msgEl.innerText = `PLEASE WAIT ${counter}s...`;
            } else {
                clearInterval(interval);
                if(msgEl) msgEl.innerText = "COMPLETED!";
                resolve(); // Timer selesai
            }
        }, 1000);
    });
};

// --- HELPER: LAZY LOAD ---
const loadScript = (src, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        const timer = setTimeout(() => { script.src = ""; reject("Script Timeout"); }, timeout);
        script.onload = () => { clearTimeout(timer); console.log(`✅ Loaded: ${src}`); resolve(); };
        script.onerror = () => { clearTimeout(timer); console.error(`❌ Error: ${src}`); reject(); };
        document.head.appendChild(script);
    });
};

// --- HELPER: COOLDOWN ---
const checkCooldown = (key) => {
    try {
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0; 
    } catch (e) { return true; }
};
const setCooldown = (key) => {
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
};

// --- UI OVERLAY ---
const showLoadingOverlay = (msg = "SEARCHING FOR ADS...") => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div id="ad-msg" style="margin-top: 15px; font-weight: bold; font-size: 1.2rem;">${msg}</div>`;
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

// --- UI POPUP ---
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
                <button id="btn-claim-final" style="background: #00E5FF; color: black; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 1rem;">CLAIM REWARD</button>
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
// === WATERFALL LOGIC ===
// ==========================================

const openLink = async (url) => {
    try {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(url, {try_instant_view: false});
        else window.open(url, '_blank');
    } catch(e) {}
};

const getSingleAd = async () => {
    console.log("🌊 Starting Ad Waterfall...");

    // 1. ADSGRAM INT
    if (checkCooldown('cd_adsgram_int') && window.Adsgram) {
        try {
            console.log("➡️ [1] Adsgram Int");
            showLoadingOverlay("LOADING ADSGRAM...");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('cd_adsgram_int');
            return true;
        } catch (e) { console.warn("Skip Adsgram Int"); }
    }

    // 2. ADSGRAM REWARD
    if (checkCooldown('cd_adsgram_rew') && window.Adsgram) {
        try {
            console.log("➡️ [2] Adsgram Reward");
            showLoadingOverlay("LOADING REWARD...");
            const res = await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
            if (res.done) { setCooldown('cd_adsgram_rew'); return true; }
        } catch (e) { console.warn("Skip Adsgram Rew"); }
    }

    // 3. ADSTERRA LINK (WITH TIMER 15s)
    if (checkCooldown('cd_adsterra_1') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [3] Adsterra Link");
        showLoadingOverlay("OPENING SPONSOR...");
        
        openLink(IDS.ADSTERRA_LINK);
        await runCountdown(15);
        
        setCooldown('cd_adsterra_1');
        return true;
    }

    // 4. MONETAG POPUP (WITH TIMER 15s)
    // Walaupun user tutup popupnya, timer di layar game tetap jalan 15s
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ [4] Monetag Popup");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                showLoadingOverlay("LOADING MONETAG...");
                
                const adPromise = f('pop').catch(() => null); 
                const timerPromise = runCountdown(15); // Wajib tunggu 15s

                await Promise.all([adPromise, timerPromise]);

                setCooldown('cd_monetag_pop');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Pop:", e); }
    }

    // 5. MONETAG INTERSTITIAL (WITH TIMER 15s)
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ [5] Monetag Interstitial");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                showLoadingOverlay("LOADING VIDEO...");
                
                const adPromise = f().catch(() => null);
                const timerPromise = runCountdown(15); // Disamakan 15s

                await Promise.all([adPromise, timerPromise]);
                
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Int:", e); }
    }

    // 6. RICHADS (WITH TIMER 15s)
    if (checkCooldown('cd_richads')) {
        try {
            console.log("➡️ [6] RichAds");
            showLoadingOverlay("LOADING RICHADS...");
            
            await loadScript(IDS.RICHADS.SCRIPT_URL, 8000);
            
            if (typeof window.TelegramAdsController !== 'undefined') {
                window.TelegramAdsController = new TelegramAdsController();
                window.TelegramAdsController.initialize({
                    pubId: IDS.RICHADS.PUB_ID,
                    appId: IDS.RICHADS.APP_ID,
                });
                
                // Wajib tunggu 15s
                await runCountdown(15);
                
                setCooldown('cd_richads');
                return true;
            }
        } catch(e) { console.warn("RichAds Error:", e); }
    }

    // 7. GIGAPUB SMARTLINK (WITH TIMER 15s)
    if (checkCooldown('cd_gigapub') && IDS.GIGAPUB_LINK) {
        console.log("➡️ [7] GigaPub Link");
        showLoadingOverlay("OPENING SPONSOR...");
        
        openLink(IDS.GIGAPUB_LINK);
        await runCountdown(15);

        setCooldown('cd_gigapub');
        return true;
    }

    // 8. BACKUP (Adsterra) - Safety Net
    if (checkCooldown('cd_backup') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [8] Backup Link");
        showLoadingOverlay("OPENING SPONSOR...");
        
        openLink(IDS.ADSTERRA_LINK);
        await runCountdown(15);

        setCooldown('cd_backup');
        return true;
    }

    console.error("❌ ALL ADS COOLDOWN / ERROR");
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
        console.log("✅ Ads Completed.");
    }
    return successCount > 0;
};

window.resetAds = () => { isAdProcessing = false; hideLoadingOverlay(); console.log("Ads Reset!"); };
