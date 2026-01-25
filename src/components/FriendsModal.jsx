import React, { useState } from 'react';
import { bindUpline } from '../services/api'; 

const FriendsModal = ({ isOpen, onClose, user, onRefresh }) => {
  const [friendIdInput, setFriendIdInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleBind = async () => {
    if (!friendIdInput) return;
    try {
      setLoading(true);
      await bindUpline(user.id, friendIdInput);
      alert("Berhasil mengikat teman!");
      onRefresh(); 
      setFriendIdInput('');
    } catch (err) {
      alert(err.response?.data?.message || "Gagal Bind");
    } finally {
      setLoading(false);
    }
  };

  const copyRefLink = () => {
    // UPDATED: Link mengarah ke Bot Daily_Cropbot/play
    const link = `https://t.me/Daily_Cropbot/play?startapp=${user?.id || 123456}`;
    navigator.clipboard.writeText(link);
    alert("Link Undangan Disalin!");
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1200,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '85%', maxWidth: '400px',
        background: 'linear-gradient(160deg, #1e2a38 0%, #16213e 100%)', 
        borderRadius: 25, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', 
        boxShadow: '0 0 40px rgba(0,0,0,0.6)'
      }}>
        
        {/* --- HEADER --- */}
        <div style={{
            padding: '25px 20px 15px', textAlign: 'center', 
            background: 'linear-gradient(180deg, rgba(76, 175, 80, 0.1) 0%, rgba(0,0,0,0) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
           <div style={{
               width: 70, height: 70, margin: '0 auto 10px', borderRadius: '50%',
               background: 'linear-gradient(135deg, #66BB6A, #43A047)',
               display: 'flex', justifyContent: 'center', alignItems: 'center',
               boxShadow: '0 0 15px rgba(76, 175, 80, 0.4)'
           }}>
                <i className="fa-solid fa-users-viewfinder fa-2x" style={{color:'white'}}></i>
           </div>
           <h2 style={{margin:0, color: '#66BB6A', textTransform: 'uppercase', letterSpacing: 1, fontSize:'1.2rem'}}>
               Affiliate Area
           </h2>
           <p style={{fontSize: '0.8rem', color: '#aaa', marginTop: 5}}>
              Dapatkan <span style={{color:'#FFD700', fontWeight:'bold'}}>10% Komisi</span> dari penjualan teman!
           </p>
        </div>

        {/* --- CONTENT SCROLLABLE --- */}
        <div style={{flex: 1, padding: 20, overflowY: 'auto'}}>
          
          {/* 1. KARTU STATISTIK */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20}}>
            <StatBox label="Total Teman" value={user?.friendsCount || 0} icon="fa-user-group" color="#4CAF50" />
            <StatBox label="Cuan (PTS)" value={user?.affiliateEarnings?.toLocaleString() || 0} icon="fa-sack-dollar" color="#FFC107" />
          </div>

          {/* 2. AREA LINK REFERRAL */}
          <div style={{
              background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, 
              border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20
          }}>
             <div style={{fontSize:'0.75rem', color:'#888', marginBottom:8, display:'flex', alignItems:'center', gap:5}}>
                <i className="fa-solid fa-link"></i> Link Referral Anda:
             </div>
             
             <div style={{display:'flex', gap:10}}>
                 <div style={{
                     flex:1, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px',
                     fontSize: '0.8rem', color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                     border: '1px dashed #444'
                 }}>
                     t.me/Daily_Cropbot/play?startapp={user?.id}
                 </div>
                 <button onClick={copyRefLink} style={{
                     background: '#2196F3', color: 'white', border: 'none', borderRadius: 8, 
                     width: 40, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center'
                 }}>
                     <i className="fa-regular fa-copy"></i>
                 </button>
             </div>
             <div style={{fontSize:'0.65rem', color:'#555', marginTop:5, fontStyle:'italic'}}>
                 *Klik tombol biru untuk menyalin link
             </div>
          </div>

          {/* 3. INPUT UPLINE (Hanya jika belum punya) */}
          {!user?.uplineId ? (
            <div style={{
                background: 'rgba(76, 175, 80, 0.1)', padding: 15, borderRadius: 15, 
                border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
               <div style={{fontSize:'0.8rem', color:'#66BB6A', fontWeight:'bold', marginBottom:10}}>
                   <i className="fa-solid fa-handshake"></i> Masukkan ID Teman
               </div>
               <div style={{display:'flex', gap:10}}>
                 <input 
                   value={friendIdInput}
                   onChange={(e)=>setFriendIdInput(e.target.value)}
                   placeholder="Contoh: 123456"
                   style={{
                       flex:1, padding:10, borderRadius:8, border:'none', 
                       background:'rgba(0,0,0,0.4)', color:'white', outline:'none', fontSize:'0.9rem'
                   }}
                 />
                 <button 
                   onClick={handleBind}
                   disabled={loading || !friendIdInput}
                   style={{
                       background: friendIdInput ? '#4CAF50' : '#333', color: 'white', border: 'none', 
                       borderRadius: 8, padding:'0 15px', fontWeight:'bold', cursor: friendIdInput ? 'pointer' : 'default',
                       transition: 'all 0.2s'
                   }}
                 >
                   {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'IKAT'}
                 </button>
               </div>
            </div>
          ) : (
            <div style={{
                textAlign:'center', padding: 15, background: 'rgba(255,255,255,0.03)', borderRadius: 15
            }}>
               <div style={{fontSize:'0.8rem', color:'#888'}}>Anda diundang oleh ID:</div>
               <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#fff', marginTop:5}}>
                   {user.uplineId} <i className="fa-solid fa-circle-check" style={{color:'#4CAF50', marginLeft:5}}></i>
               </div>
            </div>
          )}

        </div>

        {/* --- FOOTER --- */}
        <div style={{padding: 20}}>
            <button onClick={onClose} style={{
                width: '100%', padding: 12, borderRadius: 12,
                background: '#B71C1C', color: 'white', fontWeight: 'bold', border: 'none',
                boxShadow: '0 5px 15px rgba(183, 28, 28, 0.3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
                <i className="fa-solid fa-xmark"></i> TUTUP
            </button>
        </div>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

const StatBox = ({ label, value, icon, color }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}20`
    }}>
        <div style={{fontSize: '1.2rem', marginBottom: 5, color: color}}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'white'}}>{value}</div>
        <div style={{fontSize: '0.65rem', color: '#aaa'}}>{label}</div>
    </div>
);

export default FriendsModal;