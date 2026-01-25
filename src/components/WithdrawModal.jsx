import { useState } from 'react';
import { requestDeposit } from '../services/api'; 
import { GAME_CONFIG } from '../config/gameConstants';

// ALAMAT WALLET ADMIN (Ganti dengan alamat USDT TRC20 asli Anda)
const ADMIN_WALLET = "TLsV52sRDL79HXGGm9ywbKqksC4LpWpY7k"; 

const WithdrawModal = ({ isOpen, onClose, userBalance, onWithdraw, loading, userId }) => {
  const [activeTab, setActiveTab] = useState('DEPOSIT'); // Default tab
  
  // STATE DEPOSIT
  const [depAmount, setDepAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [depLoading, setDepLoading] = useState(false);

  // STATE WITHDRAW
  const [wdMethod, setWdMethod] = useState('FAUCETPAY'); // 'FAUCETPAY' or 'DIRECT'
  const [wdAmount, setWdAmount] = useState('');
  const [wdAddress, setWdAddress] = useState('');

  if (!isOpen) return null;

  // --- LOGIC DEPOSIT ---
  const handleDeposit = async () => {
    if (!userId) return alert("Error: User ID tidak ditemukan. Refresh halaman.");
    if (!depAmount || !txHash) return alert("Harap isi Jumlah & Bukti TxID!");
    
    try {
      setDepLoading(true);
      // Kirim request ke backend
      await requestDeposit(userId, depAmount, txHash, 'USDT'); 
      alert("✅ Permintaan Deposit Terkirim!\nAdmin akan memverifikasi dalam 1x24 jam.");
      setDepAmount('');
      setTxHash('');
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || "Gagal mengirim request deposit.");
    } finally {
      setDepLoading(false);
    }
  };

  // --- LOGIC WITHDRAW ---
  const handleWithdrawSubmit = () => {
    if (!wdAmount || !wdAddress) return alert("Harap lengkapi data withdraw!");
    // Panggil fungsi handleWithdraw di App.jsx
    onWithdraw(wdAmount, wdAddress, wdMethod);
  };

  // Kalkulasi Fee Withdraw Real-time
  const feePct = wdMethod === 'FAUCETPAY' ? 0 : (GAME_CONFIG.WITHDRAW?.FEE_DIRECT || 0.05);
  const fee = Math.floor((parseInt(wdAmount) || 0) * feePct);
  const receive = (parseInt(wdAmount) || 0) - fee;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '90%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 15,
        overflow: 'hidden', boxShadow: '0 0 20px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', maxHeight:'90vh'
      }}>
        
        {/* HEADER TABS */}
        <div style={{display:'flex'}}>
          <button 
            onClick={() => setActiveTab('DEPOSIT')}
            style={{
              flex:1, padding:15, border:'none', fontWeight:'bold', cursor:'pointer',
              background: activeTab==='DEPOSIT' ? '#1a1a1a' : '#111',
              color: activeTab==='DEPOSIT' ? '#4CAF50' : '#666',
              borderBottom: activeTab==='DEPOSIT' ? '2px solid #4CAF50' : '1px solid #333'
            }}
          >
            <i className="fa-solid fa-arrow-down"></i> DEPOSIT
          </button>
          <button 
            onClick={() => setActiveTab('WITHDRAW')}
            style={{
              flex:1, padding:15, border:'none', fontWeight:'bold', cursor:'pointer',
              background: activeTab==='WITHDRAW' ? '#1a1a1a' : '#111',
              color: activeTab==='WITHDRAW' ? '#F44336' : '#666',
              borderBottom: activeTab==='WITHDRAW' ? '2px solid #F44336' : '1px solid #333'
            }}
          >
            <i className="fa-solid fa-arrow-up"></i> WITHDRAW
          </button>
        </div>

        <div style={{padding:20, overflowY:'auto'}}>
            
            {/* INFO SALDO USER */}
            <div style={{textAlign:'center', marginBottom:20, background:'#222', padding:10, borderRadius:10}}>
              <div style={{fontSize:'0.7rem', color:'#888'}}>TOTAL BALANCE</div>
              <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{userBalance.toLocaleString()} PTS</div>
            </div>

            {/* --- KONTEN DEPOSIT --- */}
            {activeTab === 'DEPOSIT' && (
              <div style={{animation:'fadeIn 0.3s'}}>
                <div style={{fontSize:'0.8rem', color:'#aaa', marginBottom:10, textAlign:'center'}}>
                   Transfer USDT (TRC20) ke Admin:
                </div>
                
                {/* Copy Address */}
                <div style={{
                    background:'#333', padding:10, borderRadius:5, marginBottom:15, 
                    display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed #555'
                }}>
                   <span style={{fontSize:'0.7rem', color:'var(--neon-gold)', wordBreak:'break-all'}}>{ADMIN_WALLET}</span>
                   <button onClick={() => {navigator.clipboard.writeText(ADMIN_WALLET); alert("Alamat disalin!")}} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>
                     <i className="fa-regular fa-copy"></i>
                   </button>
                </div>

                <label style={{fontSize:'0.7rem', color:'#ccc'}}>Jumlah Top Up</label>
                <input type="number" placeholder="Contoh: 1000" value={depAmount} onChange={e=>setDepAmount(e.target.value)} 
                       style={{width:'100%', padding:12, marginBottom:10, background:'#222', border:'1px solid #444', color:'white', borderRadius:5}} />
                
                <label style={{fontSize:'0.7rem', color:'#ccc'}}>TxID / Hash Transaksi</label>
                <input type="text" placeholder="Tempel bukti transfer disini..." value={txHash} onChange={e=>setTxHash(e.target.value)} 
                       style={{width:'100%', padding:12, marginBottom:20, background:'#222', border:'1px solid #444', color:'white', borderRadius:5}} />

                <button onClick={handleDeposit} disabled={depLoading || loading} style={{
                   width:'100%', padding:15, background:'linear-gradient(45deg, #4CAF50, #8BC34A)', 
                   color:'black', fontWeight:'bold', border:'none', borderRadius:8, cursor:'pointer'
                }}>
                   {depLoading ? 'Mengirim...' : 'KONFIRMASI DEPOSIT'}
                </button>
              </div>
            )}

            {/* --- KONTEN WITHDRAW --- */}
            {activeTab === 'WITHDRAW' && (
               <div style={{animation:'fadeIn 0.3s'}}>
                  
                  {/* Pilihan Metode */}
                  <div style={{display:'flex', gap:10, marginBottom:15}}>
                    <button onClick={()=>setWdMethod('FAUCETPAY')} style={{flex:1, padding:10, background: wdMethod==='FAUCETPAY'?'#2196F3':'#333', border:'none', borderRadius:5, color:'white', fontSize:'0.7rem', fontWeight:'bold'}}>
                       FAUCETPAY (0%)
                    </button>
                    <button onClick={()=>setWdMethod('DIRECT')} style={{flex:1, padding:10, background: wdMethod==='DIRECT'?'#FFC107':'#333', border:'none', borderRadius:5, color: wdMethod==='DIRECT'?'black':'white', fontSize:'0.7rem', fontWeight:'bold'}}>
                       DIRECT (5%)
                    </button>
                  </div>

                  <label style={{fontSize:'0.7rem', color:'#ccc'}}>
                    {wdMethod === 'FAUCETPAY' ? 'Email FaucetPay' : 'Alamat Wallet (BEP20/TRC20)'}
                  </label>
                  <input type="text" placeholder={wdMethod==='FAUCETPAY' ? "email@contoh.com" : "0x..."} value={wdAddress} onChange={e=>setWdAddress(e.target.value)} 
                       style={{width:'100%', padding:12, marginBottom:10, background:'#222', border:'1px solid #444', color:'white', borderRadius:5}} />

                  <label style={{fontSize:'0.7rem', color:'#ccc'}}>Jumlah Withdraw</label>
                  <input type="number" placeholder="Min 100 PTS" value={wdAmount} onChange={e=>setWdAmount(e.target.value)} 
                       style={{width:'100%', padding:12, marginBottom:10, background:'#222', border:'1px solid #444', color:'white', borderRadius:5}} />

                  {/* Ringkasan */}
                  <div style={{fontSize:'0.8rem', color:'#aaa', marginBottom:20, borderTop:'1px dashed #555', paddingTop:10}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <span>Biaya Admin</span>
                        <span>{fee} PTS</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:5, color:'white'}}>
                        <span>Diterima Bersih</span>
                        <span style={{fontWeight:'bold'}}>{receive > 0 ? receive : 0} PTS</span>
                    </div>
                  </div>

                  <button onClick={handleWithdrawSubmit} disabled={loading || receive <= 0} style={{
                     width:'100%', padding:15, background: loading ? '#555' : '#F44336', 
                     color:'white', fontWeight:'bold', border:'none', borderRadius:8, cursor:'pointer'
                  }}>
                     {loading ? 'Memproses...' : 'CAIRKAN SEKARANG'}
                  </button>
               </div>
            )}

            <button onClick={onClose} style={{width:'100%', marginTop:15, background:'transparent', border:'none', color:'#666', cursor:'pointer'}}>Tutup</button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;