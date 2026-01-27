import React, { useState } from 'react';
import { PLANS } from '../config/gameConstants';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('HISTORY'); // 'HISTORY' or 'WITHDRAW'

  if (!isOpen) return null;

  // --- DATA HELPER ---
  const history = user?.history || [];
  
  // Filter History
  const filteredHistory = history.filter(item => {
      if (activeTab === 'HISTORY') return item.type !== 'WITHDRAW'; // Jual, Beli, Upgrade, Spin masuk sini
      if (activeTab === 'WITHDRAW') return item.type === 'WITHDRAW';
      return false;
  }).slice(0, 10); // Ambil 10 Terakhir

  const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  // Plan Details (Warna & Nama)
  const currentPlan = PLANS[user?.plan] || PLANS.FREE;
  const planColors = {
      FREE: '#B0BEC5',
      MORTGAGE: '#29B6F6',
      TENANT: '#AB47BC',
      OWNER: '#FFD700'
  };
  const themeColor = planColors[currentPlan.id] || '#fff';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', zIndex: 1200,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '90%', maxHeight: '90%', maxWidth:'420px', display: 'flex', flexDirection: 'column', gap: 15
      }}>

        {/* ================= CARD 1: CYBER IDENTITY ================= */}
        <div style={{
            background: `linear-gradient(160deg, #101522 0%, #050505 100%)`,
            borderRadius: 20, padding: 25, border: `1px solid ${themeColor}40`,
            boxShadow: `0 0 20px ${themeColor}20`, position: 'relative', overflow: 'hidden'
        }}>
            {/* Background Glow */}
            <div style={{
                position:'absolute', top:-30, right:-30, width:120, height:120, 
                background:`radial-gradient(circle, ${themeColor}40 0%, transparent 70%)`, borderRadius:'50%', filter:'blur(20px)'
            }}></div>

            {/* Header: Avatar & Name */}
            <div style={{display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20, position:'relative', zIndex:2}}>
                <div style={{
                    width: 70, height: 70, borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${themeColor}, #000)`,
                    padding: 2, // Border width
                    boxShadow: `0 0 15px ${themeColor}60`
                }}>
                    <div style={{
                        width:'100%', height:'100%', borderRadius:'50%', background:'#111', 
                        display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                        <i className="fa-solid fa-user-astronaut fa-2x" style={{color: 'white'}}></i>
                    </div>
                </div>
                
                <div>
                    <div style={{fontSize: '0.7rem', color: '#888', letterSpacing:1}}>FARMER ID: {user?.telegramId || user?.id}</div>
                    <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'white'}}>
                        {user?.username || 'Unknown'}
                    </div>
                    {/* PLAN BADGE */}
                    <div style={{
                        display:'inline-block', marginTop:5, padding:'2px 8px', borderRadius:4,
                        background: themeColor, color:'black', fontSize:'0.7rem', fontWeight:'bold',
                        boxShadow: `0 0 10px ${themeColor}80`
                    }}>
                        {currentPlan.id} MEMBER
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, position:'relative', zIndex:2}}>
                <StatBox label="BALANCE" value={user?.balance?.toLocaleString()} icon="fa-wallet" color="#fff" />
                <StatBox label="TOTAL EARNED" value={user?.totalSales?.toLocaleString() || 0} icon="fa-sack-dollar" color="#4CAF50" />
            </div>

            {/* AFFILIATE SECTION (BARU) */}
            <div style={{
                marginTop:15, padding:10, borderRadius:10, 
                background:'rgba(255,255,255,0.05)', border:'1px dashed rgba(255,255,255,0.1)',
                display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
                 <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <div style={{width:30, height:30, borderRadius:8, background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <i className="fa-solid fa-users" style={{color:themeColor}}></i>
                    </div>
                    <div>
                        <div style={{fontSize:'0.65rem', color:'#aaa'}}>AFFILIATE INCOME</div>
                        <div style={{fontSize:'0.9rem', color:themeColor, fontWeight:'bold'}}>
                             +{ (user?.affiliateEarnings || 0).toLocaleString() }
                        </div>
                    </div>
                 </div>
                 <div style={{textAlign:'right'}}>
                     <div style={{fontSize:'0.65rem', color:'#aaa'}}>UPLINE</div>
                     <div style={{fontSize:'0.8rem', color:'white'}}>
                         {user?.uplineId ? 'LINKED ✅' : 'NONE'}
                     </div>
                 </div>
            </div>
        </div>


        {/* ================= CARD 2: TRANSACTION HISTORY ================= */}
        <div style={{
            background: '#121212', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            {/* Tab Header */}
            <div style={{display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <TabButton 
                    label="ACTIVITY" icon="fa-list" 
                    isActive={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} 
                />
                <TabButton 
                    label="WITHDRAW" icon="fa-money-bill-transfer" 
                    isActive={activeTab === 'WITHDRAW'} onClick={() => setActiveTab('WITHDRAW')} 
                />
            </div>

            {/* List Content */}
            <div style={{flex: 1, overflowY: 'auto', padding: 15}}>
                {filteredHistory.length === 0 ? (
                    <div style={{textAlign: 'center', color: '#555', marginTop: 40, fontStyle:'italic'}}>
                        No data available.
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {filteredHistory.map((item, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                    <div style={{
                                        width:6, height:30, borderRadius:5, 
                                        background: item.type === 'SELL' ? '#4CAF50' : (item.type === 'WITHDRAW' ? '#F44336' : '#2196F3')
                                    }}></div>
                                    <div>
                                        <div style={{fontWeight: 'bold', color: 'white', fontSize: '0.8rem'}}>
                                            {item.desc || item.type}
                                        </div>
                                        <div style={{fontSize: '0.65rem', color: '#666'}}>
                                            {formatDate(item.date)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 'bold', fontSize:'0.9rem',
                                    color: item.type === 'WITHDRAW' || item.type === 'BUY' ? '#F44336' : '#4CAF50'
                                }}>
                                    {item.type === 'WITHDRAW' || item.type === 'BUY' ? '-' : '+'}{parseInt(item.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} style={{
            background: 'transparent', color: '#666', border: '1px solid #333', padding: 12, borderRadius: 15,
            fontSize: '0.9rem', cursor: 'pointer'
        }}>
            CLOSE
        </button>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatBox = ({ label, value, icon, color }) => (
    <div style={{
        background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 10,
        display: 'flex', alignItems: 'center', gap: 12, border:'1px solid rgba(255,255,255,0.05)'
    }}>
        <div style={{color: color, fontSize: '1.2rem'}}><i className={`fa-solid ${icon}`}></i></div>
        <div>
            <div style={{color: '#888', fontSize: '0.6rem', letterSpacing:0.5}}>{label}</div>
            <div style={{color: 'white', fontWeight: 'bold', fontSize: '1rem'}}>{value}</div>
        </div>
    </div>
);

const TabButton = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} style={{
        flex: 1, background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none',
        padding: '12px 0', color: isActive ? 'white' : '#666', fontWeight: 'bold', cursor: 'pointer',
        borderBottom: isActive ? '2px solid #00E5FF' : '2px solid transparent', fontSize:'0.8rem',
        transition: 'all 0.2s'
    }}>
        <i className={`fa-solid ${icon}`} style={{marginRight: 6}}></i>
        {label}
    </button>
);

export default ProfileModal;