import { db } from '../utils/firebase';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId, uplineId } = req.body;

    if (!userId || !uplineId) return res.status(400).json({ error: "Data kurang" });
    if (userId === uplineId) return res.status(400).json({ error: "Tidak bisa invite diri sendiri" });

    try {
        const userRef = db.collection('users').doc(userId);
        const uplineRef = db.collection('users').doc(uplineId);

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const uplineDoc = await t.get(uplineRef);

            if (!userDoc.exists) throw "User baru harus login minimal sekali";
            if (!uplineDoc.exists) throw "Kode Referral (Upline) tidak valid";

            const userData = userDoc.data().user || {};
            
            // CEK: Apakah sudah punya upline?
            if (userData.upline) throw "Anda sudah punya upline!";

            // Update User (Anak)
            t.update(userRef, {
                "user.upline": uplineId
            });

            // Update Upline (Bapak) - Tambah jumlah teman
            const uplineData = uplineDoc.data().user || {};
            const currentList = uplineData.affiliate?.friends_list || [];
            const currentTotal = uplineData.affiliate?.total_friends || 0;

            // Masukkan data user ke list teman upline (Ringkasan saja)
            currentList.push({
                id: userId,
                name: userData.username || "Farmer",
                earnings: 0 // Awalnya 0
            });

            t.update(uplineRef, {
                "user.affiliate.total_friends": currentTotal + 1,
                "user.affiliate.friends_list": currentList
            });
        });

        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.toString() });
    }
}