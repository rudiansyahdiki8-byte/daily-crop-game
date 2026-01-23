// src/components/farm/FarmGrid.jsx
import React from 'react';
import './FarmGrid.css';

const FarmGrid = () => {
  // Kita buat 4 kotak lahan simulasi
  const plots = [
    { id: 1, status: 'active' },
    { id: 2, status: 'locked' },
    { id: 3, status: 'locked' },
    { id: 4, status: 'locked' },
  ];

  return (
    <div className="farm-grid-container">
      {plots.map((plot) => (
        <div key={plot.id} className={`land-wrapper ${plot.status}`}>
          {/* LOGIKA GAMBAR ANTI-BLANK: */}
          {/* Coba panggil gambar, kalau gagal panggil kotak warna */}
          
          {plot.status === 'active' ? (
             // LAHAN AKTIF (Coklat)
             <img 
               src="/assets/land_base.png" 
               className="land-img" 
               alt="Land"
               onError={(e) => {
                 e.target.style.display = 'none'; // Sembunyikan gambar rusak
                 e.target.nextSibling.style.display = 'block'; // Munculkan kotak cadangan
               }} 
             />
          ) : (
             // LAHAN TERKUNCI (Abu)
             <img 
               src="/assets/land_locked.png" 
               className="land-img locked" 
               alt="Locked" 
               onError={(e) => {
                 e.target.style.display = 'none';
                 e.target.nextSibling.style.display = 'flex';
               }}
             />
          )}

          {/* CADANGAN (FALLBACK) JIKA GAMBAR TIDAK ADA */}
          <div className="fallback-box" style={{display: 'none'}}>
             {plot.status === 'locked' ? '🔒' : '🌱'}
          </div>

        </div>
      ))}
    </div>
  );
};

export default FarmGrid;