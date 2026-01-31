import React from 'react';

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

export default DesktopBlocker;
