import { db } from '../utils/firebase';

// Config Reward [cite: 463]
const TaskRewards = {
    daily_login: 120,
    visit_farm: 120,
    free_reward: 120,
    clean_farm: 120,
    water_plants: 150,
    fertilizer: 150,
    kill_pests: 150,
    harvest_once: 180,
    sell_item: 180
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, taskId } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User not found";

            const data = doc.data();
            const user = data.user || {};
            const lastClaims = user.task_claims || {}; // Kita simpan di DB, bukan localStorage

            // 1. Cek Cooldown (24 Jam)
            const now = Date.now();
            const lastClaimTime = lastClaims[taskId] || 0;
            if (now < lastClaimTime + 86400000) throw "Task already claimed today!";

            // 2. Beri Reward
            const reward = TaskRewards[taskId];
            if (!reward) throw "Task ID Invalid";

            // 3. Update DB
            lastClaims[taskId] = now;
            t.update(userRef, {
                "user.coins": (user.coins || 0) + reward,
                "user.task_claims": lastClaims
            });
        });

        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.toString() });
    }
}