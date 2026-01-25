import React, { useState } from 'react';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('SALES'); // 'SALES' or 'WITHDRAW'

  if (!isOpen) return null;

  // --- DATA HELPER ---
  const history = user?.history || [];
  
  // Filter Data berdasarkan Tab
  const filteredHistory = history.filter(item => {
      if (activeTab === 'SALES') return item.type === 'SELL';
      if (activeTab === 'WITHDRAW') return item.type === 'WITHDRAW';
      return false;
  }).slice(0, 5); // Ambil 5 Terakhir saja

  // Format Tanggal
  const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
  };

  // Hitung Total Item di Gudang (sebagai pengganti Total Harvest jika data belum ada)
  const currentHarvest = Object.values(user?.inventory || {}).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', gap: 15
      }}>

        {/* ================= CARD 1: USER INFO FULL ================= */}
        <div style={{
            background: 'linear-gradient(160deg, #1e2a38 0%, #16213e 100%)',
            borderRadius: 20, padding: 20, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 5px 20px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden'
        }}>
            {/* Background Decoration */}
            <div style={{
                position:'absolute', top:-20, right:-20, width:100, height:100, 
                background:'radial-gradient(circle, rgba(0,229,255,0.2) 0%, transparent 70%)', borderRadius:'50%'
            }}></div>

            <div style={{display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20}}>
                {/* Avatar */}
                <div style={{
                    width: 60, height: 60, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #00E5FF, #2979FF)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)'
                }}>
                    <i className="fa-solid fa-user-astronaut fa-2x" style={{color: 'white'}}></i>
                </div>
                
                {/* Text Info */}
                <div>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'white'}}>
                        {user?.username || 'Cyber Farmer'}
                    </div>
                    <div style={{display:'flex', gap: 10, marginTop: 5}}>
                         <Badge text={`ID: ${user?.id || '-'}`} color="#aaa" bg="rgba(255,255,255,0.1)" />
                         <Badge text={user?.plan || 'FREE'} color="#000" bg="#FFD700" icon="fa-crown" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                <StatBox label="Total Harvest" value={`${currentHarvest} Items`} icon="fa-wheat-awn" color="#4CAF50" />
                <StatBox label="Total Sell" value={user?.totalSales?.toLocaleString() || 0} icon="fa-coins" color="#FFC107" />
            </div>
        </div>


        {/* ================= CARD 2: HISTORY TABS ================= */}
        <div style={{
            background: '#1a1a1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            {/* Tab Header */}
            <div style={{display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <TabButton 
                    label="Riwayat Jual" icon="fa-shop" 
                    isActive={activeTab === 'SALES'} onClick={() => setActiveTab('SALES')} 
                />
                <TabButton 
                    label="Riwayat Tarik" icon="fa-money-bill-transfer" 
                    isActive={activeTab === 'WITHDRAW'} onClick={() => setActiveTab('WITHDRAW')} 
                />
            </div>

            {/* List Content */}
            <div style={{flex: 1, overflowY: 'auto', padding: 15}}>
                {filteredHistory.length === 0 ? (
                    <div style={{textAlign: 'center', color: '#555', marginTop: 30}}>
                        <i className="fa-regular fa-folder-open fa-2x" style={{marginBottom: 10}}></i>
                        <div>Belum ada data {activeTab === 'SALES' ? 'penjualan' : 'penarikan'}</div>
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {filteredHistory.map((item, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: 10,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderLeft: `3px solid ${activeTab === 'SALES' ? '#4CAF50' : '#FF5252'}`
                            }}>
                                <div>
                                    <div style={{fontWeight: 'bold', color: 'white', fontSize: '0.9rem'}}>
                                        {item.desc || (activeTab === 'SALES' ? 'Penjualan' : 'Withdrawal')}
                                    </div>
                                    <div style={{fontSize: '0.7rem', color: '#888'}}>
                                        {formatDate(item.date)}
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 'bold', 
                                    color: activeTab === 'SALES' ? '#4CAF50' : '#FF5252'
                                }}>
                                    {activeTab === 'SALES' ? '+' : '-'}{parseInt(item.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} style={{
            background: '#B71C1C', color: 'white', border: 'none', padding: 15, borderRadius: 15,
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
        }}>
            TUTUP PROFILE
        </button>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

// --- SUB COMPONENTS ---

const Badge = ({ text, color, bg, icon }) => (
    <div style={{
        background: bg, color: color, padding: '2px 8px', borderRadius: 5, 
        fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5
    }}>
        {icon && <i className={`fa-solid ${icon}`}></i>}
        {text}
    </div>
);

const StatBox = ({ label, value, icon, color }) => (
    <div style={{
        background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10,
        display: 'flex', alignItems: 'center', gap: 10
    }}>
        <div style={{color: color, fontSize: '1.5rem'}}><i className={`fa-solid ${icon}`}></i></div>
        <div>
            <div style={{color: '#aaa', fontSize: '0.7rem'}}>{label}</div>
            <div style={{color: 'white', fontWeight: 'bold', fontSize: '0.9rem'}}>{value}</div>
        </div>
    </div>
);

const TabButton = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} style={{
        flex: 1, background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none',
        padding: 15, color: isActive ? 'white' : '#666', fontWeight: 'bold', cursor: 'pointer',
        borderBottom: isActive ? '3px solid #00E5FF' : '3px solid transparent',
        transition: 'all 0.2s'
    }}>
        <i className={`fa-solid ${icon}`} style={{marginRight: 8}}></i>
        {label}
    </button>
);

export default ProfileModal;