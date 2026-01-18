// api/utils/firebase.js
import admin from 'firebase-admin';

// Mencegah error "App already exists" saat Vercel melakukan Hot Reload
if (!admin.apps.length) {
    // Gunakan Environment Variables di Vercel Settings nanti
    // Untuk test lokal, pastikan Anda punya kredensial yang benar
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Handle newlines di private key yang sering error di Vercel
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        })
    });
}

const db = admin.firestore();
export { db };