/**
 * FINAL AD MANAGER (PRODUCTION READY)
 * * Fitur Utama:
 * 1. Native Timer Only: Tidak ada timer manual. Mengandalkan timer dari Ads Network.
 * 2. Strict Separation: Adsgram Inters & Reward dipisah agar tidak bentrok.
 * 3. Native Validation: Mengecek status 'done' (Adsgram) dan 'completed' (Adexium).
 * 4. Waterfall & Cooldown: Sistem prioritas dengan jeda 15 menit untuk iklan mahal.
 * 5. Flexible Stacking: Bisa memanggil 1, 2, atau 3 iklan beruntun.
 */

// --- 1. KONFIGURASI ID (Pastikan ID ini benar sesuai catatan) ---
const IDS = {
    // --- GRUP ELITE (Cooldown 15 Menit) ---
    //
    ADSGRAM_INT: "int-21085",     // Khusus Interstitial
    ADSGRAM_REWARD: "21143",      // Khusus Reward Video
    
    ADEXIUM: "33e68c72-2781-4120-a64d-3db4fb973c2d", //
    // Adextra menggunakan ID Div di index.html (25e584f1c176cb01a08f07b23eca5b3053fc55b8)

    // --- GRUP RUSHER (Tanpa Cooldown / Spam Friendly) ---
    GIGAPUB_ID: 5436,             //
    MONETAG_ZONE: 10457329,       //
    RICHADS_PUB: "1000251",       //
    RICHADS_APP: "5869"
};

// --- 2. STATE COOLDOWN ---
const COOLDOWN_MS = 15 * 60 * 1000; // 15 Menit
const state = {
    adsgramInt: 0,
    adexium: 0,
    adextra: 0,
    adsgramRew: 0
};

// Helper: Cek apakah iklan boleh muncul (sudah lewat 15 menit?)
const isReady = (lastTime) => (Date.now() - lastTime) > COOLDOWN_MS;


// --- 3. FUNGSI PENCARI IKLAN (SINGLE) ---
const getSingleAd = async () => {
    
    // === PRIORITAS 1: ADSGRAM INTERSTITIAL (ID: int-21085) ===
    if (isReady(state.adsgramInt) && window.Adsgram) {
        try {
            console.log("🔹 [1] Memanggil Adsgram Interstitial...");
            const controller = window.Adsgram.init({ 
                blockId: IDS.ADSGRAM_INT, 
                debug: false // <--- WAJIB FALSE: PRODUCTION MODE
            });
            await controller.show();
            // Adsgram Interstitial jarang return 'done', kita anggap sukses jika tampil
            state.adsgramInt = Date.now(); 
            return true;
        } catch(e) { console.warn("Pass 1 (Adsgram Int):", e); }
    }

    // === PRIORITAS 2: ADEXIUM (Strict Native Check) ===
    if (isReady(state.adexium) && window.AdexiumWidget) {
        try {
            console.log("🔹 [2] Memanggil Adexium...");
            const adexium = new window.AdexiumWidget({
                wid: IDS.ADEXIUM,
                adFormat: 'interstitial',
                isFullScreen: true,
                debug: false // <--- WAJIB FALSE
            });
            
            // Bungkus Event Listener jadi Promise agar Game MENUNGGU user selesai
            const adResult = await new Promise((resolve) => {
                let isSuccess = false;

                // Skenario Sukses: Nonton sampai habis ATAU Klik Iklan
                const onSuccess = () => { isSuccess = true; };
                
                adexium.on('adPlaybackCompleted', onSuccess); // Nonton tuntas
                adexium.on('adRedirected', onSuccess);        // Klik iklan

                // Skenario Selesai (Apapun hasilnya)
                adexium.on('adClosed', () => {
                    resolve(isSuccess); // Return true jika sukses, false jika skip
                });
                
                // Skenario Gagal Load
                adexium.on('noAdFound', () => resolve(false));

                // Eksekusi Request
                adexium.requestAd('interstitial');
            });

            if (adResult) {
                state.adexium = Date.now();
                return true;
            } else {
                console.warn("⚠️ Adexium di-skip user atau belum selesai.");
                // Jangan return false, lanjut cari iklan lain
            }

        } catch(e) { console.warn("Pass 2 (Adexium):", e); }
    }

    // === PRIORITAS 3: ADEXTRA (Fake Interstitial via Overlay) ===
    if (isReady(state.adextra)) {
        const overlay = document.getElementById('adextra-overlay');
        const container = document.getElementById('25e584f1c176cb01a08f07b23eca5b3053fc55b8');
        
        // Cek apakah banner Adextra sudah termuat di dalam div
        if (overlay && container && container.innerHTML.length > 20) {
            console.log("🔹 [3] Memanggil Adextra...");
            overlay.style.display = 'flex'; // Munculkan Overlay
            state.adextra = Date.now();
            
            // Tunggu user klik tombol tutup manual
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

    // === PRIORITAS 4: ADSGRAM REWARD (ID: 21143) ===
    // [PENTING] Ini blok terpisah dari Interstitial di atas
    if (isReady(state.adsgramRew) && window.Adsgram) {
        try {
            console.log("🔹 [4] Memanggil Adsgram Reward...");
            const controller = window.Adsgram.init({ 
                blockId: IDS.ADSGRAM_REWARD,
                debug: false // <--- WAJIB FALSE
            });
            const res = await controller.show();
            
            // Cek status resmi dari SDK
            if (res.done) {
                state.adsgramRew = Date.now();
                return true;
            } else {
                console.warn("⚠️ Adsgram Reward tidak tuntas.");
            }
        } catch(e) { console.warn("Pass 4 (Adsgram Rew):", e); }
    }

    // --- MASUK ZONA RUSHER (SPAM FRIENDLY - NO COOLDOWN) ---
    
    // === PRIORITAS 5: GIGAPUB ===
    if (window.showGiga) {
        try {
            console.log("🔸 [5] Memanggil GigaPub...");
            await window.showGiga(); // GigaPub punya timer internal sendiri
            return true;
        } catch(e) {}
    }

    // === PRIORITAS 6: MONETAG ===
    // Nama fungsi dinamis sesuai Zone ID
    const monetagFunc = window[`show_${IDS.MONETAG_ZONE}`];
    if (typeof monetagFunc === 'function') {
        try {
            console.log("🔸 [6] Memanggil Monetag...");
            await monetagFunc(); // Monetag punya timer internal sendiri
            return true;
        } catch(e) {}
    }

    // === PRIORITAS 7: RICHADS ===
    if (window.TelegramAdsController) {
        try {
            window.TelegramAdsController.initialize({ 
                pubId: IDS.RICHADS_PUB, 
                appId: IDS.RICHADS_APP,
                debug: false // <--- WAJIB FALSE
            });
            // RichAds jalan di background, kita anggap triggered
            return true;
        } catch(e) {}
    }

    return false; // Gagal total (No Fill semua network)
};


// --- 4. FUNGSI UTAMA: CUSTOM STACK (PANGGIL INI DI TOMBOL) ---
/**
 * @param {number} count - Jumlah iklan yang harus ditonton (1, 2, atau 3)
 */
export const showAdStack = async (count = 1) => {
    console.log(`🚀 START ADS STACK: ${count} Iklan`);
    let successCount = 0;

    for (let i = 0; i < count; i++) {
        // Panggil 1 iklan dari waterfall
        const success = await getSingleAd();
        
        if (success) {
            successCount++;
            // Jeda 1 detik antar iklan agar UI tidak nge-freeze
            if (i < count - 1) await new Promise(r => setTimeout(r, 1000));
        }
    }

    // LOGIKA REWARD:
    // Asal ada 1 saja iklan yang sukses ditonton, kita cairkan reward.
    // Ini menjaga user tidak kabur jika ada 1 iklan yang error di tengah jalan.
    if (successCount > 0) {
        console.log("✅ Stack Selesai. Reward Cair.");
        return true; 
    } else {
        console.error("❌ Gagal. Tidak ada iklan yang sukses ditonton.");
        alert("Gagal memuat iklan. Silakan coba lagi nanti.");
        return false;
    }
};
