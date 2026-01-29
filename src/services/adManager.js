/**
 * AD MANAGER - STRICT QUEUE EDITION
 * * Perbaikan Utama: 
 * 1. Mencegah Overlap: Iklan berikutnya HARAM muncul sebelum iklan sekarang ditutup.
 * 2. Hapus Service Worker: Pastikan sw.js dihapus dari folder public agar tidak auto-popup.
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    
    MONETAG_ZONE: 10457329, 
    GIGAPUB_LINK: "https://link.gigapub.tech/l/vi8999zpr",

    // SCRIPT URL (Disimpan dulu, jangan dipasang)
    SCRIPT_ADEXTRA: "https://partner.adextra.io/jt/25e584f1c176cb01a08f07b23eca5b3053fc55b8.js",
    SCRIPT_GIGAPUB: "//ad.gigapub.tech/script?id=5436"
};

const COOLDOWN_MS = 300 * 1000; // 5 Menit

let isAdProcessing = false; 

// --- HELPER: LAZY LOAD (Download Script Diam-diam) ---
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        // Cek kalau script sudah ada, jangan download lagi
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        console.log(`📥 Downloading script: ${src}...`);
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => { console.log(`✅ Script Ready: ${src}`); resolve(); };
        script.onerror = () => { console.error(`❌ Script Gagal: ${src}`); reject(); };
        document.head.appendChild(script);
    });
};

// --- HELPER LAINNYA ---
const checkCooldown = (key) => {
    try {
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0; 
    } catch (e) { return true; }
};
const setCooldown = (key) => {
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) {}
};
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
// === LOGIKA WATERFALL "SATU-SATU" ===
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

    // 3. ADEXTRA (Hanya download JIKA giliran tiba)
    if (checkCooldown('cd_adextra')) {
        try {
            console.log("➡️ [3] AdExtra");
            showLoadingOverlay("MEMUAT ADEXTRA...");
            
            // Download script baru di sini (agar tidak auto-show sebelumnya)
            await loadScript(IDS.SCRIPT_ADEXTRA);
            await new Promise(r => setTimeout(r, 1000)); // Beri waktu napas

            if (typeof window.p_adextra === 'function') {
                await new Promise((resolve, reject) => {
                     // Panggil Iklan
                     window.p_adextra(
                        () => { console.log("✅ AdExtra Done"); resolve(true); },
                        () => { reject("AdExtra Error"); }
                     );
                });
                setCooldown('cd_adextra');
                return true;
            }
        } catch (e) { console.warn("Skip AdExtra:", e); }
    }

    // 4. MONETAG POPUP (Promise Only - Tanpa Race)
    if (checkCooldown('cd_monetag_pop')) {
        try {
            console.log("➡️ [4] Monetag Popup");
            showLoadingOverlay("MEMUAT MONETAG...");
            
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                // KITA HANYA LANJUT SETELAH IKLAN DITUTUP
                // Tidak ada timeout, user wajib tutup iklan agar kode lanjut
                await f('pop'); 
                
                console.log("✅ Monetag Popup Ditutup");
                setCooldown('cd_monetag_pop');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Pop:", e); }
    }

    // 5. MONETAG INTERSTITIAL (Promise Only - Tanpa Race)
    if (checkCooldown('cd_monetag_int')) {
        try {
            console.log("➡️ [5] Monetag Interstitial");
            showLoadingOverlay("MEMUAT VIDEO MONETAG...");
            
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f === 'function') {
                // TUNGGU SAMPAI BENAR-BENAR SELESAI
                await f();
                
                console.log("✅ Monetag Interstitial Ditutup");
                setCooldown('cd_monetag_int');
                return true;
            }
        } catch (e) { console.warn("Skip Monetag Int:", e); }
    }

    // 6. GIGAPUB (Hanya download JIKA giliran tiba)
    if (checkCooldown('cd_gigapub_int')) {
        try {
            console.log("➡️ [6] GigaPub");
            showLoadingOverlay("MEMUAT GIGAPUB...");

            await loadScript(IDS.SCRIPT_GIGAPUB);
            await new Promise(r => setTimeout(r, 1000));

            if (typeof window.showGiga === 'function') {
                await window.showGiga(); // Tunggu sampai selesai
                setCooldown('cd_gigapub_int');
                return true;
            }
        } catch (e) { console.warn("Skip GigaPub:", e); }
    }

    // 7. GIGAPUB SMARTLINK
    if (checkCooldown('cd_gigapub_link') && IDS.GIGAPUB_LINK) {
        console.log("➡️ [7] GigaPub Link");
        try {
            if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(IDS.GIGAPUB_LINK);
            else window.open(IDS.GIGAPUB_LINK, '_blank');
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
    
    // Jangan tampilkan overlay di awal, biar overlay per-iklan yang muncul
    // showLoadingOverlay(); 

    let successCount = 0;
    try {
        for (let i = 0; i < count; i++) {
            const success = await getSingleAd();
            if (success) {
                successCount++;
                hideLoadingOverlay(); // Sembunyikan loading pas iklan sukses
                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 2000)); // Jeda 2 detik
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
