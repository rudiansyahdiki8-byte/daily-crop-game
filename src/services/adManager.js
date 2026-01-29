/**
 * AD MANAGER - FIXED & COMPLETE
 * * Update Terakhir:
 * 1. MENGEMBALIKAN: showRewardPopup & showConfirmPopup (Supaya Vercel tidak Error).
 * 2. UPDATE: Adexium ID Baru (d458d704...).
 * 3. UPDATE: GigaPub pakai window.showGiga().
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    
    // ✅ ID ADEXIUM BARU
    ADEXIUM: "d458d704-f8eb-420b-b4fe-b60432bc2b63", 
    
    MONETAG_ZONE: 10457329,
};

// ✅ CONFIG GIGAPUB (ID 5436)
const GIGAPUB_CONFIG = {
    SCRIPT_URL: "https://ad.gigapub.tech/script?id=5436"
};

// ATURAN COOLDOWN: 3 MENIT
const COOLDOWN_MS = 180 * 1000; 
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

// --- UI LOADING (Internal) ---
const showLoadingOverlay = () => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div style="margin-top: 15px; font-weight: bold;">MENCARI SPONSOR...</div><style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>`;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
};
const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// --- 🟢 FITUR YANG SEMPAT HILANG (INI PENTING UNTUK BUILD) ---

// 1. Popup Reward (UI Sukses)
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

// 2. Popup Konfirmasi (UI Tanya User)
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

// --- LOGIKA WATERFALL UTAMA ---
const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INT
    if (checkCooldown('last_adsgram_int') && window.Adsgram) {
        try {
            console.log("➡️ Step 1: Adsgram Int");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('last_adsgram_int');
            return true;
        } catch (e) { console.warn("⚠️ Step 1 Lewat:", e); }
    }

    // 2. ADEXIUM (ID BARU)
    if (checkCooldown('last_adexium')) {
        try {
            if (typeof window.AdexiumWidget !== 'undefined') {
                console.log("➡️ Step 2: Adexium");
                
                await new Promise((resolve, reject) => {
                    const adexium = new window.AdexiumWidget({
                        wid: IDS.ADEXIUM,
                        adFormat: 'interstitial',
                        isFullScreen: true, 
                        zIndex: 2147483647 
                    });

                    const onAdReceived = (ad) => {
                        console.log("✅ Adexium Received");
                        adexium.displayAd(ad);
                    };
                    const onNoAdFound = () => reject('No Fill');
                    const onFinish = () => {
                        try { adexium.destroy?.(); } catch(e){}
                        resolve();
                    };

                    adexium.on('adReceived', onAdReceived);
                    adexium.on('noAdFound', onNoAdFound);
                    adexium.on('adPlaybackCompleted', onFinish);
                    adexium.on('adClosed', onFinish);

                    adexium.requestAd('interstitial');
                    setTimeout(() => { 
                        try { adexium.destroy?.(); } catch(e){}
                        reject('Timeout'); 
                    }, 8000);
                });

                setCooldown('last_adexium');
                return true;
            }
        } catch (e) { console.warn("⚠️ Step 2 Error:", e); }
    }

    // 3. ADSGRAM REWARD
    if (checkCooldown('last_adsgram_rew') && window.Adsgram) {
        try {
            console.log("➡️ Step 3: Adsgram Reward");
            const res = await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
            if (res.done) { 
                setCooldown('last_adsgram_rew'); 
                return true; 
            }
        } catch (e) { }
    }

    // 4. MONETAG VIDEO
    try {
        const f = window[`show_${IDS.MONETAG_ZONE}`];
        if (typeof f === 'function') { await f(); return true; }
    } catch (e) { }

    // 5. MONETAG POPUP
    try {
        const f = window[`show_${IDS.MONETAG_ZONE}`];
        if (typeof f === 'function') { await f('pop'); return true; }
    } catch (e) { }

    // 6. GIGAPUB (METODE BARU: showGiga)
    try {
        console.log("➡️ Step 6: GigaPub (showGiga)");
        
        // A. Pastikan Script Terload Dulu (Lazy Load)
        if (!window.showGiga) {
            console.log("⏳ Loading Script GigaPub...");
            await new Promise((resolve, reject) => {
                if(document.getElementById('gigapub-lib')) { resolve(); return; }
                const script = document.createElement('script');
                script.id = 'gigapub-lib';
                script.src = GIGAPUB_CONFIG.SCRIPT_URL; // URL ID 5436
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // B. Panggil Fungsi showGiga()
        if (typeof window.showGiga === 'function') {
            await window.showGiga(); // Ini me-return Promise
            console.log("✅ GigaPub Success");
            return true;
        }
    } catch (e) { 
        console.warn("⚠️ Step 6 GigaPub Error:", e); 
    }

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
