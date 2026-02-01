/**
 * AD MANAGER - ROLLING SYSTEM (ROUND ROBIN)
 * Total 7 Langkah Rotasi.
 * Tujuan: Membagi traffic secara merata agar CPM terjaga & Anti-Spam.
 * * URUTAN ROTASI:
 * 1. Adsgram Int
 * 2. Adsterra Link (High Priority)
 * 3. Monetag Popup
 * 4. Adsgram Reward
 * 5. Monetag Inters
 * 6. Monetag Link
 * 7. Adsterra Link (High Priority)
 * -> Balik ke 1
 */

const IDS = {
    // ADSGRAM
    ADSGRAM_INT: "int-21085",
    ADSGRAM_REWARD: "21143",

    // MONETAG SDK
    MONETAG_ZONE_TWA: 10457329,

    // DIRECT LINKS
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826",
    MONETAG_LINK: "https://otieu.com/4/10535147",
};

// Urutan Rotasi (7 Slot)
const AD_ROTATION = [
    'ADSGRAM_INT',   // Slot 0 (Langkah 1)
    'ADSTERRA_LINK', // Slot 1 (Langkah 2)
    'MONETAG_POP',   // Slot 2 (Langkah 3)
    'ADSGRAM_REW',   // Slot 3 (Langkah 4)
    'MONETAG_INT',   // Slot 4 (Langkah 5)
    'MONETAG_LINK',  // Slot 5 (Langkah 6)
    'ADSTERRA_LINK'  // Slot 6 (Langkah 7 - Double Cuan)
];

// Cooldown per jaringan (tetap ada untuk keamanan ganda)
const COOLDOWN_MS = 60 * 1000; // 1 Menit cukup karena sudah di-rolling

let isAdProcessing = false;

// --- HELPER STORAGE ---
// Menyimpan posisi terakhir (0-6) agar saat refresh tetap lanjut, bukan ulang dari 1
const getRotationIndex = () => {
    try { return parseInt(localStorage.getItem('ad_rotation_idx') || '0'); }
    catch (e) { return 0; }
};
const setRotationIndex = (idx) => {
    try { localStorage.setItem('ad_rotation_idx', idx.toString()); } catch (e) { }
};

// --- HELPER COOLDOWN ---
const checkCooldown = (key) => {
    try {
        if (!window.Telegram?.WebApp?.initDataUnsafe?.user) return true; // Dev Mode
        const lastTime = parseInt(localStorage.getItem(key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0;
    } catch (e) { return true; }
};
const setCooldown = (key) => {
    try { localStorage.setItem(key, Date.now().toString()); } catch (e) { }
};

// --- UI HELPERS ---
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

// --- POPUP UI ---
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
            </div>`;
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
            </div>`;
        document.body.appendChild(popup);
        document.getElementById('btn-confirm').onclick = () => { popup.remove(); resolve(true); };
        document.getElementById('btn-cancel').onclick = () => { popup.remove(); resolve(false); };
    });
};

// ==========================================
// 🔄 LOGIKA EKSEKUSI IKLAN (PER TYPE)
// ==========================================

const executeAdType = async (type) => {

    // 1. ADSGRAM INT
    if (type === 'ADSGRAM_INT') {
        if (!window.Adsgram || !checkCooldown('cd_adsgram_int')) return false;
        try {
            if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Adsgram Int");
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
            setCooldown('cd_adsgram_int');
            return true;
        } catch (e) { return false; }
    }

    // 2. ADSGRAM REWARD
    if (type === 'ADSGRAM_REW') {
        if (!window.Adsgram || !checkCooldown('cd_adsgram_rew')) return false;
        try {
            if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Adsgram Reward");
            const res = await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
            if (res.done) { setCooldown('cd_adsgram_rew'); return true; }
            return false;
        } catch (e) { return false; }
    }

    // 3. MONETAG POPUP (SDK)
    if (type === 'MONETAG_POP') {
        if (!checkCooldown('cd_monetag_pop')) return false;
        try {
            if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Monetag Popup");
            const f = window[`show_${IDS.MONETAG_ZONE_TWA}`];
            if (typeof f === 'function') {
                f('pop');
                setCooldown('cd_monetag_pop');
                await new Promise(r => setTimeout(r, 2000));
                return true;
            }
            return false;
        } catch (e) { return false; }
    }

    // 4. MONETAG INTERSTITIAL (SDK)
    if (type === 'MONETAG_INT') {
        if (!checkCooldown('cd_monetag_int')) return false;
        try {
            if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Monetag Interstitial");
            const f = window[`show_${IDS.MONETAG_ZONE_TWA}`];
            if (typeof f === 'function') {
                await f();
                setCooldown('cd_monetag_int');
                return true;
            }
            return false;
        } catch (e) { return false; }
    }

    // 5. ADSTERRA LINK (Browser)
    if (type === 'ADSTERRA_LINK') {
        if (!checkCooldown('cd_adsterra')) return false;
        if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Adsterra Link");
        try {
            if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(IDS.ADSTERRA_LINK);
            else window.open(IDS.ADSTERRA_LINK, '_blank');

            hideLoadingOverlay(); showLoadingOverlay("VERIFYING AD... 5s");
            await new Promise(r => setTimeout(r, 5000));
            setCooldown('cd_adsterra');
            return true;
        } catch (e) { return false; }
    }

    // 6. MONETAG LINK (Browser)
    if (type === 'MONETAG_LINK') {
        if (!checkCooldown('cd_monetag_link')) return false;
        if (process.env.NODE_ENV === 'development') console.log("🔄 Rolling: Monetag Link");
        try {
            if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(IDS.MONETAG_LINK);
            else window.open(IDS.MONETAG_LINK, '_blank');

            hideLoadingOverlay(); showLoadingOverlay("CHECKING AD... 5s");
            await new Promise(r => setTimeout(r, 5000));
            setCooldown('cd_monetag_link');
            return true;
        } catch (e) { return false; }
    }

    return false;
};

// ==========================================
// 🚀 EKSEKUSI UTAMA (ROLLING LOGIC)
// ==========================================

export const showAdStack = async (count = 1) => {
    if (isAdProcessing) return false;
    isAdProcessing = true;
    showLoadingOverlay("LOADING AD...");

    // 0. SIMULASI DEV MODE
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
        if (process.env.NODE_ENV === 'development') console.log("🛠️ Dev Mode: Simulate Success");
        await new Promise(r => setTimeout(r, 2000));
        hideLoadingOverlay();
        isAdProcessing = false;
        return true;
    }

    let successCount = 0;

    // Ambil Index Terakhir (Mulai dari mana?)
    let currentIndex = getRotationIndex();

    try {
        for (let i = 0; i < count; i++) {

            // Loop Mencari Iklan yang Available (Max 7 kali percobaan geser)
            // Agar kalau Slot 1 error/cooldown, langsung coba Slot 2, dst.
            let adFound = false;

            for (let attempt = 0; attempt < AD_ROTATION.length; attempt++) {
                // Hitung Pointer Rotasi
                const pointer = (currentIndex + attempt) % AD_ROTATION.length;
                const adType = AD_ROTATION[pointer];

                // Coba Tampilkan
                const success = await executeAdType(adType);

                if (success) {
                    adFound = true;
                    // SIMPAN Index Berikutnya untuk user ini nanti
                    // Agar klik berikutnya lanjut ke iklan selanjutnya
                    setRotationIndex((pointer + 1) % AD_ROTATION.length);
                    // Update current index lokal agar loop count berikutnya (jika count > 1) benar
                    currentIndex = (pointer + 1) % AD_ROTATION.length;
                    break; // Keluar dari loop attempt, iklan berhasil
                }
            }

            if (adFound) {
                successCount++;
                if (i < count - 1) await new Promise(r => setTimeout(r, 1500));
            } else {
                // Jika sudah putar 7 kali tapi gagal semua (Cooldown semua)
                console.error("❌ ALL ADS COOLDOWN/ERROR");
                break;
            }
        }
    } catch (e) { console.error("Ad Stack Error:", e); }
    finally {
        hideLoadingOverlay();
        isAdProcessing = false;
    }

    // Jika semua gagal, tampilkan pesan
    if (successCount === 0) {
        await showRewardPopup("NO ADS", "Please try again later.", "fa-ban");
    }

    return successCount === count;
};
