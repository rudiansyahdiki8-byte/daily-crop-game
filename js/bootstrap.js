// js/bootstrap.js
// Bootstrapper: Mengelola urutan loading agar GameState siap sebelum UI dirender

async function initGame() {
    console.log("[BOOT] Starting Game Initialization...");

    // 1. Tampilkan Loading Screen (Optional: Bisa ditambahkan overlay di HTML nanti)
    
    // 2. Tunggu Firebase & GameState Load
    if (window.GameState && typeof window.GameState.load === 'function') {
        try {
            await window.GameState.load();
            console.log("[BOOT] GameState Loaded Successfully");
        } catch (error) {
            console.error("[BOOT] Failed to load GameState:", error);
            alert("Connection Error. Please refresh.");
            return;
        }
    } else {
        console.error("[BOOT] GameState not found!");
        return;
    }

    // 3. Initialize Sub-Systems (Setelah Data User Siap)
    if (window.FarmSystem) {
        console.log("[BOOT] Starting FarmSystem...");
        FarmSystem.init();
    }

    if (window.MarketSystem) {
        console.log("[BOOT] Starting MarketSystem...");
        MarketSystem.init();
    }

    if (window.PlanSystem) {
        PlanSystem.init();
    }

    if (window.AffiliateSystem) {
        AffiliateSystem.init();
    }
    
    if (window.WithdrawSystem) {
        WithdrawSystem.init();
    }

    // 4. Update UI Header Terakhir (Saldo, Nama, Level)
if (window.UIEngine) {
        UIEngine.updateHeader();

        // --- PERBAIKAN DIMULAI DISINI ---
        
        // 1. Paksa Navigasi ke Halaman Utama dulu (PENTING!)
        // Ini yang bikin tampilan rapi dan tidak menumpuk
        console.log("Force navigating to Home...");
        UIEngine.navigate('FarmingHouse'); 

        // 2. Baru hilangkan Loading Screen
        // Pastikan ID-nya sama dengan di index.html ('loading-screen' atau 'loading-overlay'?)
        const loadingOverlay = document.getElementById('loading-screen'); 
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        // --- PERBAIKAN SELESAI ---
    }

    console.log("[BOOT] Game Ready!");
}
// Expose ke window agar bisa dipanggil
window.initGame = initGame;