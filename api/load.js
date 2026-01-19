// api/load.js
// Berdasarkan struktur defaultUser dari js/state.js [cite: 84]

import db from './db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            // USER LAMA: Kembalikan data apa adanya
            return res.status(200).json({ 
                exists: true, 
                data: doc.data() 
            });
        } else {
            // USER BARU: Init dengan Struktur 'state.js' Asli
            // Kita biarkan Frontend (state.js) yang melakukan save awal
            // agar default values tetap tersentralisasi di frontend.
            // Backend hanya bilang "User belum ada".
            return res.status(200).json({ 
                exists: false, 
                data: null 
            });
        }
    } catch (error) {
        console.error("Load Error:", error);
        return res.status(500).json({ error: "Database Error" });
    }
}
