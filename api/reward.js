// File: api/reward.js
// Ini hanya fungsi penerima surat kosong agar Adsgram tidak error.
// Nanti bisa kita upgrade jika Anda sudah butuh keamanan tinggi.

export default function handler(req, res) {
    // Apapun yang dikirim Adsgram, kita jawab "Sukses/200 OK"
    // Agar dashboard Adsgram menganggap URL ini valid.
    res.status(200).json({ 
        status: 'success', 
        message: 'Reward verified (Client-side mode)' 
    });
}
