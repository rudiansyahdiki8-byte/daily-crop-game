// js/main.js
import { state } from './state.js';

// Fungsi start sementara untuk testing
async function startGame() {
    console.log("🚀 Memulai Game...");
    
    // Panggil fungsi init() dari state.js
    const success = await state.init();

    if (success) {
        // Jika berhasil, tampilkan data di layar (untuk bukti)
        document.body.innerHTML = `
            <div style="color: white; text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h1>✅ BERHASIL MASUK!</h1>
                <p>Halo, <strong>${state.user.username}</strong></p>
                <p>Plan Anda: <strong>${state.user.plan}</strong> (Sesuai Excel)</p>
                <p>Limit Gudang: <strong>${state.user.warehouseLimit}</strong> (Sesuai Excel)</p>
                <p>Saldo Awal: <strong>${state.user.coin}</strong> Coin</p>
                <hr>
                <p><em>Fase 1 Selesai. Siap lanjut ke Tampilan Game.</em></p>
            </div>
        `;
    }
}

// Jalankan saat halaman siap
window.addEventListener('load', startGame);
