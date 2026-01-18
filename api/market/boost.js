// api/market/boost.js
import { db } from '../../utils/firebase.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);
        
        // Set cooldown 24 jam dari sekarang di Server
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        
        await userRef.update({
            'user.adBoosterCooldown': expiryTime
        });

        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
}