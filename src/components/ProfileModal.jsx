import { useState } from 'react';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('INFO'); // 'INFO' or 'HISTORY'

  if (!isOpen) return null;

  // Format Tanggal
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
    });
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.95)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '90%', height: '80%', background: '#1a1a1a', 
        border: '1px solid #333', borderRadius: 15,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{padding: 20, background: '#111', borderBottom: '1px solid #333', textAlign:'center'}}>
           <div style={{fontSize:'3rem', marginBottom:10}}>👨‍🌾</div>
           <h2 style={{margin:0, color:'white'}}>{user?.username || 'Petani'}</h2>
           
           <div style={{display:'flex', marginTop:20, gap:10}}>
             <button onClick={()=>setActiveTab('INFO')} style={{flex:1, padding:10, background: activeTab==='INFO'?'#333':'transparent', border:'1px solid #555', color: activeTab==='INFO'?'#FFC107':'#888', borderRadius:5}}>Data Diri</button>
             <button onClick={()=>setActiveTab('HISTORY')} style={{flex:1, padding:10, background: activeTab==='HISTORY'?'#333':'transparent', border:'1px solid #555', color: activeTab==='HISTORY'?'#4CAF50':'#888', borderRadius:5}}>Riwayat</button>
           </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1, padding:20, overflowY:'auto'}}>
          
          {activeTab === 'INFO' && (
             <div style={{color:'#ccc'}}>
                <InfoRow label="User ID" value={user?.id || '-'} copy />
                <InfoRow label="Membership" value={user?.plan} color="#FFC107" />
                <InfoRow label="Total Saldo" value={`${user?.balance} PTS`} color="#4CAF50" bold />
                <InfoRow label="Gudang" value={`${Object.values(user?.inventory||{}).reduce((a,b)=>a+b,0)} / ${user?.storageLimit}`} />
                <InfoRow label="Total Penjualan" value={`${user?.totalSales || 0} PTS`} />
                <InfoRow label="Upline" value={user?.uplineId || 'Tidak ada'} />
             </div>
          )}

          {activeTab === 'HISTORY' && (
             <div>
                {(!user?.history || user.history.length === 0) ? (
                  <div style={{textAlign:'center', color:'#555', marginTop:30}}>Belum ada riwayat transaksi.</div>
                ) : (
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.8rem', color:'#ccc'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #555', color:'#888'}}>
                        <th style={{textAlign:'left', padding:8}}>Ket</th>
                        <th style={{textAlign:'right', padding:8}}>Jml (PTS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.history.map((log, idx) => (
                        <tr key={idx} style={{borderBottom:'1px solid #222'}}>
                          <td style={{padding:8}}>
                            <div style={{fontWeight:'bold', color: log.type==='SELL'?'#4CAF50':'#F44336'}}>
                              {log.type === 'SELL' ? 'PENJUALAN' : 'PENARIKAN'}
                            </div>
                            <div style={{fontSize:'0.7rem', color:'#666'}}>{formatDate(log.date)}</div>
                            <div style={{fontSize:'0.7rem', fontStyle:'italic'}}>{log.desc}</div>
                          </td>
                          <td style={{textAlign:'right', padding:8, fontWeight:'bold', color: log.amount>0 ? '#4CAF50':'#fff'}}>
                            {log.amount > 0 ? '+' : ''}{log.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
          )}

        </div>

        <button onClick={onClose} style={{padding:15, background:'#B71C1C', color:'white', border:'none', borderTop:'1px solid #555'}}>Tutup</button>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, color='white', bold, copy }) => (
  <div style={{background:'#222', padding:12, borderRadius:8, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
     <span style={{fontSize:'0.8rem', color:'#888'}}>{label}</span>
     <span 
       onClick={() => {
         if(copy) { navigator.clipboard.writeText(value); alert('Dicopy!'); }
       }}
       style={{color: color, fontWeight: bold?'bold':'normal', fontSize:'0.9rem', cursor: copy?'pointer':'default'}}
     >
       {value} {copy && '📋'}
     </span>
  </div>
);

export default ProfileModal;