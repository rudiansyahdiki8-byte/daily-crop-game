/**
 * AD MANAGER - FINAL STRATEGY (ADSTERRA LINK INTEGRATED)
 * * Link Adsterra: https://www.effectivegatecpm.com/...
 * * Urutan Waterfall:
 * 1. Adsgram Int
 * 2. Adsgram Rew
 * 3. Adsterra Link (Slot 3)
 * 4. Monetag Popup
 * 5. Monetag Inters
 * 6. Adsterra Link (Slot 6)
 * 7. GigaPub Link
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    MONETAG_ZONE: 10457329, 
    
    // ✅ LINK ADSTERRA ANDA (SUDAH TERPASANG)
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826", 

    // GigaPub Smartlink (Cadangan Terakhir)
    GIGAPUB_LINK: "https://link.gigapub.tech/l/vi8999zpr"
};

const COOLDOWN_MS = 300 * 1000; // 5 Menit (Jeda antar iklan yang sama)
const WATCH_TIMEOUT = 60000;    // 1 Menit (Batas waktu nonton Monetag)

let isAdProcessing = false; 

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

// UI Overlay (Loading Hitam)
const showLoadingOverlay = (msg = "MENCARI IKLAN...") => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div id="ad-msg" style="margin-top: 15px; font-weight: bold;">${msg}</div><style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>`;
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

// --- UI POPUP SYSTEM ---
export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        let popup = document.getElementById('ad-reward-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'ad-reward-popup';
            popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);`;
            document.body.appendChild(popup);
        }
        popup.innerHTML = `<div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;"><div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div><i class="fa-solid ${iconClass} fa-3x" style="color: #FFD700; margin-bottom: 15px;"></i><div style="margin-bottom: 20px;">${message}</div><button id="btn-claim-reward" style="background: #00E5FF; color: black; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer;">KLAIM</button></div>`;
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
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2147483647 !important; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);`;
        popup.innerHTML = `<div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;"><div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div><i class="fa-solid ${iconClass} fa-3x" style="color: #00E5FF; margin-bottom: 15px;"></i><p style="color: #E0E0E0; margin: 15px 0; font-size: 1rem; white-space: pre-line;">${message}</p><div style="display: flex; gap: 15px; justify-content: center; width: 100%;"><button id="btn-cancel" style="padding: 10px 20px; background: #333; color: #ccc; border: 1px solid #555; border-radius: 20px; cursor: pointer;">CANCEL</button><button id="btn-confirm" style="padding: 10px 30px; background: linear-gradient(90deg, #00E5FF, #2979FF); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold;">CONFIRM</button></div></div>`;
        document.body.appendChild(popup);
        setTimeout(() => {
            const btnYes = document.getElementById('btn-confirm');
            const btnNo = document.getElementById('btn-cancel');
            if (btnYes) btnYes.onclick = () => { popup.remove(); resolve(true); };
            if (btnNo) btnNo.onclick = () => { popup.remove(); resolve(false); };
        }, 50);
    });
};

// ==========================================
// === LOGIKA WATERFALL (FINAL MIX) ===
// ==========================================

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
            if (res.done) { 
                setCooldown('cd_adsgram_rew'); 
                return true; 
            }
        } catch (e) { console.warn("Skip Adsgram Rew"); }
    }

    // 3. ADSTERRA SMARTLINK (Pengganti AdExtra)
    if (checkCooldown('cd_adsterra_1') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [3] Adsterra Smartlink (1)");
        showLoadingOverlay("MEMBUKA SITUS SPONSOR...");
        
        try {
            if (window.Telegram?.WebApp) {
                // try_instant_view: false agar membuka browser eksternal (lebih aman untuk Direct Link)
                window.Telegram.WebApp.openLink(IDS.ADSTERRA_LINK, {try_instant_view: false});
            } else {
                window.open(IDS.ADSTERRA_LINK, '_blank');
            }
        } catch(e) {}

        // Simulasi waktu tunggu 2 detik (agar user melihat loading overlay sebentar)
        await new Promise(r => setTimeout(r, 2000));
        
        setCooldown('cd_adsterra_1');
        return true;
    }

    // 4. MONETAG POPUP
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ [4] Monetag Popup");
            showLoadingOverlay("MEMUAT MONETAG...");
            
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                await Promise.race([
                    f('pop').then(() => { console.log("✅ Monetag Popup Selesai"); return true; }),
                    new Promise((_, reject) => setTimeout(() => reject("Timeout"), WATCH_TIMEOUT))
                ]);
                setCooldown('cd_monetag_pop');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Pop:", e); }
    }

    // 5. MONETAG INTERSTITIAL
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ [5] Monetag Interstitial");
            showLoadingOverlay("MEMUAT VIDEO MONETAG...");
            
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                await Promise.race([
                    f().then(() => { console.log("✅ Monetag Inters Selesai"); return true; }),
                    new Promise((_, reject) => setTimeout(() => reject("Timeout"), WATCH_TIMEOUT))
                ]);
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Int:", e); }
    }

    // 6. ADSTERRA SMARTLINK (Pengganti GigaPub Video)
    if (checkCooldown('cd_adsterra_2') && IDS.ADSTERRA_LINK) {
        console.log("➡️ [6] Adsterra Smartlink (2)");
        showLoadingOverlay("MEMBUKA SITUS SPONSOR...");
        
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(IDS.ADSTERRA_LINK, {try_instant_view: false});
            } else {
                window.open(IDS.ADSTERRA_LINK, '_blank');
            }
        } catch(e) {}

        await new Promise(r => setTimeout(r, 2000));
        setCooldown('cd_adsterra_2');
        return true;
    }

    // 7. GIGAPUB SMARTLINK (Cadangan Terakhir)
    if (checkCooldown('cd_gigapub_link') && IDS.GIGAPUB_LINK) {
        console.log("➡️ [7] GigaPub Link");
        try {
            const url = IDS.GIGAPUB_LINK;
            if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(url);
            else window.open(url, '_blank');
        } catch(e) {}
        
        await new Promise(r => setTimeout(r, 1500));
        setCooldown('cd_gigapub_link');
        return true;
    }

    console.error("❌ SEMUA IKLAN HABIS / COOLDOWN");
    return false;
};

// --- EKSEKUSI ---
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
                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 2000)); 
                }
            } else {
                break; 
            }
        }
    } catch (e) {
        console.error("Ad Stack Error:", e);
    } finally {
        hideLoadingOverlay();
        isAdProcessing = false;
        console.log("✅ Proses Selesai.");
    }
    return successCount > 0;
};
