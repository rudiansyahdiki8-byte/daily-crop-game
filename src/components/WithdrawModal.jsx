import { useState } from 'react';
import { GAME_CONFIG } from '../config/gameConstants';

const WithdrawModal = ({ isOpen, onClose, userBalance, onWithdraw, loading }) => {
  const [method, setMethod] = useState('FAUCETPAY'); // 'FAUCETPAY' or 'DIRECT'
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!amount || !address) return alert("Isi semua data!");
    onWithdraw(amount, address, method); // Kirim Method juga
  };

  // Kalkulasi Fee Real-time
  const feePct = method === 'FAUCETPAY' ? 0 : (GAME_CONFIG.WITHDRAW.FEE_DIRECT || 0.05);
  const fee = Math.floor((parseInt(amount) || 0) * feePct);
  const receive = (parseInt(amount) || 0) - fee;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '85%', background: '#1a1a1a', border: '1px solid #4CAF50', borderRadius: 15,
        padding: 0, overflow: 'hidden'
      }}>
        
        {/* HEADER TABS */}
        <div style={{display:'flex'}}>
          <button 
            onClick={() => setMethod('FAUCETPAY')}
            style={{
              flex:1, padding:15, border:'none', fontWeight:'bold',
              background: method==='FAUCETPAY' ? '#1a1a1a' : '#111',
              color: method==='FAUCETPAY' ? '#2196F3' : '#666',
              borderBottom: method==='FAUCETPAY' ? '2px solid #2196F3' : '1px solid #333'
            }}
          >
            FAUCETPAY (0%)
          </button>
          <button 
            onClick={() => setMethod('DIRECT')}
            style={{
              flex:1, padding:15, border:'none', fontWeight:'bold',
              background: method==='DIRECT' ? '#1a1a1a' : '#111',
              color: method==='DIRECT' ? '#FFC107' : '#666',
              borderBottom: method==='DIRECT' ? '2px solid #FFC107' : '1px solid #333'
            }}
          >
            DIRECT (5%)
          </button>
        </div>

        <div style={{padding:20}}>
            {/* Info Saldo */}
            <div style={{textAlign:'center', marginBottom:20}}>
              <span style={{color:'#888', fontSize:'0.8rem'}}>Saldo Tersedia</span>
              <div style={{color:'white', fontSize:'1.8rem', fontWeight:'bold'}}>{userBalance} PTS</div>
            </div>

            {/* Form */}
            <div style={{marginBottom:15}}>
              <label style={{display:'block', color:'#ccc', fontSize:'0.8rem', marginBottom:5}}>
                 {method === 'FAUCETPAY' ? 'Email FaucetPay (Wajib Valid)' : 'Alamat Wallet USDT (BEP20)'}
              </label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={method === 'FAUCETPAY' ? "email@contoh.com" : "0x..."}
                style={{width:'93%', padding:12, background:'#222', border:'1px solid #555', color:'white', borderRadius:5}}
              />
              {method === 'FAUCETPAY' && <div style={{fontSize:'0.7rem', color:'#F44336', marginTop:5}}>*Email akan terkunci permanen setelah sukses.</div>}
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', color:'#ccc', fontSize:'0.8rem', marginBottom:5}}>Jumlah PTS</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min 100"
                style={{width:'93%', padding:12, background:'#222', border:'1px solid #555', color:'white', borderRadius:5}}
              />
            </div>

            {/* Ringkasan */}
            <div style={{fontSize:'0.8rem', color:'#aaa', marginBottom:20, borderTop:'1px dashed #555', paddingTop:10}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span>Metode</span>
                <span style={{color: method==='FAUCETPAY'?'#2196F3':'#FFC107'}}>{method}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span>Biaya Admin</span>
                <span>{fee} PTS ({feePct*100}%)</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:5, color:'white', fontSize:'1rem'}}>
                <span>Diterima Bersih</span>
                <span style={{fontWeight:'bold'}}>{receive > 0 ? receive : 0} PTS</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || receive <= 0}
              style={{
                width:'100%', padding:15, background: loading ? '#555' : '#4CAF50', 
                color:'white', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer'
              }}
            >
              {loading ? 'Memproses...' : 'CAIRKAN SEKARANG'}
            </button>

            <button onClick={onClose} style={{width:'100%', marginTop:10, background:'transparent', border:'none', color:'#888', cursor:'pointer'}}>Batal</button>
        </div>

      </div>
    </div>
  );
};

export default WithdrawModal;