// api/load.js
import db from './db.js';

export default async function handler(req, res) {
    // 1. Setup Header CORS (Penting agar frontend bisa akses)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    // Handle Preflight Request
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId } = req.query;

    // Validasi ID
    if (!userId) {
        return res.status(400).json({ error: "Missing User ID" });
    }

    try {
        // 2. Ambil Data dari Firebase
        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            // USER LAMA: Kembalikan datanya
            return res.status(200).json({ 
                exists: true, 
                data: doc.data() 
            });
        } else {
            // USER BARU: Beritahu frontend bahwa data kosong
            // Frontend (state.js) akan membuat data default sendiri
            return res.status(200).json({ 
                exists: false, 
                data: null 
            });
        }
    } catch (error) {
        console.error("Load Error:", error);
        // Jangan biarkan crash, kirim JSON error
        return res.status(500).json({ error: "Database Connection Failed" });
    }
}
