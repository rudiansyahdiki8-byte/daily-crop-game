import admin from 'firebase-admin';

// Validasi Env Variable
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('SERVER ERROR: FIREBASE_SERVICE_ACCOUNT tidak ditemukan di Vercel Environment Variables.');
}

// Inisialisasi Firebase Admin (Singleton Pattern)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Connected");
  } catch (error) {
    console.error("❌ Firebase Admin Connection Failed:", error);
    throw error;
  }
}

const db = admin.firestore();
export { db };