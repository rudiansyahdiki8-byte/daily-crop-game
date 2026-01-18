// public/js/bootstrap.js
import firebase from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";

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

// 3. Inisialisasi
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
window.db = db; // Ini yang dibutuhkan GameState

window.addEventListener('DOMContentLoaded', async () => {
    console.log("[BOOTSTRAP] DOM Ready, checking GameState...");
    
    if (window.UIEngine && UIEngine.showLoading) {
        UIEngine.showLoading("MENYIAPKAN LADANG...");
    }

    try {
        // Cek apakah GameState sudah dimuat di window
        if (!window.GameState) {
            console.error("[BOOTSTRAP] GameState not found! Check if state.js is loaded.");
            return;
        }

        // Jalankan Load (Ini akan mengecek Telegram & Database)
        await GameState.load();
        
        if (GameState.isLoaded) {
            console.log("[BOOTSTRAP] GameState loaded successfully");
            if (window.UIEngine && typeof UIEngine.init === 'function') UIEngine.init();
            if (window.FarmSystem) FarmSystem.init();
        }
    } catch (err) {
        console.error("[BOOTSTRAP] Error during init:", err);
    } finally {
        if (window.UIEngine && UIEngine.hideLoading) UIEngine.hideLoading();
    }
});
