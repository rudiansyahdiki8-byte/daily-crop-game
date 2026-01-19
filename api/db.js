// api/db.js
import admin from 'firebase-admin';

// Cek apakah Service Account ada di Environment Vercel
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("FATAL: FIREBASE_SERVICE_ACCOUNT is missing in Vercel Environment Variables.");
}

// Inisialisasi Firebase Admin (Hanya sekali)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 [BACKEND] Firebase Admin Connected");
    } catch (error) {
        console.error("🔥 [BACKEND] Connection Error:", error);
        throw error;
    }
}

const db = admin.firestore();
export default db;