// public/js/bootstrap.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGefQXaiXZBHHGDiQkhiEzZ81vE2g-kys",
  authDomain: "herbgatherer-51ddf.firebaseapp.com",
  projectId: "herbgatherer-51ddf",
  storageBucket: "herbgatherer-51ddf.firebasestorage.app",
  messagingSenderId: "51585903790",
  appId: "1:51585903790:web:058a5df8dc5c44d912513f",
  measurementId: "G-6FYEJ2TTL6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db; // Agar bisa dibaca state.js

window.addEventListener('DOMContentLoaded', async () => {
    if(window.UIEngine) UIEngine.showLoading("MENYIAPKAN LADANG...");
    
    // 1. Inisialisasi User
    await GameState.init();
    
    // 2. Cek Referral
    if(window.AffiliateSystem) await AffiliateSystem.checkReferralParam();
    
    // 3. Nyalakan UI
    if(window.UIEngine) {
        UIEngine.init();
        UIEngine.hideLoading();
    }
    
    // 4. Jalankan Ladang
    if(window.FarmSystem) FarmSystem.init();
});