// api/game/boost.js
import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { initData } = req.body;
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);

    try {
        const expiry = Date.now() + 86400000; // Aktif 24 jam 
        await userRef.update({
            "user.adBoosterCooldown": expiry
        });
        res.status(200).json({ success: true, expiry });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}