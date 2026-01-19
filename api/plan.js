import db from './db.js';
import { GameConfig } from './gameConfig.js';

export default async function handler(req, res) {
    // Izinkan akses frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing User ID" });

    try {
        // 1. Ambil Data User Terkini
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        
        // Default ke FREE jika user tidak ditemukan
        const currentPlan = doc.exists ? (doc.data().user.plan || 'FREE') : 'FREE';

        // 2. Tentukan Urutan Level
        const tiers = ['FREE', 'MORTGAGE', 'TENANT', 'OWNER'];
        const currentLevel = tiers.indexOf(currentPlan);

        // 3. Susun Data Plan untuk Frontend
        // Server yang menentukan status: 'active', 'owned', 'available', atau 'locked'
        const plansData = tiers.map((planKey, index) => {
            let status = 'locked';
            
            if (planKey === currentPlan) {
                status = 'active'; // Plan saat ini
            } else if (index < currentLevel) {
                status = 'owned';  // Level di bawahnya (sudah lewat)
            } else if (index === currentLevel + 1) {
                status = 'available'; // Level selanjutnya (Bisa upgrade)
            } 
            // Sisanya 'locked' (Loncat level tidak boleh)

            return {
                id: planKey,
                price: GameConfig.Plans[planKey], // Ambil harga dari Config Server
                status: status
            };
        });

        return res.status(200).json({ 
            success: true, 
            currentPlan, 
            plans: plansData 
        });

    } catch (error) {
        console.error("Plans API Error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
}
