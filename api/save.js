// api/save.js
import db from './db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { userId, payload } = req.body; // payload berisi { user, warehouse, farmPlots }

        if (!userId || !payload) {
            return res.status(400).json({ error: "Invalid Data" });
        }

        // Tambahkan timestamp server agar akurat
        payload.serverTimestamp = new Date().toISOString();

        // Simpan ke Firestore
        await db.collection('users').doc(userId).set(payload, { merge: true });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Save Error:", error);
        return res.status(500).json({ error: "Failed to Save" });
    }
}