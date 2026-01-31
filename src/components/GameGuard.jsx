import React, { useState, useEffect } from 'react';
import App from '../App.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import DesktopBlocker from './DesktopBlocker.jsx';

const GameGuard = () => {
    const [isAllowed, setIsAllowed] = useState(false);
    const [platform, setPlatform] = useState('Checking...');
    const [checking, setChecking] = useState(true);

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

    useEffect(() => {
        // Simulasi delay sedikit (misal 1.5 detik) agar Loading Screen terlihat 
        // (Biar user merasa "Oh game sedang disiapkan")
        const timer = setTimeout(() => {
            performCheck();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    // Tampilkan Loading Screen selama pengecekan
    if (checking) {
        return <LoadingScreen />;
    }

    // LOGIKA UTAMA:
    // Jika Diizinkan -> Render <App /> (Game)
    // Jika Tidak -> Render <DesktopBlocker />
    return isAllowed ? <App /> : <DesktopBlocker platform={platform} />;
};

export default GameGuard;
