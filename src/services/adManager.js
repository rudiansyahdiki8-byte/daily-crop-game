/**
 * AD MANAGER - FINAL INTEGRATION
 * Update:
 * 1. ADEXIUM: ID Baru (d458d704...)
 * 2. GIGAPUB: Menggunakan metode window.showGiga() (Promise Based).
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    
    // ✅ ID ADEXIUM BARU ANDA
    ADEXIUM: "d458d704-f8eb-420b-b4fe-b60432bc2b63", 
    
    MONETAG_ZONE: 10457329,
};

// ✅ CONFIG GIGAPUB BARU
const GIGAPUB_CONFIG = {
    // URL Script khusus akun Anda (ID 5436)
    SCRIPT_URL: "https://ad.gigapub.tech/script?id=5436"
};

// ATURAN COOLDOWN: 3 MENIT (Hanya untuk Tier 1-3)
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

// UI Loading Overlay
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

// --- LOGIKA WATERFALL ---
const getSingleAd = async () => {
    console.log("🌊 Memulai Waterfall Iklan...");

    // 1. ADSGRAM INTERSTITIAL (Cooldown 3m)
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
                        wid: IDS.ADEXIUM, // ID: d458d704...
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
    // Script ID: 5436
    try {
        console.log("➡️ Step 6: GigaPub (showGiga)");
        
        // A. Pastikan Script Terload Dulu (Lazy Load)
        if (!window.showGiga) {
            console.log("⏳ Loading Script GigaPub...");
            await new Promise((resolve, reject) => {
                // Cek kalau script tag sudah ada tapi belum load
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
