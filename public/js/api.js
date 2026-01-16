// public/js/api.js
const API = {
    // Fungsi umum untuk memanggil Backend Vercel
    async call(endpoint, bodyData = {}) {
        // Ambil Data Mentah Telegram (Untuk Validasi di Server)
        const tgData = window.Telegram.WebApp.initData; 
        
        if (!tgData) {
            console.error("Bukan dimainkan di Telegram!");
            return null;
        }

        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    initData: tgData, // KUNCI KEAMANAN: Kirim data mentah selalu
                    ...bodyData 
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            return result.data;

        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            UIEngine.showToast("Connection Error: " + error.message, 'red'); // Asumsi ada UIEngine
            throw error;
        }
    },

    // 1. LOGIN & LOAD GAME
    async loadUser() {
        return await this.call('user/load');
    }
};

// Export ke Window
window.API = API;