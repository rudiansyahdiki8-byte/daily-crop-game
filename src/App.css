/**
 * AD MANAGER FINAL
 * - Menggabungkan Logic Iklan Real dengan Visual CSS Bapak.
 * - Otomatis munculkan Loading & Popup Reward.
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

const COOLDOWN_MS = 15 * 60 * 1000; 
const state = { adsgramInt: 0, adexium: 0, adextra: 0, adsgramRew: 0 };
const isReady = (lastTime) => (Date.now() - lastTime) > COOLDOWN_MS;

// --- A. VISUAL LOADING (MENCARI IKLAN...) ---
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
        // Menggunakan Class CSS Bapak (.ad-watching-container)
        overlay.innerHTML = `
            <div class="ad-watching-container">
                <div class="ad-timer-circle"></div>
                <div class="ad-text">MENCARI IKLAN...</div>
                <div style="font-size: 0.8rem; color: #aaa;">Mohon tunggu sebentar</div>
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

// --- B. VISUAL REWARD (POPUP KOTAK EMAS) ---
export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        let popup = document.getElementById('ad-reward-popup');
        // Buat elemen jika belum ada
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

        // Isi HTML sesuai CSS Bapak (.reward-container)
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

        // Event Klik Tombol Klaim
        // Kita beri delay sedikit agar elemen render dulu
        setTimeout(() => {
            const btn = document.getElementById('btn-claim-reward');
            if (btn) {
                btn.onclick = () => {
                    popup.style.display = 'none';
                    resolve(true); // Memberi tahu kode game untuk lanjut
                };
            }
        }, 50);
    });
};

// --- C. LOGIKA CARI IKLAN ---
const getSingleAd = async () => {
    // 1. Adsgram Interstitial
    if (isReady(state.adsgramInt) && window.Adsgram) {
        try {
            const controller = window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false });
            await controller.show();
            state.adsgramInt = Date.now(); return true;
        } catch(e) {}
    }
    // 2. Adexium
    if (isReady(state.adexium) && window.AdexiumWidget) {
        try {
            const adexium = new window.AdexiumWidget({
                wid: IDS.ADEXIUM, adFormat: 'interstitial', isFullScreen: true, debug: false
            });
            const result = await new Promise((resolve) => {
                let done = false;
                const finish = (val) => { if(!done) { done=true; resolve(val); } };
                adexium.on('adPlaybackCompleted', () => finish(true));
                adexium.on('adRedirected', () => finish(true));
                adexium.on('adClosed', () => finish(false));
                adexium.on('noAdFound', () => finish(false));
                setTimeout(() => finish(false), 5000); 
                adexium.requestAd('interstitial');
            });
            if (result) { state.adexium = Date.now(); return true; }
        } catch(e) {}
    }
    // 3. Adextra (Banner Overlay)
    if (isReady(state.adextra)) {
        const overlay = document.getElementById('adextra-overlay');
        const container = document.getElementById('25e584f1c176cb01a08f07b23eca5b3053fc55b8');
        if (overlay && container && container.innerHTML.length > 10) {
            overlay.style.display = 'flex';
            state.adextra = Date.now();
            return new Promise((resolve) => {
                const btn = document.getElementById('adextra-close-btn');
                const closeHandler = () => {
                    overlay.style.display = 'none';
                    btn.removeEventListener('click', closeHandler);
                    resolve(true);
                };
                btn.addEventListener('click', closeHandler);
            });
        }
    }
    // 4. Adsgram Reward
    if (isReady(state.adsgramRew) && window.Adsgram) {
        try {
            const controller = window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false });
            const res = await controller.show();
            if (res.done) { state.adsgramRew = Date.now(); return true; }
        } catch(e) {}
    }
    // 5. Backup (Giga/Monetag)
    if (window.showGiga) { try { await window.showGiga(); return true; } catch(e) {} }
    const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
    if (typeof monetagFunc === 'function') { try { await monetagFunc(); return true; } catch(e) {} }
    
    return false; 
};

// --- D. FUNGSI UTAMA (PANGGIL INI DARI GAME) ---
export const showAdStack = async (count = 1) => {
    showLoadingOverlay(); // Munculkan Visual Loading (CSS Bapak)
    
    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                if (i < count - 1) {
                    showLoadingOverlay(); // Pastikan loading muncul lagi antar iklan
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    } catch (e) {
        console.error("Ad Error:", e);
    } finally {
        hideLoadingOverlay(); // Sembunyikan Loading setelah selesai
    }
    
    return successCount > 0;
};
