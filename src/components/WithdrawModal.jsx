import React, { useState, useEffect } from 'react';
import { requestDeposit } from '../services/api'; 

// CONFIG HARGA PASAR (Fallback jika API Gagal)
const FALLBACK_PRICES = {
  USDT: 1, 
  TON: 5.2,
  TRX: 0.12,
  DOGE: 0.15,
  LTC: 70
};

// KONVERSI GAME POINT KE USD
const RATE_PTS_TO_USD = 0.0001; // 100 PTS = $0.01

const WithdrawModal = ({ isOpen, onClose, userBalance, onWithdraw, loading, userId }) => {
  const [activeTab, setActiveTab] = useState('WITHDRAW'); 
  
  // STATE DATA
  const [cryptoPrices, setCryptoPrices] = useState(FALLBACK_PRICES);
  
  // FORM WITHDRAW
  const [wdMethod, setWdMethod] = useState('FAUCETPAY'); 
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [wdAmount, setWdAmount] = useState('');
  const [wdAddress, setWdAddress] = useState('');

  // FORM DEPOSIT
  const [depAmount, setDepAmount] = useState('');
  const [txHash, setTxHash] = useState('');

  // --- FETCH HARGA CRYPTO LIVE ---
  useEffect(() => {
    if (isOpen) {
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,the-open-network,tron,dogecoin,litecoin&vs_currencies=usd')
        .then(res => res.json())
        .then(data => {
          setCryptoPrices({
            USDT: 1, 
            TON: data['the-open-network']?.usd || FALLBACK_PRICES.TON,
            TRX: data['tron']?.usd || FALLBACK_PRICES.TRX,
            DOGE: data['dogecoin']?.usd || FALLBACK_PRICES.DOGE,
            LTC: data['litecoin']?.usd || FALLBACK_PRICES.LTC
          });
        })
        .catch(() => console.log("Gagal fetch harga, pakai fallback"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIC HITUNG WITHDRAW ---
  const feePct = wdMethod === 'FAUCETPAY' ? 0 : 0.10; 
  const inputVal = parseInt(wdAmount) || 0;
  const feeVal = Math.floor(inputVal * feePct);
  const netPts = inputVal - feeVal;
  
  // Konversi ke Crypto
  const usdValue = netPts * RATE_PTS_TO_USD;
  const cryptoPrice = cryptoPrices[selectedCrypto] || 1;
  const cryptoReceive = (usdValue / cryptoPrice).toFixed(6);

  // --- HANDLERS ---
  const handleWdSubmit = () => {
    if (!wdAmount || !wdAddress) return alert("Data belum lengkap!");
    if (inputVal > userBalance) return alert("Saldo tidak cukup!");
    onWithdraw(wdAmount, wdAddress, wdMethod, selectedCrypto);
  };

  const handleDepSubmit = async () => {
     if (!depAmount || !txHash) return alert("Isi jumlah dan TxID!");
     try {
       await requestDeposit(userId, depAmount, txHash, 'USDT'); 
       alert("Deposit Request Terkirim!");
       onClose();
     } catch(e) { alert("Gagal request"); }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1200,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '85%', maxWidth: '400px', maxHeight: '90vh',
        background: 'linear-gradient(160deg, #1e2a38 0%, #16213e 100%)', 
        borderRadius: 25, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', 
        boxShadow: '0 0 40px rgba(0,0,0,0.6)'
      }}>
        
        {/* --- HEADER TABS --- */}
        <div style={{display:'flex', background:'rgba(0,0,0,0.2)'}}>
           <TabBtn label="WITHDRAW" icon="fa-arrow-up" active={activeTab==='WITHDRAW'} onClick={()=>setActiveTab('WITHDRAW')} color="#F44336"/>
           <TabBtn label="DEPOSIT" icon="fa-arrow-down" active={activeTab==='DEPOSIT'} onClick={()=>setActiveTab('DEPOSIT')} color="#4CAF50"/>
        </div>

        {/* --- CONTENT AREA --- */}
        <div style={{flex:1, overflowY:'auto', padding:20}}>
            
            {/* SALDO CARD */}
            <div style={{
                background:'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                borderRadius:15, padding:15, textAlign:'center', marginBottom:20,
                boxShadow:'0 5px 15px rgba(255, 215, 0, 0.2)'
            }}>
                <div style={{fontSize:'0.75rem', color:'#000', fontWeight:'bold', opacity:0.7}}>AVAILABLE BALANCE</div>
                <div style={{fontSize:'1.8rem', fontWeight:'900', color:'#000', textShadow:'0 1px 0 rgba(255,255,255,0.4)'}}>
                    {userBalance.toLocaleString()} PTS
                </div>
                <div style={{fontSize:'0.7rem', color:'#000', marginTop:2}}>
                    ≈ ${(userBalance * RATE_PTS_TO_USD).toFixed(2)} USD
                </div>
            </div>

            {/* ====== TAB WITHDRAW ====== */}
            {activeTab === 'WITHDRAW' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                  
                  {/* 1. PILIH METHOD */}
                  <div>
                      <label style={labelStyle}>Metode Penarikan</label>
                      <div style={{display:'flex', gap:10}}>
                          <MethodBtn 
                              label="FAUCETPAY" sub="Instant (Fee 0%)" icon="fa-bolt" 
                              active={wdMethod==='FAUCETPAY'} onClick={()=>setWdMethod('FAUCETPAY')} 
                          />
                          <MethodBtn 
                              label="DIRECT" sub="Manual (Fee 10%)" icon="fa-wallet" 
                              active={wdMethod==='DIRECT'} onClick={()=>setWdMethod('DIRECT')} 
                          />
                      </div>
                  </div>

                  {/* 2. PILIH COIN */}
                  <div>
                      <label style={labelStyle}>Pilih Koin</label>
                      <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:5}}>
                          {['USDT','TON','TRX','DOGE','LTC'].map(c => (
                              <CoinBtn key={c} name={c} active={selectedCrypto===c} onClick={()=>setSelectedCrypto(c)} />
                          ))}
                      </div>
                  </div>

                  {/* 3. INPUT ADDRESS */}
                  <div>
                      <label style={labelStyle}>
                          {wdMethod === 'FAUCETPAY' ? 'Email FaucetPay' : `Alamat Wallet ${selectedCrypto}`}
                      </label>
                      <input 
                          value={wdAddress} onChange={e=>setWdAddress(e.target.value)}
                          placeholder={wdMethod === 'FAUCETPAY' ? 'nama@email.com' : '0x...'}
                          style={inputStyle}
                      />
                      {wdMethod === 'FAUCETPAY' && (
                          <div style={{fontSize:'0.6rem', color:'#F44336', marginTop:5}}>
                             *Email akan terkunci otomatis setelah sukses WD pertama.
                          </div>
                      )}
                  </div>

                  {/* 4. INPUT AMOUNT (DENGAN TOMBOL MAX) */}
                  <div>
                      <label style={labelStyle}>Jumlah (PTS)</label>
                      <div style={{position:'relative'}}>
                          <input 
                              type="number" value={wdAmount} onChange={e=>setWdAmount(e.target.value)}
                              placeholder="Min 100 / 1000"
                              style={{...inputStyle, paddingRight: 60}} // Kasih ruang buat tombol MAX
                          />
                          <button 
                              onClick={() => setWdAmount(userBalance)}
                              style={{
                                  position:'absolute', right:5, top:5, bottom:5,
                                  background:'rgba(255,255,255,0.1)', border:'none',
                                  color:'#4CAF50', borderRadius:8, padding:'0 10px',
                                  fontWeight:'bold', fontSize:'0.7rem', cursor:'pointer'
                              }}
                          >
                              MAX
                          </button>
                      </div>
                  </div>

                  {/* 5. PREVIEW BOX (REALTIME) */}
                  <div style={{
                      background:'rgba(255,255,255,0.05)', borderRadius:12, padding:15,
                      border:'1px solid rgba(255,255,255,0.1)'
                  }}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#aaa', marginBottom:5}}>
                          <span>Fee ({feePct*100}%)</span>
                          <span>- {feeVal} PTS</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <span style={{fontSize:'0.9rem', color:'white'}}>Terima Bersih:</span>
                          <div style={{textAlign:'right'}}>
                              <div style={{color:'#4CAF50', fontWeight:'bold', fontSize:'1.1rem'}}>
                                  {cryptoReceive} {selectedCrypto}
                              </div>
                              <div style={{fontSize:'0.65rem', color:'#666'}}>
                                  Rate: 1 {selectedCrypto} = ${cryptoPrices[selectedCrypto]}
                              </div>
                          </div>
                      </div>
                  </div>

                  <button onClick={handleWdSubmit} disabled={loading} style={actionBtnStyle}>
                      {loading ? 'MEMPROSES...' : 'TARIK SEKARANG'}
                  </button>
              </div>
            )}

            {/* ====== TAB DEPOSIT ====== */}
            {activeTab === 'DEPOSIT' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                   <div style={{background:'rgba(76, 175, 80, 0.1)', padding:15, borderRadius:12, border:'1px solid rgba(76, 175, 80, 0.3)'}}>
                       <div style={{fontSize:'0.8rem', color:'#aaa', marginBottom:5}}>Alamat Deposit (USDT TRC20):</div>
                       <div style={{color:'white', fontWeight:'bold', wordBreak:'break-all', fontSize:'0.9rem'}}>TLsV52sRDL79HXGGm9ywbKqksC4LpWpY7k</div>
                   </div>
                   
                   <div>
                      <label style={labelStyle}>Pilih Nominal / Manual</label>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10}}>
                          {[1000, 5000, 10000].map(amt => (
                              <button key={amt} onClick={()=>setDepAmount(amt)} style={{
                                  background: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                                  color:'white', padding:8, borderRadius:8, cursor:'pointer'
                              }}>{amt}</button>
                          ))}
                      </div>
                      <input type="number" placeholder="Masukkan jumlah manual..." value={depAmount} onChange={e=>setDepAmount(e.target.value)} style={inputStyle} />
                   </div>

                   <div>
                      <label style={labelStyle}>TxID (Bukti Transfer)</label>
                      <input type="text" placeholder="Hash Transaksi..." value={txHash} onChange={e=>setTxHash(e.target.value)} style={inputStyle} />
                   </div>

                   <button onClick={handleDepSubmit} style={{...actionBtnStyle, background:'linear-gradient(45deg, #4CAF50, #8BC34A)'}}>
                       KONFIRMASI DEPOSIT
                   </button>
              </div>
            )}

        </div>

        {/* FOOTER */}
        <button onClick={onClose} style={{
            padding:15, background:'#151515', color:'#888', border:'none', cursor:'pointer', borderTop:'1px solid #222'
        }}>
            BATAL
        </button>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

// --- SUB COMPONENTS & STYLES ---

const TabBtn = ({ label, icon, active, onClick, color }) => (
    <button onClick={onClick} style={{
        flex:1, padding:15, background: active ? 'rgba(255,255,255,0.05)' : 'transparent', border:'none',
        color: active ? color : '#666', borderBottom: active ? `3px solid ${color}` : '3px solid transparent',
        fontWeight:'bold', cursor:'pointer', transition:'all 0.2s'
    }}>
        <i className={`fa-solid ${icon}`} style={{marginRight:8}}></i>{label}
    </button>
);

const MethodBtn = ({ label, sub, icon, active, onClick }) => (
    <button onClick={onClick} style={{
        flex:1, padding:'10px 5px', borderRadius:10, cursor:'pointer',
        background: active ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255,255,255,0.05)',
        border: active ? '1px solid #2196F3' : '1px solid transparent',
        display:'flex', flexDirection:'column', alignItems:'center', gap:2
    }}>
        <i className={`fa-solid ${icon}`} style={{fontSize:'1.2rem', color: active ? '#2196F3' : '#888', marginBottom:5}}></i>
        <div style={{color:'white', fontWeight:'bold', fontSize:'0.8rem'}}>{label}</div>
        <div style={{color: active ? '#90CAF9' : '#666', fontSize:'0.6rem'}}>{sub}</div>
    </button>
);

const CoinBtn = ({ name, active, onClick }) => (
    <button onClick={onClick} style={{
        padding:'8px 15px', borderRadius:20, border:'none', cursor:'pointer',
        background: active ? 'white' : 'rgba(255,255,255,0.1)',
        color: active ? 'black' : '#aaa', fontWeight:'bold', fontSize:'0.75rem',
        whiteSpace:'nowrap'
    }}>
        {name}
    </button>
);

const labelStyle = { display:'block', color:'#aaa', fontSize:'0.75rem', marginBottom:8, marginLeft:5 };
const inputStyle = { 
    width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', 
    borderRadius:10, color:'white', outline:'none', fontSize:'0.9rem'
};
const actionBtnStyle = {
    width:'100%', padding:15, marginTop:10, borderRadius:12, border:'none', cursor:'pointer',
    background:'linear-gradient(45deg, #F44336, #D32F2F)', color:'white', fontWeight:'bold',
    boxShadow:'0 5px 15px rgba(244, 67, 54, 0.3)'
};

export default WithdrawModal;