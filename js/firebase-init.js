import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Konfigurasi Publik (Ini OK terlihat di browser, tapi nanti kita kunci domainnya)
const firebaseConfig = {
    apiKey: "AIzaSyCGefQXaiXZBHHGDiQkhiEzZ81vE2g-kys", // Punya Anda
    authDomain: "herbgatherer-51ddf.firebaseapp.com",
    projectId: "herbgatherer-51ddf",
    storageBucket: "herbgatherer-51ddf.firebasestorage.app",
    messagingSenderId: "51585903790",
    appId: "1:51585903790:web:058a5df8dc5c44d912513f",
    measurementId: "G-6FYEJ2TTL6"
};

const app = initializeApp(firebaseConfig);

// EXPOSE KE GLOBAL WINDOW
window.db = getFirestore(app);
window.fs = { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs };

console.log("🔥 Firebase Initialized via External File.");

// Helper untuk memastikan game jalan setelah Firebase siap
if (window.initGame) {
    window.initGame();
} else {
    window.addEventListener('load', () => {
        if(window.initGame) window.initGame();
    });
}
