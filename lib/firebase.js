const admin = require('firebase-admin');

// Mencegah inisialisasi ganda (cold start issue di serverless)
if (!admin.apps.length) {
  // 1. Ambil string JSON dari Environment Variable
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountRaw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT tidak ditemukan di Environment Variables!');
  }

  // 2. Parse string menjadi Object JavaScript
  // Pastikan isi variabel di Vercel adalah copy-paste langsung dari file .json yang didapat dari Firebase
  const serviceAccount = JSON.parse(serviceAccountRaw);

  // 3. Inisialisasi Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://nama-project-anda.firebaseio.com" // (Opsional: Aktifkan ini jika Anda pakai Realtime Database, kalau Firestore hapus saja baris ini)
  });
}

const db = admin.firestore();

module.exports = { admin, db };