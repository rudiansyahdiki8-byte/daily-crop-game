import { useState } from 'react';
import { bindUpline } from '../services/api'; // Pastikan path benar

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
      onRefresh(); // Refresh data user
      setFriendIdInput('');
    } catch (err) {
      alert(err.response?.data?.message || "Gagal Bind");
    } finally {
      setLoading(false);
    }
  };

  const copyRefLink = () => {
    // Format Link Telegram WebApp
    const link = `https://t.me/FarmBot?startapp=${user.id || 123456789}`;
    navigator.clipboard.writeText(link);
    alert("Link Undangan Disalin!");
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.95)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '90%', height: '80%', background: '#1b1b1b', 
        border: '1px solid #4CAF50', borderRadius: 15,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{padding: 20, background: '#111', borderBottom: '1px solid #333', textAlign:'center'}}>
           <div style={{fontSize:'3rem', marginBottom:5}}>🤝</div>
           <h2 style={{margin:0, color:'#4CAF50'}}>Undang Teman</h2>
           <p style={{color:'#888', fontSize:'0.8rem', margin:'5px 0 0'}}>Dapatkan 10% dari setiap penjualan teman!</p>
        </div>

        {/* CONTENT */}
        <div style={{flex:1, padding:20, overflowY:'auto'}}>
          
          {/* 1. STATISTIK */}
          <div style={{display:'flex', gap:10, marginBottom:20}}>
            <div style={{flex:1, background:'#222', padding:10, borderRadius:10, textAlign:'center'}}>
              <div style={{fontSize:'0.7rem', color:'#aaa'}}>Total Teman</div>
              <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'white'}}>{user?.friendsCount || 0}</div>
            </div>
            <div style={{flex:1, background:'#222', padding:10, borderRadius:10, textAlign:'center', border:'1px solid #4CAF50'}}>
              <div style={{fontSize:'0.7rem', color:'#aaa'}}>Komisi (PTS)</div>
              <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#FFC107'}}>{user?.affiliateEarnings || 0}</div>
            </div>
          </div>

          {/* 2. TOMBOL ACTION */}
          <div style={{background:'#222', padding:15, borderRadius:10, marginBottom:20}}>
             <label style={{fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:10}}>Link Referral Anda:</label>
             <button 
                onClick={copyRefLink}
                style={{
                  width:'100%', padding:12, background:'#2196F3', color:'white', 
                  border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer'
                }}
             >
                📄 SALIN LINK
             </button>
          </div>

          {/* 3. INPUT UPLINE (Hanya jika belum punya upline) */}
          {!user?.uplineId ? (
            <div style={{background:'#333', padding:15, borderRadius:10}}>
               <label style={{fontSize:'0.8rem', color:'#ccc', display:'block', marginBottom:10}}>Punya ID Teman?</label>
               <div style={{display:'flex', gap:10}}>
                 <input 
                   value={friendIdInput}
                   onChange={(e)=>setFriendIdInput(e.target.value)}
                   placeholder="Masukkan ID Pengundang"
                   style={{flex:1, padding:10, borderRadius:5, border:'none', background:'#fff', color:'#000'}}
                 />
                 <button 
                   onClick={handleBind}
                   disabled={loading}
                   style={{background:'#4CAF50', border:'none', color:'white', borderRadius:5, padding:'0 15px', fontWeight:'bold'}}
                 >
                   IKAT
                 </button>
               </div>
            </div>
          ) : (
            <div style={{textAlign:'center', fontSize:'0.8rem', color:'#666', marginTop:20}}>
               Anda diundang oleh: <span style={{color:'#fff'}}>{user.uplineId}</span>
            </div>
          )}

        </div>

        <button onClick={onClose} style={{padding:15, background:'#B71C1C', color:'white', border:'none', borderTop:'1px solid #555'}}>Tutup</button>
      </div>
    </div>
  );
};

export default FriendsModal;