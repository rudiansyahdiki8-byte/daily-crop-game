// lib/firebase.js
const admin = require('firebase-admin');

// Mencegah error inisialisasi ganda
if (!admin.apps.length) {
  try {
    // Kita mengambil "Service Account" dari variabel rahasia Vercel
    // Nanti saya ajarkan cara setting variabel ini di Dashboard Vercel
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("🔥 [SERVER] Firebase Admin Connected");
  } catch (error) {
    console.error("❌ [SERVER] Firebase Init Error:", error);
  }
}

const db = admin.firestore();

// Helper: Fungsi untuk cek apakah User ID valid di database
const verifyUser = async (userId) => {
    if(!userId) throw new Error("Missing User ID");
    const userRef = db.collection('users').doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) throw new Error("User not found");
    return { ref: userRef, data: snap.data() };
};

module.exports = { admin, db, verifyUser };