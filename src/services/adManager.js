/**
 * AD MANAGER - FULL ARSENAL
 * * URUTAN WATERFALL (6 LAYER):
 * 1. Adsgram Interstitial (SDK)
 * 2. Adsgram Reward (SDK)
 * 3. Monetag Popup (SDK TWA)
 * 4. Monetag Interstitial (SDK TWA)
 * 5. Adsterra Smartlink (Browser Link)
 * 6. Monetag Smartlink (Browser Link)
 */

const IDS = {
    // ADSGRAM (Video Resmi)
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    // MONETAG TWA (SDK)
    MONETAG_ZONE_TWA: 10457329, 

    // DIRECT LINKS (Browser)
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826",
    MONETAG_LINK: "https://otieu.com/4/10535147", 
};

// COOLDOWN 3 MENIT
const COOLDOWN_MS = 180 * 1000; 

let isAdProcessing = false; 

// --- HELPER FUNCTIONS ---
const checkCooldown = (key) => {
    try {
        // Dev Mode (Laptop) selalu true
        if (!window.Telegram?.WebApp?.initDataUnsafe?.user) return true;

        const lastTime = parseInt(localStorage.getItem(key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0; 
    } catch (e) { return true; }
};

const setCooldown = (key) => {
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
};

// UI Loading
const showLoadingOverlay = (msg = "LOADING AD...") => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #00E5FF; font-family: monospace;`;
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="width: 50px; height: 50px; border: 3px solid #333; border-top: 3px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="margin-top: 20px; font-weight: bold; letter-spacing: 2px;">${msg}</div>
        <style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
    `;
    overlay.style.display = 'flex';
};

const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// ==========================================
// === SISTEM POPUP (Custom UI) ===
// ==========================================

export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        const old = document.getElementById('ad-reward-popup');
        if (old) old.remove();

        const popup = document.createElement('div');
        popup.id = 'ad-reward-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); animation: fadeIn 0.2s;`;
        popup.innerHTML = `
            <div style="background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 20px; border: 1px solid #00E5FF; text-align: center; color: white; min-width: 300px; box-shadow: 0 0 30px rgba(0,229,255,0.2);">
                <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF; text-shadow: 0 0 10px rgba(0,229,255,0.5);">${title}</div>
                <i class="fa-solid ${iconClass} fa-4x" style="color: #FFD700; margin-bottom: 20px; filter: drop-shadow(0 0 10px gold);"></i>
                <div style="margin-bottom: 25px; color: #ccc;">${message}</div>
                <button id="btn-claim-reward" style="background: linear-gradient(90deg, #00E5FF, #2979FF); color: black; border: none; padding: 12px 40px; border-radius: 25px; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(0,229,255,0.3);">CLAIM</button>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('btn-claim-reward').onclick = () => { popup.remove(); resolve(true); };
    });
};

export const showConfirmPopup = (title, message, iconClass = 'fa-question-circle') => {
    return new Promise((resolve) => {
        const old = document.getElementById('ad-confirm-popup');
        if (old) old.remove();

        const popup = document.createElement('div');
        popup.id = 'ad-confirm-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); animation: fadeIn 0.2s;`;
        popup.innerHTML = `
            <div style="background: #111; padding: 25px; border-radius: 20px; border: 1px solid #333; text-align: center; color: white; min-width: 280px; max-width: 80%;">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; color: #00E5FF;">${title}</div>
                <i class="fa-solid ${iconClass} fa-3x" style="color: #aaa; margin: 15px 0;"></i>
                <p style="color: #ddd; margin-bottom: 25px; font-size: 0.9rem; line-height: 1.4;">${message.replace(/\n/g, '<br/>')}</p>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-cancel" style="flex: 1; padding: 12px; background: #333; color: #888; border: none; border-radius: 12px; cursor: pointer;">CANCEL</button>
                    <button id="btn-confirm" style="flex: 1; padding: 12px; background: #00E5FF; color: black; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">CONFIRM</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('btn-confirm').onclick = () => { popup.remove(); resolve(true); };
        document.getElementById('btn-cancel').onclick = () => { popup.remove(); resolve(false); };
    });
};

// ==========================================
// === LOGIKA WATERFALL UTAMA ===
// ==========================================

const getSingleAd = async () => {
    console.log("🌊 Mencari Iklan Manual...");

    // 0. SIMULASI LOCALHOST
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log("🛠️ Dev Mode: Simulate Success");
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }

    // 1. ADSGRAM INTERSTITIAL (Video Pendek)
    if (checkCooldown('cd_adsgram_int') && window.Adsgram) {
        try {
            console.log("➡️ Coba: Adsgram Int");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('cd_adsgram_int');
            return true;
        } catch (e) { console.warn("Pass Adsgram Int"); }
    }

    // 2. ADSGRAM REWARD (Video Panjang)
    if (checkCooldown('cd_adsgram_rew') && window.Adsgram) {
        try {
            console.log("➡️ Coba: Adsgram Reward");
            const res = await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
            if (res.done) { 
                setCooldown('cd_adsgram_rew'); 
                return true; 
            }
        } catch (e) { console.warn("Pass Adsgram Rew"); }
    }

    // 3. MONETAG POPUP (SDK TWA)
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ Coba: Monetag Popup");
            const f = window[`show_${IDS.MONETAG_ZONE_TWA}`];
            if (typeof f === 'function') {
                f('pop'); 
                setCooldown('cd_monetag_pop');
                // Tunggu 2 detik untuk memastikan popup muncul sebelum memberi reward
                await new Promise(r => setTimeout(r, 2000));
                return true;
            }
        } catch (e) { console.warn("Pass Monetag Popup"); }
    }

    // 4. MONETAG INTERSTITIAL (SDK TWA)
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ Coba: Monetag Interstitial");
            const f = window[`show_${IDS.MONETAG_ZONE_TWA}`];
            if (typeof f === 'function') {
                await f();
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Pass Monetag Int"); }
    }

    // 5. ADSTERRA LINK (Browser)
    if (checkCooldown('cd_adsterra')) {
        console.log("➡️ Coba: Adsterra Link");
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(IDS.ADSTERRA_LINK);
            } else {
                window.open(IDS.ADSTERRA_LINK, '_blank');
            }

            hideLoadingOverlay(); 
            showLoadingOverlay("VERIFYING AD... 5s");
            
            await new Promise(r => setTimeout(r, 5000));
            setCooldown('cd_adsterra');
            return true; 
        } catch (e) { console.warn("Pass Adsterra"); }
    }

    // 6. MONETAG LINK (Browser - Cadangan Terakhir)
    if (checkCooldown('cd_monetag_link')) {
        console.log("➡️ Coba: Monetag Link");
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(IDS.MONETAG_LINK);
            } else {
                window.open(IDS.MONETAG_LINK, '_blank');
            }

            hideLoadingOverlay(); 
            showLoadingOverlay("CHECKING AD... 5s");
            
            await new Promise(r => setTimeout(r, 5000));
            setCooldown('cd_monetag_link');
            return true; 
        } catch (e) { console.warn("Pass Monetag Link"); }
    }

    console.error("❌ SEMUA IKLAN HABIS");
    await showRewardPopup("NO ADS", "Please try again later.", "fa-ban");
    return false;
};

// --- EKSEKUSI ---
export const showAdStack = async (count = 1) => {
    if (isAdProcessing) return false;
    isAdProcessing = true;
    showLoadingOverlay("LOADING AD...");

    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            } else { break; }
        }
    } catch (e) {
        console.error("Ad Stack Error:", e);
    } finally {
        hideLoadingOverlay();
        isAdProcessing = false;
    }
    return successCount === count;
};
