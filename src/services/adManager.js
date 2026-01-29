/**
 * AD MANAGER - 7 TYPES MANUAL CONTROL
 * Cooldown: 5 Menit
 * * DAFTAR 7 TIPE IKLAN:
 * 1. Adsgram Interstitial
 * 2. Adsgram Reward
 * 3. AdExtra Interstitial (Full Screen)
 * 4. Monetag Popup (Manual TWA)
 * 5. Monetag Interstitial (Manual TWA)
 * 6. GigaPub Interstitial
 * 7. GigaPub Smartlink
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    // ID Monetag TWA
    MONETAG_ZONE: 10457329, 

    // GigaPub Smartlink
    GIGAPUB_LINK: "https://link.gigapub.tech/l/vi8999zpr"
};

// COOLDOWN 5 MENIT (300 Detik)
const COOLDOWN_MS = 300 * 1000; 

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

// UI Loading (Overlay Hitam)
const showLoadingOverlay = () => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div style="margin-top: 15px; font-weight: bold;">MENCARI IKLAN...</div><style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>`;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
};
const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// ==========================================
// === SISTEM UI POPUP (JANGAN DIHAPUS) ===
// ==========================================

// 1. Popup Reward (Tampilan Hadiah)
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

// 2. Popup Confirm (Konfirmasi Nonton Iklan)
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
// === LOGIKA WATERFALL (7 TIPE MANUAL) ===
// ==========================================

const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INTERSTITIAL (Manual)
    if (checkCooldown('cd_adsgram_int') && window.Adsgram) {
        try {
            console.log("➡️ Coba: Adsgram Int");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('cd_adsgram_int');
            return true;
        } catch (e) { console.warn("Pass Adsgram Int"); }
    }

    // 2. ADSGRAM REWARD (Manual)
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

    // 3. ADEXTRA INTERSTITIAL (Manual)
    [cite_start]// Sesuai PDF: Panggil p_adextra [cite: 88]
    if (checkCooldown('cd_adextra')) {
        try {
            console.log("➡️ Coba: AdExtra");
            if (typeof window.p_adextra === 'function') {
                await new Promise((resolve, reject) => {
                    const onSuccess = () => { console.log("AdExtra Success"); resolve(true); };
                    const onError = () => { reject("AdExtra Error"); };
                    window.p_adextra(onSuccess, onError);
                });
                setCooldown('cd_adextra');
                return true;
            }
        } catch (e) { console.warn("Pass AdExtra"); }
    }

    // 4. MONETAG POPUP (Manual TWA)
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ Coba: Monetag Popup");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                f('pop'); 
                setCooldown('cd_monetag_pop');
                await new Promise(r => setTimeout(r, 1500)); // Jeda biar popup muncul
                return true;
            }
        } catch (e) { console.warn("Pass Monetag Pop"); }
    }

    // 5. MONETAG INTERSTITIAL (Manual TWA)
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ Coba: Monetag Interstitial");
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                await f();
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Pass Monetag Int"); }
    }

    // 6. GIGAPUB INTERSTITIAL (Manual)
    if (checkCooldown('cd_gigapub_int')) {
        try {
            console.log("➡️ Coba: GigaPub Int");
            if (typeof window.showGiga === 'function') {
                // Timeout 5 detik agar tidak macet
                await Promise.race([
                    window.showGiga(),
                    new Promise(r => setTimeout(r, 5000))
                ]);
                setCooldown('cd_gigapub_int');
                return true;
            }
        } catch (e) { console.warn("Pass GigaPub Int"); }
    }

    // 7. GIGAPUB SMARTLINK (Manual - Last Resort)
    if (checkCooldown('cd_gigapub_link') && IDS.GIGAPUB_LINK) {
        console.log("➡️ Coba: GigaPub Link");
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(IDS.GIGAPUB_LINK);
            } else {
                window.open(IDS.GIGAPUB_LINK, '_blank');
            }
        } catch(e) {}

        await new Promise(r => setTimeout(r, 1000));
        setCooldown('cd_gigapub_link');
        return true;
    }

    console.error("❌ SEMUA IKLAN HABIS / COOLDOWN");
    return false;
};

// --- EKSEKUSI UTAMA ---
export const showAdStack = async (count = 1) => {
    if (isAdProcessing) return false;
    isAdProcessing = true;
    showLoadingOverlay();

    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            } else {
                // Jika satu gagal di tengah jalan, stop loop
                break; 
            }
        }
    } catch (e) {
        console.error("Ad Stack Error:", e);
    } finally {
        hideLoadingOverlay();
        isAdProcessing = false;
    }
    return successCount > 0;
};
