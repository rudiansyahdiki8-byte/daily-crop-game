// js/bootstrap.js
(function () {
    console.log("🚀 Bootstrap started");

    function startGame() {
        console.log("✅ Game starting...");

        // STATE WAJIB PERTAMA
        if (window.GameState?.init) GameState.init();

        // UI KEDUA
        if (window.UIEngine?.init) UIEngine.init();

        // SYSTEM LAIN
        window.FarmSystem?.init();
        window.WarehouseSystem?.render?.();
        window.MarketSystem?.init();
        window.SpinSystem?.updateTimer?.();
        window.AffiliateSystem?.init();
        window.WithdrawSystem?.init();

        console.log("🎮 All systems initialized");
    }

    // TELEGRAM READY
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        startGame();
    } else {
        // FALLBACK (DEV MODE)
        document.addEventListener("DOMContentLoaded", startGame);
    }
})();
