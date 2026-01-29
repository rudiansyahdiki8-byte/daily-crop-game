import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

// --- 1. KOMPONEN LOADING SCREEN ---
const LoadingScreen = () => {
  return (
    <div style={{
      height: '100vh', width: '100vw', background: '#050505', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', position: 'fixed', top: 0, left: 0, zIndex: 9999
    }}>
      <div style={{ marginBottom: 20, animation: 'bounce 1s infinite alternate' }}>
        <i className="fa-solid fa-tractor fa-3x" style={{
            color:'#39FF14', 
            filter: 'drop-shadow(0 0 15px #39FF14)'
        }}></i>
      </div>
      <h2 style={{
        margin: 0, letterSpacing: 3, fontSize: '1.5rem', 
        background: 'linear-gradient(90deg, #39FF14, #00E5FF)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>CYBER FARMER</h2>
      <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fa-solid fa-spinner fa-spin"></i>
        <span>MEMUAT LADANG...</span>
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); opacity: 0.8; } to { transform: translateY(-10px); opacity: 1; } }`}</style>
    </div>
  );
};

// --- 2. KOMPONEN LAYAR BLOKIR (DINONAKTIFKAN SEMENTARA) ---
const DesktopBlocker = ({ platform }) => {
  return (
    <div style={{
      height: '100vh', width: '100vw', background: '#0f0f0f', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', textAlign: 'center', padding: 20
    }}>
      <h2 style={{color:'#F44336'}}>AKSES DITOLAK</h2>
      <p>Platform: {platform}</p>
    </div>
  );
};

// --- 3. KOMPONEN "SATPAM" (MODIFIKASI: SELALU IZINKAN) ---
const GameGuard = () => {
  const [isAllowed, setIsAllowed] = useState(false);
  const [platform, setPlatform] = useState('Checking...');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Cek langsung tanpa delay lama
    const timer = setTimeout(() => {
        performCheck();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const performCheck = () => {
    // 1. Ambil info Telegram WebApp
    const tg = window.Telegram?.WebApp;
    let currentPlatform = 'unknown';

    if (tg) {
      tg.ready();
      tg.expand();
      currentPlatform = tg.platform || 'unknown';
    } else {
      currentPlatform = 'Browser Luar';
    }

    setPlatform(currentPlatform);

    // 🔴 BYPASS TOTAL: IZINKAN SEMUA PERANGKAT MASUK
    // Kita tidak pakai if-else block. Langsung true.
    console.log(`Debug Mode: Platform detected as ${currentPlatform}. Access GRANTED.`);
    setIsAllowed(true); 
    setChecking(false);
  };

  if (checking) {
    return <LoadingScreen />;
  }

  // Tampilkan App + Info Platform kecil di pojok (untuk debug)
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99999, 
        background: 'rgba(0,0,0,0.7)', color: '#00ff00', 
        fontSize: '10px', padding: '2px 5px', pointerEvents: 'none'
      }}>
        DEBUG: {platform}
      </div>
      
      {isAllowed ? <App /> : <DesktopBlocker platform={platform} />}
    </>
  );
};

// --- 4. RENDER UTAMA ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameGuard />
  </React.StrictMode>,
)
