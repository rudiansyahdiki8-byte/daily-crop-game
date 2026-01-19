// api/load.js
import db from './db.js';

export default async function handler(req, res) {
    // Izinkan akses dari mana saja (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "Missing User ID" });
    }

    try {
        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            // User lama: Kembalikan datanya
            return res.status(200).json({ 
                exists: true, 
                data: doc.data() 
            });
        } else {
            // User baru: Beritahu frontend data kosong
            return res.status(200).json({ exists: false, data: null });
        }
    } catch (error) {
        console.error("Load Error:", error);
        return res.status(500).json({ error: "Database Connection Failed" });
    }
}