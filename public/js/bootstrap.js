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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.db = db;

window.addEventListener('DOMContentLoaded', async () => {
    // Pastikan UIEngine sudah ada sebelum dipanggil
    if (window.UIEngine && UIEngine.showLoading) {
        UIEngine.showLoading("MENYIAPKAN LADANG...");
    }

    try {
        // Jalankan Load Data
        await GameState.load();
        
        // Pastikan UIEngine.init ada di file ui.js
        if (window.UIEngine && typeof UIEngine.init === 'function') {
            UIEngine.init();
        }
        
        if (window.FarmSystem) FarmSystem.init();
        
    } catch (err) {
        console.error("Bootstrap Error:", err);
    } finally {
        if (window.UIEngine && UIEngine.hideLoading) {
            UIEngine.hideLoading();
        }
    }
});
