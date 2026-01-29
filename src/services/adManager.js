/**
 * AD MANAGER - ROTATION SYSTEM (SISTEM GILIRAN)
 * * Masalah Lama: Adsgram memakan semua trafik prioritas.
 * * Solusi Baru: Iklan dipanggil bergiliran (1 -> 2 -> 3 -> 4 -> ... -> 1).
 * * Efek: 10 Tombol Task akan terbagi rata ke semua network.
 * * Logic Timer: Tetap pakai Timer 15s (kecuali RichAds).
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",
    MONETAG_ZONE: 10457329,
    
    ADSTERRA_LINK: "https://www.effectivegatecpm.com/gh7bask9y9?key=5a6453e5db9f6bf7c1f28291dddf9826", 
    GIGAPUB_LINK: "https://link.gigapub.tech/l/vi8999zpr",

    RICHADS: { PUB_ID: "1000630", APP_ID: "5929" }
};

// COOLDOWN PER SLOT (Biarkan 3 Menit/180 Detik)
// Karena kita punya banyak slot, user tidak akan kehabisan iklan meski di-spam.
const COOLDOWN_MS = 180 * 1000; 
const WATCH_TIMEOUT = 60000;    

let isAdProcessing = false; 

// --- TIMERS & HELPERS ---
const runCountdown = (seconds) => {
    return new Promise(resolve => {
        let counter = seconds;
        const msgEl = document.getElementById('ad-msg');
        if(msgEl) msgEl.innerText = `PLEASE WAIT ${counter}s...`;
        const interval = setInterval(() => {
            counter--;
            if (counter > 0) { if(msgEl) msgEl.innerText = `PLEASE WAIT ${counter}s...`; } 
            else { clearInterval(interval); if(msgEl) msgEl.innerText = "COMPLETED!"; resolve(); }
        }, 1000);
    });
};

const openLink = async (url) => {
    try {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(url, {try_instant_view: false});
        else window.open(url, '_blank');
    } catch(e) {}
};

const checkCooldown = (key) => {
    try {
        const lastTime = parseInt(localStorage.getItem('cd_' + key) || '0');
        return (COOLDOWN_MS - (Date.now() - lastTime)) <= 0; 
    } catch (e) { return true; }
};

const setCooldown = (key) => {
    try { localStorage.setItem('cd_' + key, Date.now().toString()); } catch (e) {}
};

// --- UI OVERLAY ---
const showLoadingOverlay = (msg) => {
    let overlay = document.getElementById('ad-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ad-loading-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;`;
        overlay.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00E5FF; border-radius: 50%; animation: spin 1s linear infinite;"></div><div id="ad-msg" style="margin-top: 15px; font-weight: bold; font-size: 1.2rem;">${msg}</div>`;
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

// --- DEFINISI SLOT IKLAN (ARRAY) ---
// Kita buat daftar fungsi agar bisa diputar (rotasi)
const AD_SLOTS = [
    {
        id: 'adsgram_int',
        name: 'LOADING ADSGRAM...',
        run: async () => {
            if (!window.Adsgram) throw "No SDK";
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false }).show();
        }
    },
    {
        id: 'adsterra_1',
        name: 'OPENING SPONSOR...',
        run: async () => {
            openLink(IDS.ADSTERRA_LINK);
            await runCountdown(15);
        }
    },
    {
        id: 'monetag_pop',
        name: 'LOADING MONETAG...',
        run: async () => {
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f !== 'function') throw "No SDK";
            const adPromise = f('pop').catch(() => null); 
            const timerPromise = runCountdown(15); 
            await Promise.all([adPromise, timerPromise]);
        }
    },
    {
        id: 'richads',
        name: 'LOADING RICHADS...',
        run: async () => {
            if (typeof window.TelegramAdsController === 'undefined') throw "No SDK";
            window.TelegramAdsController = new TelegramAdsController();
            window.TelegramAdsController.initialize({ pubId: IDS.RICHADS.PUB_ID, appId: IDS.RICHADS.APP_ID });
            // RichAds: Delay 10s tanpa timer visual
            await new Promise(r => setTimeout(r, 10000));
        }
    },
    {
        id: 'monetag_int',
        name: 'LOADING VIDEO...',
        run: async () => {
            const f = window[`show_${IDS.MONETAG_ZONE}`];
            if (typeof f !== 'function') throw "No SDK";
            const adPromise = f().catch(() => null);
            const timerPromise = runCountdown(15);
            await Promise.all([adPromise, timerPromise]);
        }
    },
    {
        id: 'gigapub',
        name: 'OPENING SPONSOR...',
        run: async () => {
            openLink(IDS.GIGAPUB_LINK);
            await runCountdown(15);
        }
    },
    {
        id: 'adsgram_rew',
        name: 'LOADING REWARD...',
        run: async () => {
            if (!window.Adsgram) throw "No SDK";
            await window.Adsgram.init({ blockId: IDS.ADSGRAM_REWARD, debug: false }).show();
        }
    },
    {
        id: 'adsterra_2',
        name: 'OPENING SPONSOR...',
        run: async () => {
            openLink(IDS.ADSTERRA_LINK);
            await runCountdown(15);
        }
    }
];

// --- CORE: ROTATION LOGIC ---
const getSingleAd = async () => {
    // 1. Ambil index terakhir dari LocalStorage (Biar rotasi lanjut terus meski refresh)
    let lastIndex = parseInt(localStorage.getItem('last_ad_index') || '-1');
    
    // 2. Tentukan mulai dari mana (Index + 1)
    let startIndex = (lastIndex + 1) % AD_SLOTS.length;
    
    console.log(`🎡 Rotation Start: Index ${startIndex}`);

    // 3. Loop memutar (Mencari slot yang READY dan TIDAK COOLDOWN)
    // Kita loop sebanyak jumlah slot agar semua dicek
    for (let i = 0; i < AD_SLOTS.length; i++) {
        // Hitung index saat ini (pakai modulo biar muter balik ke 0)
        let currentIndex = (startIndex + i) % AD_SLOTS.length;
        let slot = AD_SLOTS[currentIndex];

        if (checkCooldown(slot.id)) {
            try {
                console.log(`➡️ Trying Slot [${currentIndex}]: ${slot.id}`);
                showLoadingOverlay(slot.name);
                
                // JALANKAN IKLANNYA
                await slot.run();

                // SUKSES!
                // a. Set Cooldown slot ini
                setCooldown(slot.id);
                // b. Simpan index ini sebagai "Terakhir Dipakai"
                localStorage.setItem('last_ad_index', currentIndex.toString());
                
                return true;

            } catch (e) {
                console.warn(`⚠️ Slot ${slot.id} Failed/Skipped:`, e);
                // Kalau error (misal Adsgram habis), Lanjut ke loop berikutnya (i++)
                // Jangan simpan index, biar next time dicoba lagi atau dilewati
            }
        } else {
            console.log(`⏳ Slot ${slot.id} is Cooldown`);
        }
    }

    // 4. Kalau semua slot habis/cooldown, pakai SAFETY NET (Adsterra Paksa)
    console.log("🔥 All Slots Cooldown/Error -> Force Backup");
    if (checkCooldown('backup_final')) {
        showLoadingOverlay("OPENING SPONSOR...");
        openLink(IDS.ADSTERRA_LINK);
        await runCountdown(15);
        setCooldown('backup_final');
        return true;
    }

    console.error("❌ ABSOLUTELY NO ADS AVAILABLE");
    return false;
};

// --- MAIN EXPORT ---
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
                if (i < count - 1) await new Promise(r => setTimeout(r, 2000));
            } else { break; }
        }
    } catch (e) { console.error("Ad Stack Error:", e); } 
    finally {
        hideLoadingOverlay();
        isAdProcessing = false;
        console.log("✅ Ad Cycle Complete.");
    }
    return successCount > 0;
};

// --- UI POPUP EXPORT (Sama seperti sebelumnya) ---
export const showRewardPopup = (title, message, iconClass = 'fa-coins') => {
    return new Promise((resolve) => {
        const oldPopup = document.getElementById('ad-reward-popup');
        if (oldPopup) oldPopup.remove();
        const popup = document.createElement('div');
        popup.id = 'ad-reward-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);`;
        popup.innerHTML = `
            <div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div>
                <i class="fa-solid ${iconClass} fa-3x" style="color: #FFD700; margin-bottom: 15px;"></i>
                <div style="margin-bottom: 20px;">${message}</div>
                <button id="btn-claim-final" style="background: #00E5FF; color: black; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 1rem;">CLAIM REWARD</button>
            </div>`;
        document.body.appendChild(popup);
        const btn = document.getElementById('btn-claim-final');
        if(btn) { btn.onclick = () => { popup.remove(); resolve(true); }; } 
        else { popup.onclick = () => { popup.remove(); resolve(true); }; }
    });
};

export const showConfirmPopup = (title, message, iconClass = 'fa-question-circle') => {
    return new Promise((resolve) => {
        const old = document.getElementById('ad-confirm-popup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'ad-confirm-popup';
        popup.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2147483647 !important; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);`;
        popup.innerHTML = `
            <div class="reward-container" style="background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center; color: white; min-width: 280px;">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; color: #00E5FF;">${title}</div>
                <i class="fa-solid ${iconClass} fa-3x" style="color: #00E5FF; margin-bottom: 15px;"></i>
                <p style="color: #E0E0E0; margin: 15px 0; font-size: 1rem; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center; width: 100%;">
                    <button id="btn-cancel" style="padding: 10px 20px; background: #333; color: #ccc; border: 1px solid #555; border-radius: 20px; cursor: pointer;">CANCEL</button>
                    <button id="btn-confirm" style="padding: 10px 30px; background: linear-gradient(90deg, #00E5FF, #2979FF); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold;">CONFIRM</button>
                </div>
            </div>`;
        document.body.appendChild(popup);
        document.getElementById('btn-confirm').onclick = () => { popup.remove(); resolve(true); };
        document.getElementById('btn-cancel').onclick = () => { popup.remove(); resolve(false); };
    });
};

window.resetAds = () => { isAdProcessing = false; hideLoadingOverlay(); console.log("Ads Reset!"); };
