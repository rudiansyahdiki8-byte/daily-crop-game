const { db, admin } = require('../../lib/firebase');
const crypto = require('crypto');

// (Include verifyTelegramWebAppData function here)
function verifyTelegramWebAppData(telegramInitData) { /* Copy logic validasi */ 
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash !== hash) throw new Error("Invalid Hash");
    return JSON.parse(urlParams.get('user'));
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { initData, refCode } = req.body;
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;

        // Validasi Dasar
        if (!refCode || refCode === userId) return res.status(400).json({ error: "Invalid Referral" });

        const userRef = db.collection('users').doc(userId);
        const uplineRef = db.collection('users').doc(refCode);

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const uplineDoc = await t.get(uplineRef);

            if (!userDoc.exists) throw new Error("User not found");
            if (!uplineDoc.exists) throw new Error("Upline not found"); // Ref code salah

            const userData = userDoc.data();

            // Cek apakah sudah punya upline
            if (userData.upline) return; // Sudah punya, abaikan diam-diam

            // 1. Update User (Punya Upline Baru)
            t.update(userRef, { upline: refCode });

            // 2. Update Upline (Tambah Teman)
            const friendData = {
                id: userId,
                name: userData.username || tgUser.first_name,
                earnings: 0 // Default 0
            };

            t.update(uplineRef, {
                "affiliate.total_friends": admin.firestore.FieldValue.increment(1),
                "affiliate.friends_list": admin.firestore.FieldValue.arrayUnion(friendData)
            });
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        // Error upline not found tidak perlu bikin panik client
        return res.status(200).json({ success: false, message: error.message });
    }
};