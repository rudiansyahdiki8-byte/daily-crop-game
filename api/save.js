// api/save.js
import db from './db.js';

export default async function handler(req, res) {
    // 1. Setup Header CORS (Wajib agar Frontend bisa akses)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request (Browser cek ombak)
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Pastikan metode adalah POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Ambil Data dari Frontend
    // Structure: { userId: "TG-123", payload: { user: {...}, warehouse: {...} } }
    const { userId, payload } = req.body;

    if (!userId || !payload) {
        return res.status(400).json({ error: "Missing userId or payload" });
    }

    try {
        // 3. Simpan ke Firebase
        // Kita gunakan { merge: true } agar jika ada field baru tidak menghapus yang lama
        await db.collection('users').doc(userId).set(payload, { merge: true });

        // 4. Beri Tahu Frontend "Sukses"
        return res.status(200).json({ success: true, message: "Game Saved" });

    } catch (error) {
        console.error("Save API Error:", error);
        return res.status(500).json({ error: "Database Write Failed" });
    }
}
