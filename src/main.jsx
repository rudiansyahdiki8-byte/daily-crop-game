import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css' // Pastikan CSS global ada di sini

// --- 1. KOMPONEN LOADING SCREEN (ANIMASI KEREN) ---
const LoadingScreen = () => {
  return (
    <div style={{
      height: '100vh', width: '100vw', background: '#050505', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', position: 'fixed', top: 0, left: 0, zIndex: 9999
    }}>
      {/* Icon Berputar/Bouncing */}
      <div style={{
        marginBottom: 20,
        animation: 'bounce 1s infinite alternate'
      }}>
        <i className="fa-solid fa-tractor fa-3x" style={{
          color: '#39FF14',
          filter: 'drop-shadow(0 0 15px #39FF14)'
        }}></i>
      </div>

      {/* Teks Loading */}
      <h2 style={{
        margin: 0, letterSpacing: 3, fontSize: '1.5rem',
        background: 'linear-gradient(90deg, #39FF14, #00E5FF)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        CYBER FARMER
      </h2>

      <div style={{
        marginTop: 10, fontSize: '0.8rem', color: '#666',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <i className="fa-solid fa-spinner fa-spin"></i>
        <span>MEMUAT LADANG...</span>
      </div>

      {/* CSS Animasi Lokal */}
      <style>{`
        @keyframes bounce { 
          from { transform: translateY(0); opacity: 0.8; } 
          to { transform: translateY(-10px); opacity: 1; } 
        }
      `}</style>
    </div>
  );
};

// --- 2. KOMPONEN LAYAR BLOKIR (QR CODE) ---
const DesktopBlocker = ({ platform }) => {
  return (
    <div style={{
      height: '100vh', width: '100vw', background: '#0f0f0f', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', textAlign: 'center', padding: 20
    }}>
      <div style={{
        width: 150, height: 150, background: 'white', padding: 10, borderRadius: 15, marginBottom: 20
      }}>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/Daily_Cropbot/play"
          alt="Scan QR" style={{ width: '100%', height: '100%' }}
        />
      </div>
      <h2 style={{ color: '#F44336', marginBottom: 10 }}>MOBILE DEVICE ONLY</h2>
      <p style={{ color: '#aaa', maxWidth: 400, lineHeight: 1.5 }}>
        Game ini terdeteksi berjalan di: <span style={{ color: 'white', fontWeight: 'bold' }}>{platform || 'Browser/PC'}</span>
      </p>
      <p style={{ color: '#aaa', maxWidth: 400, marginTop: 10, fontSize: '0.9rem' }}>
        Silakan mainkan lewat Aplikasi Telegram di <strong>HP (Android / iOS)</strong>.
      </p>
    </div>
  );
};

// --- 3. KOMPONEN "SATPAM" (GAME GUARD) ---
const GameGuard = () => {
  const [isAllowed, setIsAllowed] = useState(false);
  const [platform, setPlatform] = useState('Checking...');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Simulasi delay sedikit (misal 1.5 detik) agar Loading Screen terlihat 
    // (Biar user merasa "Oh game sedang disiapkan")
    const timer = setTimeout(() => {
      performCheck();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const performCheck = () => {
    // A. Mode Localhost (Bypass untuk Bapak Coding)
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      console.log("Development Mode: Security Bypassed ✅");
      setIsAllowed(true);
      setChecking(false);
      return;
    }

    // B. Cek Telegram WebApp
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand(); // Paksa Layar Penuh

      const currentPlatform = tg.platform || 'unknown';
      setPlatform(currentPlatform);

      // Daftar Platform yang DIBOLEHKAN
      const allowed = ['android', 'ios'];

      if (allowed.includes(currentPlatform)) {
        setIsAllowed(true);
      } else {
        // Blokir 'tdesktop' (PC), 'macos', 'web', dll
        setIsAllowed(false);
      }
    } else {
      setPlatform('Browser Luar');
      setIsAllowed(false);
    }

    setChecking(false);
  };

  // Tampilkan Loading Screen selama pengecekan
  if (checking) {
    return <LoadingScreen />;
  }

  // LOGIKA UTAMA:
  // Jika Diizinkan -> Render <App /> (Game)
  // Jika Tidak -> Render <DesktopBlocker />
  return isAllowed ? <App /> : <DesktopBlocker platform={platform} />;
};

// --- 4. RENDER UTAMA ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GameGuard />
    </ErrorBoundary>
  </React.StrictMode>,
)
