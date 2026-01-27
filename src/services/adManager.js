/**
 * AD MANAGER - REWARD GUARANTEE VERSION
 * - Memperbaiki masalah "Spin Failed" atau "No Reward".
 * - Logic: Jika iklan Monetag muncul, anggap SUKSES (True),
 * meskipun loading lama atau user nontonnya lama.
 */

// 1. CONFIG ID
const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
    // Backup
    GIGAPUB_ID: 5436,             
    MONETAG_ZONE: 10457329,       
    RICHADS_PUB: "1000251",       
    RICHADS_APP: "5869"
};

const COOLDOWN_MS = 60 * 1000; 
const state = { adsgramInt: 0, adexium: 0, adextra: 0, adsgramRew: 0 };
const isReady = (lastTime) => (Date.now() - lastTime) > COOLDOWN_MS;

// --- HELPER: TIMEOUT ---
const withTimeout = (promise, ms = 8000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
    ]);
};

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

// --- B. VISUAL REWARD POPUP ---
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
            if (btn) {
                btn.onclick = () => {
                    popup.style.display = 'none';
                    resolve(true); 
                };
            }
        }, 50);
    });
};

// --- C. CONFIRM POPUP ---
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

// --- D. LOGIKA CARI IKLAN (MONETAG ONLY + AUTO SUCCESS) ---
const getSingleAd = async () => {
    console.log("Meminta Iklan... (Mode: Monetag Only)");

    // 4. MONETAG (Direct Call)
    const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
    
    if (typeof monetagFunc === 'function') { 
        try { 
            console.log("Menjalankan Monetag...");
            // Kita tunggu max 8 detik.
            await withTimeout(monetagFunc(), 8000); 
            
            // Jika selesai sebelum 8 detik (iklan diclose cepat), SUKSES.
            return true; 
        } catch(e) { 
            console.log("Monetag Status:", e.message); 
            // Apapun errornya (Timeout / Script Error), kita ANGGAP SUKSES.
            // Agar user yang sudah nonton iklan tetap dapat reward.
            return true; 
        } 
    } else {
        console.log("Script Monetag belum terload di window/index.html");
        // Jika script tidak ada, kita return false agar user tau ada masalah sistem
        return false;
    }
};

// --- E. FUNGSI UTAMA ---
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
                console.log("Gagal memuat iklan, menghentikan stack.");
                break; 
            }
        }
    } catch (e) {
        console.error("Ad Stack Error:", e);
    } finally {
        hideLoadingOverlay(); // Pastikan loading hilang!
    }
    
    return successCount > 0;
};