/**
 * AD MANAGER DENGAN VISUAL LOADING
 * Fitur:
 * 1. Otomatis memunculkan layar "MENCARI IKLAN..." saat dipanggil.
 * 2. Memblokir klik user agar tidak bisa klik sembarangan.
 * 3. Menghilangkan layar loading saat iklan muncul atau error.
 */

// --- KONFIGURASI ID ---
const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
    GIGAPUB_ID: 5436,             
    MONETAG_ZONE: 10457329,       
    RICHADS_PUB: "1000251",       
    RICHADS_APP: "5869"
};

const COOLDOWN_MS = 15 * 60 * 1000; 
const state = { adsgramInt: 0, adexium: 0, adextra: 0, adsgramRew: 0 };
const isReady = (lastTime) => (Date.now() - lastTime) > COOLDOWN_MS;

// --- VISUAL LOADING HELPER ---
const showLoadingOverlay = () => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.90); z-index: 9999999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #00E5FF; font-family: sans-serif;
        `;
        overlay.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;"><i class="fa-solid fa-satellite-dish fa-beat"></i></div>
            <div style="font-size: 1.2rem; font-weight: bold;">MENCARI IKLAN...</div>
            <div style="font-size: 0.8rem; color: #aaa; margin-top: 5px;">Mohon tunggu sebentar</div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
};

const hideLoadingOverlay = () => {
    const overlay = document.getElementById('ad-loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

// --- FUNGSI CARI 1 IKLAN ---
const getSingleAd = async () => {
    // 1. ADSGRAM INTERSTITIAL
    if (isReady(state.adsgramInt) && window.Adsgram) {
        try {
            const controller = window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false });
            await controller.show();
            state.adsgramInt = Date.now(); 
            return true;
        } catch(e) {}
    }

    // 2. ADEXIUM
    if (isReady(state.adexium) && window.AdexiumWidget) {
        try {
            const adexium = new window.AdexiumWidget({
                wid: IDS.ADEXIUM, adFormat: 'interstitial', isFullScreen: true, debug: false
            });
            const result = await new Promise((resolve) => {
                let responded = false;
                const finish = (val) => { if(!responded) { responded=true; resolve(val); } };
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

    // 3. ADEXTRA
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

    // 4. ADSGRAM REWARD
    if (isReady(state.adsgramRew) && window.Adsgram) {
        try {
            const controller = window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false });
            const res = await controller.show();
            if (res.done) { state.adsgramRew = Date.now(); return true; }
        } catch(e) {}
    }

    // 5. GIGAPUB
    if (window.showGiga) { try { await window.showGiga(); return true; } catch(e) {} }

    // 6. MONETAG
    const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
    if (typeof monetagFunc === 'function') { try { await monetagFunc(); return true; } catch(e) {} }

    return false; 
};

// --- FUNGSI UTAMA (SHOW STACK) ---
export const showAdStack = async (count = 1) => {
    // 1. TAMPILKAN LOADING
    showLoadingOverlay();
    
    let successCount = 0;
    
    try {
        for (let i = 0; i < count; i++) {
            // Sembunyikan loading SEJENAK agar iklan bisa render di atasnya (terutama Adsgram)
            const success = await getSingleAd();
            
            if (success) {
                successCount++;
                if (i < count - 1) {
                    // Jeda antar iklan, munculkan loading lagi
                    showLoadingOverlay();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        // 2. PASTIKAN LOADING HILANG SETELAH SELESAI
        hideLoadingOverlay();
    }

    return successCount > 0;
};
