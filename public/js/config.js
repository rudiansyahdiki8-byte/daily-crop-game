// js/config.js
// Mengambil konfigurasi dari Server agar sinkron dan aman.

window.GameConfig = {
    // Default values (fallback) agar game tidak crash sebelum load API
    Crops: {},
    Plans: {},
    ShopItems: {},
    Spin: {},
    Finance: {},
    Tasks: {}
};

// Fungsi untuk load config dari server
async function loadServerConfig() {
    try {
        console.log("[CONFIG] Fetching config from server...");
        const response = await fetch('/api/get-config');
        if (!response.ok) throw new Error("Config fetch failed");
        
        const serverConfig = await response.json();
        
        // Update Window Object
        window.GameConfig = serverConfig;
        console.log("[CONFIG] Updated successfully from Server!", window.GameConfig);
        
        // Trigger event jika ada sistem lain yang menunggu config
        window.dispatchEvent(new Event('ConfigLoaded'));
        
    } catch (e) {
        console.error("[CONFIG] Failed to load server config. Using defaults.", e);
    }
}

// Jalankan saat script dimuat
loadServerConfig();
