// js/bootstrap.js
// Bootstrapper: Mengelola urutan loading & Reset Tampilan

async function initGame() {
    console.log("[BOOT] Starting Game Initialization...");

    // 1. Pastikan Loading Screen Muncul & Halaman Lain Sembunyi
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'flex';
    
    // Sembunyikan paksa semua area utama di awal agar tidak bertumpuk
    const allSections = ['home-area', 'farm-area', 'market-area', 'task-area', 'withdraw-area', 'Affiliate', 'spin-popup'];
    allSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 2. Tunggu Firebase & GameState Load (Ini proses loading data user)
    if (window.GameState && typeof window.GameState.load === 'function') {
        try {
            await window.GameState.load();
            console.log("[BOOT] GameState Loaded Successfully");
        } catch (error) {
            console.error("[BOOT] Failed to load GameState:", error);
            // Tetap lanjut agar user bisa melihat error visual jika ada, atau retry
        }
    } else {
        console.error("[BOOT] GameState not found!");
    }

    // 3. Initialize Sub-Systems (Nyalakan mesin game)
    if (window.FarmSystem) {
        console.log("[BOOT] Starting FarmSystem...");
        FarmSystem.init();
    }
    if (window.MarketSystem) MarketSystem.init();
    if (window.PlanSystem) PlanSystem.init();
    if (window.AffiliateSystem) AffiliateSystem.init();
    if (window.WithdrawSystem) WithdrawSystem.init();

    // 4. Update UI & Tampilkan Halaman Kebun (Farm)
    if (window.UIEngine) {
        UIEngine.updateHeader();

        // --- SOLUSI MASALAH UI BERTUMPUK ---
        console.log("[BOOT] Switching to Farm View...");
        
        // A. Pastikan Home mati, Farm nyala (Manual Override)
        const homeEl = document.getElementById('home-area');
        const farmEl = document.getElementById('farm-area'); // Pastikan ID di HTML adalah 'farm-area'
        
        if (homeEl) homeEl.style.display = 'none';
        
        if (farmEl) {
            farmEl.style.display = 'block'; // Atau 'flex'
            // Tambahkan class active jika CSS Anda butuh itu
            farmEl.classList.add('active-section'); 
        } else {
            console.warn("Element 'farm-area' tidak ditemukan! Cek index.html");
        }

        // B. Jika UIEngine punya fungsi showScreen/navigate, panggil juga sebagai backup
        if (typeof UIEngine.showScreen === 'function') {
            UIEngine.showScreen('farm-area');
        } else if (typeof UIEngine.navigate === 'function') {
            // Pastikan parameter ini sesuai ID halaman kebun Anda
            UIEngine.navigate('farm-area'); 
        }

        // 5. Matikan Loading Screen
        if (loadingScreen) {
            // Beri sedikit delay agar transisi halus
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    console.log("[BOOT] Game Ready!");
}

// Expose ke window
window.initGame = initGame;

// AUTO-START: Panggil fungsi ini otomatis saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
