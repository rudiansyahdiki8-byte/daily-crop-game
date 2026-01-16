// public/js/state.js
const GameState = {
    user: { coins: 0 }, // Inisialisasi agar tidak error toLocaleString
    warehouse: {},
    isLoaded: false, // Ini yang dicek oleh ui.js Anda

    async load() {
        try {
            // Panggil API Vercel Anda
            const response = await fetch('/api/user/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: window.Telegram.WebApp.initData })
            });
            const result = await response.json();
            
            if (result.success) {
                // Masukkan data ke variabel ASLI Anda
                this.user = result.userData; 
                this.warehouse = result.userData.warehouse || {};
                
                // AKTIFKAN NAVIGASI
                this.isLoaded = true; 
                
                if (window.UIEngine) UIEngine.updateHeader();
            }
        } catch (e) {
            console.error("Gagal sinkronisasi data server:", e);
        }
    }
};
window.GameState = GameState;
