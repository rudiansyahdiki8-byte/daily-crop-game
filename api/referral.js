// api/referral.js
const { db, verifyUser } = require('../lib/firebase');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId, referrerId } = req.body;

    if (!userId || !referrerId) return res.status(400).json({ message: 'Data missing' });
    if (userId === referrerId) return res.status(400).json({ message: 'Tidak bisa refer diri sendiri' });

    try {
        // 1. Cek User yang mau daftar (Downline)
        const { ref: userRef, data: userData } = await verifyUser(userId);

        // Cek apakah sudah punya upline?
        if (userData.user.upline) {
            return res.status(400).json({ message: 'User sudah punya upline!' });
        }

        // 2. Cek Calon Upline (Referrer)
        const uplineRef = db.collection('users').doc(referrerId);
        const uplineSnap = await uplineRef.get();

        if (!uplineSnap.exists) {
            return res.status(404).json({ message: 'Kode referral tidak valid (User tidak ditemukan)' });
        }

        // 3. Update Database (Atomik)
        const batch = db.batch();

        // A. Update si Pendaftar (Set Upline)
        batch.update(userRef, {
            "user.upline": referrerId,
            "user.referral_status": "Active" 
        });

        // B. Update si Upline (Tambah Teman)
        const newFriendData = {
            id: userId,
            name: userData.user.username || "New Farmer",
            earnings: 0 // Awal gabung belum menghasilkan apa-apa
        };

        batch.update(uplineRef, {
            "user.affiliate.total_friends": FieldValue.increment(1),
            "user.affiliate.friends_list": FieldValue.arrayUnion(newFriendData)
        });

        await batch.commit();

        return res.status(200).json({ 
            success: true, 
            message: 'Berhasil terikat dengan upline',
            uplineId: referrerId
        });

    } catch (error) {
        console.error("Referral Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};