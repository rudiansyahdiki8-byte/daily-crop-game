import React, { useState } from 'react';
import { User, Store, Crown, Share2, Wallet, X } from 'lucide-react'; 
import './App.css';

function App() {
  const [activeGarden, setActiveGarden] = useState(1);
  
  // STATE BARU: Menyimpan nama modal yang sedang terbuka (null artinya tertutup)
  const [activeModal, setActiveModal] = useState(null); 

  // Fungsi Pembantu
  const closeModal = () => setActiveModal(null);

  // --- LOGIKA ISI KONTEN POP-UP ---
  const renderModalContent = () => {
    switch(activeModal) {
      case 'WALLET':
        return (
          <>
            <div className="modal-header">
              <span className="modal-title">DOMPET SAYA</span>
              <button className="close-btn" onClick={closeModal}><X /></button>
            </div>
            <div className="modal-body" style={{textAlign:'center'}}>
              <h1 style={{color:'#22c55e', margin:'10px 0'}}>🪙 15,200</h1>
              <p>Saldo bisa ditarik ke FaucetPay / E-Wallet.</p>
              <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                 <button className="action-btn" style={{background:'#d97706', color:'white'}}>DEPOSIT</button>
                 <button className="action-btn btn-primary">WITHDRAW</button>
              </div>
            </div>
          </>
        );

      case 'PROFILE':
        return (
          <>
            <div className="modal-header">
              <span className="modal-title">PROFILE PETANI</span>
              <button className="close-btn" onClick={closeModal}><X /></button>
            </div>
            <div className="modal-body">
              <p><strong>Username:</strong> Farmer Joe</p>
              <p><strong>Email:</strong> joe@farming.com</p>
              <p><strong>Level:</strong> 5 (Tenant)</p>
              <p><strong>Exp:</strong> 4500 / 5000</p>
              <button className="action-btn btn-danger" onClick={closeModal}>LOGOUT</button>
            </div>
          </>
        );

      case 'MARKET':
        return (
          <>
            <div className="modal-header">
              <span className="modal-title">PASAR BIBIT</span>
              <button className="close-btn" onClick={closeModal}><X /></button>
            </div>
            <div className="modal-body">
              <p>Beli bibit untuk ditanam di lahanmu.</p>
              <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'10px'}}>
                <button className="action-btn" style={{background:'#333', border:'1px solid #555', color:'white'}}>🥕 Wortel - 50 Koin</button>
                <button className="action-btn" style={{background:'#333', border:'1px solid #555', color:'white'}}>🥔 Kentang - 100 Koin</button>
              </div>
            </div>
          </>
        );
      
      case 'MEMBER':
        return (
          <>
             <div className="modal-header">
              <span className="modal-title">MEMBERSHIP</span>
              <button className="close-btn" onClick={closeModal}><X /></button>
            </div>
            <div className="modal-body">
              <p>Upgrade statusmu untuk lahan lebih banyak!</p>
              <button className="action-btn" style={{background:'#3b82f6', color:'white'}}>UPGRADE NOW</button>
            </div>
          </>
        );

      case 'AFFILIATE':
        return (
          <>
             <div className="modal-header">
              <span className="modal-title">AFFILIATE</span>
              <button className="close-btn" onClick={closeModal}><X /></button>
            </div>
            <div className="modal-body">
              <p>Undang teman dan dapatkan 10% dari panen mereka!</p>
              <input type="text" value="https://farmgame.com/ref/joe" readOnly style={{width:'100%', padding:'10px', marginTop:'10px', borderRadius:'5px', border:'none'}}/>
              <button className="action-btn btn-primary">COPY LINK</button>
            </div>
          </>
        );

      default: return null;
    }
  };

  // --- LOGIKA LAHAN (SAMA SEPERTI SEBELUMNYA) ---
  const getPlotImage = (index) => {
    if (index === 0) return '/assets/land_base.png';
    if (index === 1) return '/assets/land_locked.png';
    if (index === 2) return '/assets/land_locked.png';
    if (index === 3) return '/assets/land_dying.png';
    return '/assets/land_base.png';
  };

 const renderFarmPlots = () => {
    return Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="farm-plot-card">
        <img 
          src={getPlotImage(index)} 
          className="land-img-bg" 
          alt={`Land ${index+1}`} 
          onError={(e) => e.target.style.display='none'} 
        />
        
        {/* --- BAGIAN INI YANG DIEDIT --- */}
        <div className="plot-overlay">
           {/* HAPUS KODE INI: #{index + 1} */}
           
           {/* Biarkan kode di bawah ini agar ikon GEMBOK (🔒) & LAYU (🥀) tetap muncul */}
           {index === 1 || index === 2 ? '🔒' : ''} 
           {index === 3 ? '🥀' : ''}
        </div>
        {/* ----------------------------- */}

      </div>
    ));
  };

  return (
    <div className="game-container">
      
      {/* 1. USER INFO */}
      <div className="zone-user">
        <div className="glass-card user-card">
          <div className="avatar-section">
             <div className="avatar-circle"><User size={24} color="#333"/></div>
             <div>
                <div className="user-name">FARMER JOE</div>
                <div className="user-lvl">Level 5 (Tenant)</div>
             </div>
          </div>
          <div className="stats-row">
             <div className="stat-pill">🪙 15,200</div>
             <div className="stat-pill">🥬 54 Sold</div>
             
             {/* KLIK TOMBOL WALLET -> BUKA MODAL WALLET */}
             <button className="wallet-btn-small" onClick={() => setActiveModal('WALLET')}>
                <Wallet size={14} color="white" />
             </button>
          </div>
        </div>
      </div>

      {/* 2. MENU BUTTONS (SEKARANG SUDAH BERFUNGSI) */}
      <div className="zone-menu">
        <button className="glass-btn" onClick={() => setActiveModal('PROFILE')}>
           <User size={18} /><span className="btn-label">Profile</span>
        </button>
        <button className="glass-btn" onClick={() => setActiveModal('MARKET')}>
           <Store size={18} /><span className="btn-label">Market</span>
        </button>
        <button className="glass-btn" onClick={() => setActiveModal('MEMBER')}>
           <Crown size={18} /><span className="btn-label">Member</span>
        </button>
        <button className="glass-btn" onClick={() => setActiveModal('AFFILIATE')}>
           <Share2 size={18} /><span className="btn-label">Affiliate</span>
        </button>
      </div>

      {/* 3. WAREHOUSE */}
      <div className="zone-warehouse">
        <img src="/assets/warehouse.png" alt="Gudang" className="warehouse-img" onError={(e) => e.target.style.display='none'} />
      </div>

      {/* 4. AREA FARM */}
      <div className="zone-farm-area">
        <div className="farm-grid-2x2">
          {renderFarmPlots()}
        </div>
        <div className="floating-garden-nav">
            {[1, 2, 3, 4].map((num) => (
            <button 
                key={num}
                className={`garden-btn ${activeGarden === num ? 'active' : ''}`}
                onClick={() => setActiveGarden(num)}
            >
                {num}
            </button>
            ))}
        </div>
      </div>

      {/* --- KOMPONEN MODAL (HANYA MUNCUL JIKA activeModal TIDAK NULL) --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
           {/* stopPropagation agar klik di dalam kotak tidak menutup modal */}
           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {renderModalContent()}
           </div>
        </div>
      )}

    </div>
  );
}

export default App;