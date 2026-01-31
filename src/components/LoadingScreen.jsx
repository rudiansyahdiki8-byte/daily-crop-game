import React from 'react';

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

export default LoadingScreen;
