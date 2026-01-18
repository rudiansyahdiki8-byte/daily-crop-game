// api/affiliate/bind.js
import { db } from '../utils/firebase.js';
import * as admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, refCode } = req.body;

    // Validasi Dasar
    if (!userId || !refCode) return res.status(400).json({ error: 'Data kurang' });
    if (userId === refCode) return res.status(400).json({ error: 'Tidak bisa invite diri sendiri' });

    try {
        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw "User baru belum terdaftar";
            
            const user = doc.data().user || {};

            // 1. CEK APAKAH SUDAH PUNYA UPLINE
            if (user.upline) {
                // Jika sudah ada, jangan diubah (Keamanan: Upline bersifat permanen)
                return; // Diam saja, anggap sukses tapi tidak ada perubahan
            }

            // 2. CEK APAKAH KODE REFERRAL VALID (Apakah user pengundang ada?)
            const uplineRef = db.collection('users').doc(refCode);
            const uplineDoc = await t.get(uplineRef);
            
            if (!uplineDoc.exists) {
                throw "Kode referral tidak valid (User tidak ditemukan)";
            }

            // 3. SIMPAN UPLINE
            t.update(userRef, { 'user.upline': refCode });
            
            // Opsional: Tambahkan counter teman ke si Pengundang
            t.update(uplineRef, { 
                'user.affiliate.total_friends': admin.firestore.FieldValue.increment(1) 
            });
        });

        return res.json({ success: true });

    } catch (e) {
        return res.status(400).json({ success: false, message: e.toString() });
    }
}