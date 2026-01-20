// js/bootstrap.js

async function initGame() {
    console.log("[BOOT] Starting Game Initialization...");

    // 1. Coba Load Data (GameState)
    if (window.GameState && typeof window.GameState.load === 'function') {
        try {
            await window.GameState.load();
            console.log("[BOOT] GameState Loaded Successfully");
        } catch (error) {
            console.warn("[BOOT] Failed to load GameState (Mungkin karena Localhost):", error);
            // JANGAN RETURN! Biarkan lanjut ke bawah agar UI tetap render
            // alert("Connection Error. Please refresh."); <-- Matikan alert biar gak ganggu tes UI
        }
    }

    // 2. Initialize Sub-Systems (Hanya jika objectnya ada)
    try {
        if (window.FarmSystem) FarmSystem.init();
        if (window.MarketSystem) MarketSystem.init();
        if (window.PlanSystem) PlanSystem.init();
        if (window.AffiliateSystem) AffiliateSystem.init();
        if (window.WithdrawSystem) WithdrawSystem.init();
    } catch (e) {
        console.error("Sub-system init error:", e);
    }

    // 3. FORCE UI RENDER (PENTING!)
    if (window.UIEngine) {
        UIEngine.updateHeader();
        
        console.log("Force navigating to Home...");
        // Arahkan ke Dashboard atau FarmingHouse
        UIEngine.navigate('FarmingHouse'); 

        // Matikan Loading Screen
        const loadingOverlay = document.getElementById('loading-screen');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    console.log("[BOOT] Game UI Ready (Offline Mode)");
}

window.initGame = initGame;