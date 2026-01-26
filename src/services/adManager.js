/**
 * REVISI AD MANAGER (STABILITY FIX)
 * 1. Adexium: HANYA Interstitial (No Push/Auto).
 * 2. Anti-Freeze: Jika iklan error/lama, otomatis dianggap gagal (skip) agar game tidak macet.
 * 3. Adsgram: Dipisah Interstitial & Reward.
 */

const IDS = {
    ADSGRAM_INT: "int-21085",     
    ADSGRAM_REWARD: "21143",      
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", 
    // ID Rusher
    GIGAPUB_ID: 5436,             
    MONETAG_ZONE: 10457329,       
    RICHADS_PUB: "1000251",       
    RICHADS_APP: "5869"
};

const COOLDOWN_MS = 15 * 60 * 1000; 
const state = { adsgramInt: 0, adexium: 0, adextra: 0, adsgramRew: 0 };
const isReady = (lastTime) => (Date.now() - lastTime) > COOLDOWN_MS;

// --- FUNGSI CARI 1 IKLAN ---
const getSingleAd = async () => {
    
    // 1. ADSGRAM INTERSTITIAL
    if (isReady(state.adsgramInt) && window.Adsgram) {
        try {
            const controller = window.Adsgram.init({ blockId: IDS.ADSGRAM_INT, debug: false });
            await controller.show();
            state.adsgramInt = Date.now(); 
            return true;
        } catch(e) { console.log("Skip Adsgram Int"); }
    }

    // 2. ADEXIUM (STRICT INTERSTITIAL)
    // Perbaikan: Cek widget ada dulu & pastikan config benar
    if (isReady(state.adexium) && window.AdexiumWidget) {
        try {
            const adexium = new window.AdexiumWidget({
                wid: IDS.ADEXIUM,
                adFormat: 'interstitial', // <--- WAJIB INTERSTITIAL
                isFullScreen: true,
                debug: false
            });
            
            // Promise wrapper agar game menunggu
            const result = await new Promise((resolve) => {
                let responded = false;
                
                // Handler Sukses
                const onSuccess = () => { if(!responded) { responded=true; resolve(true); } };
                // Handler Gagal/Tutup
                const onFail = () => { if(!responded) { responded=true; resolve(false); } };

                adexium.on('adPlaybackCompleted', onSuccess);
                adexium.on('adRedirected', onSuccess);
                adexium.on('adClosed', onFail); // Kalau diclose paksa dianggap fail (sesuai request)
                adexium.on('noAdFound', onFail);

                // Timeout 5 detik: Kalau adexium macet loading, anggap gagal biar game jalan terus
                setTimeout(() => { onFail(); }, 5000);

                adexium.requestAd('interstitial');
            });

            if (result) {
                state.adexium = Date.now();
                return true;
            }
        } catch(e) { console.log("Skip Adexium"); }
    }

    // 3. ADEXTRA (Banner Overlay)
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
            if (res.done) {
                state.adsgramRew = Date.now();
                return true;
            }
        } catch(e) { console.log("Skip Adsgram Rew"); }
    }

    // --- RUSHER (BACKUP) ---
    // Dipanggil kalau yang atas cooldown atau error
    
    // 5. GIGAPUB
    if (window.showGiga) {
        try { await window.showGiga(); return true; } catch(e) {}
    }

    // 6. MONETAG
    const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
    if (typeof monetagFunc === 'function') {
        try { await monetagFunc(); return true; } catch(e) {}
    }

    return false; // Gagal semua
};

// --- FUNGSI UTAMA ---
export const showAdStack = async (count = 1) => {
    let successCount = 0;
    
    for (let i = 0; i < count; i++) {
        const success = await getSingleAd();
        if (success) {
            successCount++;
            if (i < count - 1) await new Promise(r => setTimeout(r, 800));
        } else {
            // Jika 1 iklan gagal, jangan macet, coba lanjut loop berikutnya (opsional)
            // Atau break loop jika Bapak ingin strict.
            // Di sini kita lanjut agar user punya kesempatan dapat reward dari backup.
        }
    }

    // VALIDASI AKHIR: Minimal 1 iklan sukses
    return successCount > 0;
};
