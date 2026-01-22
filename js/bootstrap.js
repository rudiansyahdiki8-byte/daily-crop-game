// js/bootstrap.js
// ==========================================
// SYSTEM BOOTSTRAP (THE ENGINE STARTER)
// Tugas: Menghubungkan User -> Database -> Plan System -> Game Logic
// ==========================================

window.onload = async function() {
    console.log("[BOOT] Starting Daily Crop System...");

    // 1. Inisialisasi UI Engine (Loading Screen)
    if (window.UIEngine) {
        UIEngine.init(); 
        // Tampilkan loading screen di awal
        const app = document.getElementById('app');
        if(app) app.classList.add('hidden'); // Sembunyikan game dulu
    }

    // 2. Load Database & User State
    if (window.GameState) {
        await GameState.load();
    }

    // 3. LOGIC PINTU DORAEMON (GATEWAY CHECK)
    // Pastikan user punya Plan yang valid. Jika User Baru, otomatis "FREE".
    const user = GameState.user;
    if (!user.plan || !window.GameConfig.Plans[user.plan]) {
        console.log("[SYSTEM] New User Detected. Assigning 'FREE' Plan.");
        user.plan = 'FREE';
        user.planExpiresAt = 0;
        await GameState.save();
    }

    // Cek apakah Plan sudah expired (Downgrade otomatis jika perlu)
    GameState.getActivePlan(); 

    // 4. Inisialisasi Sistem Game (Sesuai Urutan)
    
    // -> Market (Load Harga Terkini)
    if (window.MarketSystem) MarketSystem.init();

    // -> Farm (PENTING: Ini yang membuka lahan sesuai Plan Free)
    if (window.FarmSystem) {
        FarmSystem.init(); 
        // Paksa update status slot agar lahan Free langsung terbuka visualnya
        FarmSystem.updateSlotStatus(); 
    }

    // -> Warehouse (Set Limit Gudang sesuai Plan)
    if (window.WarehouseSystem) {
        // Render awal, tapi UI tetap tersembunyi
        WarehouseSystem.renderLayout(); 
    }

    // -> Plan UI (Siapkan halaman upgrade)
    if (window.PlanSystem) PlanSystem.init();

    // -> Ads System
    if (window.AdsManager) AdsManager.init();

    // 5. Finalisasi Tampilan
    if (window.UIEngine) {
        UIEngine.updateHeader(); // Update Koin & Nama di atas
        
        // Matikan Loading, Buka Tirai Game
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            const app = document.getElementById('app');
            
            if(loading) loading.style.display = 'none';
            if(app) {
                app.classList.remove('hidden');
                app.classList.add('animate-in', 'fade-in');
            }
            
            // Default Tab: Langsung ke Farm (Tempat Main Utama)
            UIEngine.navigate('FarmingHouse');
            
            // Sapaan Selamat Datang untuk User Baru
            if (user.coins === 0 && user.totalHarvest === 0) {
                UIEngine.showRewardPopup("WELCOME FARMER!", "You have been given a Free Plot. Start planting now!", null, "LET'S GO");
            }

        }, 1500); // Delay sedikit biar loading terlihat smooth
    }

    console.log("[BOOT] System Ready. Current Plan:", user.plan);
};