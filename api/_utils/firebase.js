import admin from 'firebase-admin';

// Inisialisasi Firebase Admin (Singleton Pattern)
if (!admin.apps.length) {
  try {
    // Pastikan Environment Variable FIREBASE_SERVICE_ACCOUNT sudah diset di Vercel/Local
    // Jika di local, pastikan file .env.local ada isinya
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin Connected Successfully!");
  } catch (error) {
    console.error("❌ Firebase Init Error:", error.message);
  }
}

const db = admin.firestore();

// Helper: Dapatkan referensi dokumen user
export const getUserRef = (userId) => {
  if (!userId) {
    throw new Error("Internal: User ID cannot be null/undefined");
  }
  // Pastikan ID dikonversi ke String agar aman
  return db.collection('users').doc(String(userId));
};

export { db, admin };