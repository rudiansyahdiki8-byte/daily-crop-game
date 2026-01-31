import React, { useState, useEffect } from 'react';
import { requestDeposit } from '../services/api'; 
// IMPORT CONFIG PUSAT
import { GAME_CONFIG } from '../config/gameConstants';

const FALLBACK_PRICES = { USDT: 1, TON: 5.2, TRX: 0.12, DOGE: 0.15, LTC: 70 };

const WithdrawModal = ({ isOpen, onClose, userBalance, onWithdraw, loading, userId }) => {
  const [activeTab, setActiveTab] = useState('WITHDRAW'); 
  const [cryptoPrices, setCryptoPrices] = useState(FALLBACK_PRICES);
  
  // FORM DATA
  const [wdMethod, setWdMethod] = useState('FAUCETPAY'); 
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [wdAmount, setWdAmount] = useState('');
  const [wdAddress, setWdAddress] = useState('');
  
  const [depAmount, setDepAmount] = useState('');
  const [txHash, setTxHash] = useState('');

  // Fetch Harga Live
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
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // CONFIG
  const config = GAME_CONFIG.WITHDRAW;
  const feePct = wdMethod === 'FAUCETPAY' ? config.FEE_FAUCETPAY : config.FEE_DIRECT; 
  
  // Kalkulasi
  const inputVal = parseInt(wdAmount) || 0;
  const feeVal = Math.floor(inputVal * feePct);
  const netPts = inputVal - feeVal;
  const usdValue = netPts * config.RATE; 
  const cryptoPrice = cryptoPrices[selectedCrypto] || 1;
  const cryptoReceive = (usdValue / cryptoPrice).toFixed(6);

  // Handlers
  const handleWdSubmit = () => {
    if (!wdAmount || !wdAddress) return alert("Please fill all fields!");
    if (inputVal > userBalance) return alert("Insufficient Balance!");
    if (inputVal < config.MIN_WD_NEW) return alert(`Minimum withdraw is ${config.MIN_WD_NEW} PTS`);
    onWithdraw(wdAmount, wdAddress, wdMethod, selectedCrypto);
  };

  const handleDepSubmit = async () => {
     if (!depAmount || !txHash) return alert("Please fill amount & TxID!");
     try {
       await requestDeposit(userId, depAmount, txHash, 'USDT'); 
       alert("Deposit request sent! Waiting for admin approval.");
       onClose();
     } catch(e) { 
        alert("Failed: " + (e.response?.data?.message || e.message)); 
     }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1200,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '90%', maxWidth: '420px', maxHeight: '90vh',
        background: 'linear-gradient(160deg, #101522 0%, #050505 100%)', 
        borderRadius: 25, border: '1px solid rgba(0, 229, 255, 0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', 
        boxShadow: '0 0 50px rgba(0, 229, 255, 0.1)'
      }}>
        
        {/* HEADER */}
        <div style={{padding:'20px 20px 10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{
                    width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg, #00E5FF, #2979FF)',
                    display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 15px rgba(0, 229, 255, 0.4)'
                }}>
                    <i className="fa-solid fa-building-columns" style={{color:'white'}}></i>
                </div>
                <div>
                    <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'white', letterSpacing:1}}>CYBER BANK</div>
                    <div style={{fontSize:'0.6rem', color:'#aaa'}}>SECURE TRANSACTION</div>
                </div>
            </div>
            <button onClick={onClose} style={{background:'transparent', border:'none', color:'#666', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>

        {/* TABS */}
        <div style={{display:'flex', margin:'10px 20px', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:4}}>
           <TabBtn label="WITHDRAW" active={activeTab==='WITHDRAW'} onClick={()=>setActiveTab('WITHDRAW')} />
           <TabBtn label="DEPOSIT" active={activeTab==='DEPOSIT'} onClick={()=>setActiveTab('DEPOSIT')} />
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'0 20px 20px'}}>
            
            {/* SALDO CARD (ATM STYLE) */}
            <div style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                borderRadius: 15, padding: 20, marginBottom: 20, position:'relative', overflow:'hidden',
                boxShadow: '0 5px 20px rgba(255, 215, 0, 0.3)', border:'1px solid rgba(255,255,255,0.2)'
            }}>
                <div style={{position:'absolute', top:-20, right:-20, width:100, height:100, background:'rgba(255,255,255,0.2)', borderRadius:'50%'}}></div>
                <div style={{fontSize:'0.7rem', color:'#3E2723', fontWeight:'bold', letterSpacing:1, marginBottom:5}}>AVAILABLE BALANCE</div>
                <div style={{fontSize:'1.8rem', fontWeight:'900', color:'#212121', textShadow:'0 1px 0 rgba(255,255,255,0.4)'}}>
                    {userBalance.toLocaleString()} <span style={{fontSize:'0.9rem'}}>PTS</span>
                </div>
                <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                    <div style={{fontSize:'0.8rem', color:'#3E2723', fontWeight:'bold'}}>
                        ≈ ${(userBalance * config.RATE).toFixed(4)} USD
                    </div>
                    <i className="fa-brands fa-cc-visa fa-2x" style={{opacity:0.5, color:'#3E2723'}}></i>
                </div>
            </div>

            {/* ====== FORM WITHDRAW ====== */}
            {activeTab === 'WITHDRAW' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                  
                  {/* METHOD SELECTOR */}
                  <div>
                      <Label text="PAYMENT METHOD" />
                      <div style={{display:'flex', gap:10}}>
                          <MethodBtn 
                              label="FAUCETPAY" sub={`Instant (Fee ${config.FEE_FAUCETPAY*100}%)`} icon="fa-bolt" 
                              active={wdMethod==='FAUCETPAY'} onClick={()=>setWdMethod('FAUCETPAY')} 
                          />
                          <MethodBtn 
                              label="DIRECT" sub={`Manual (Fee ${config.FEE_DIRECT*100}%)`} icon="fa-wallet" 
                              active={wdMethod==='DIRECT'} onClick={()=>setWdMethod('DIRECT')} 
                          />
                      </div>
                  </div>

                  {/* COIN SELECTOR */}
                  <div>
                      <Label text="SELECT CURRENCY" />
                      <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:5, scrollbarWidth:'none'}}>
                          {['USDT','TON','TRX','DOGE','LTC'].map(c => (
                              <CoinBtn key={c} name={c} active={selectedCrypto===c} onClick={()=>setSelectedCrypto(c)} />
                          ))}
                      </div>
                  </div>

                  {/* ADDRESS INPUT */}
                  <div>
                      <Label text={wdMethod === 'FAUCETPAY' ? 'FAUCETPAY EMAIL' : 'WALLET ADDRESS'} />
                      <div style={inputContainerStyle}>
                          <i className="fa-solid fa-wallet" style={{color:'#666', marginRight:10}}></i>
                          <input 
                              value={wdAddress} onChange={e=>setWdAddress(e.target.value)}
                              placeholder={wdMethod === 'FAUCETPAY' ? 'name@email.com' : '0x...'}
                              style={inputStyle}
                          />
                      </div>
                  </div>

                  {/* AMOUNT INPUT */}
                  <div>
                      <Label text="AMOUNT (PTS)" />
                      <div style={inputContainerStyle}>
                          <span style={{color:'#00E5FF', fontWeight:'bold', marginRight:10}}>PTS</span>
                          <input 
                              type="number" value={wdAmount} onChange={e=>setWdAmount(e.target.value)}
                              placeholder={`Min ${config.MIN_WD_NEW}`}
                              style={inputStyle} 
                          />
                          <button onClick={() => setWdAmount(userBalance)} style={maxBtnStyle}>MAX</button>
                      </div>
                  </div>

                  {/* RECEIPT PREVIEW */}
                  <div style={{
                      background:'rgba(255,255,255,0.03)', borderRadius:12, padding:15,
                      border:'1px dashed rgba(255,255,255,0.1)'
                  }}>
                      <div style={rowStyle}>
                          <span>Fee ({feePct*100}%)</span>
                          <span style={{color:'#F44336'}}>- {feeVal} PTS</span>
                      </div>
                      <div style={{...rowStyle, marginTop:5, paddingTop:5, borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                          <span style={{color:'white'}}>YOU RECEIVE</span>
                          <div style={{textAlign:'right'}}>
                              <div style={{color:'#00E5FF', fontWeight:'bold', fontSize:'1.1rem'}}>
                                  {cryptoReceive} {selectedCrypto}
                              </div>
                              <div style={{fontSize:'0.65rem', color:'#666'}}>
                                  ~ ${(usdValue).toFixed(4)} USD
                              </div>
                          </div>
                      </div>
                  </div>

                  <button onClick={handleWdSubmit} disabled={loading} style={mainBtnStyle}>
                      {loading ? 'PROCESSING...' : 'REQUEST WITHDRAW'}
                  </button>
              </div>
            )}

            {/* ====== FORM DEPOSIT ====== */}
            {activeTab === 'DEPOSIT' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                   <div style={{background:'rgba(0, 229, 255, 0.05)', padding:15, borderRadius:12, border:'1px solid rgba(0, 229, 255, 0.2)', textAlign:'center'}}>
                       <div style={{fontSize:'0.7rem', color:'#00E5FF', marginBottom:5, letterSpacing:1}}>OFFICIAL DEPOSIT ADDRESS (TRC20)</div>
                       <div style={{color:'white', fontWeight:'bold', wordBreak:'break-all', fontSize:'0.85rem', fontFamily:'monospace', background:'rgba(0,0,0,0.3)', padding:10, borderRadius:8}}>
                           {config.ADMIN_WALLET}
                       </div>
                   </div>
                   
                   <div>
                      <Label text="AMOUNT (PTS)" />
                      <div style={inputContainerStyle}>
                          <span style={{color:'#4CAF50', fontWeight:'bold', marginRight:10}}>PTS</span>
                          <input type="number" placeholder="Enter amount..." value={depAmount} onChange={e=>setDepAmount(e.target.value)} style={inputStyle} />
                      </div>
                   </div>

                   <div>
                      <Label text="TXID / HASH" />
                      <div style={inputContainerStyle}>
                          <i className="fa-solid fa-receipt" style={{color:'#666', marginRight:10}}></i>
                          <input type="text" placeholder="Paste Transaction Hash..." value={txHash} onChange={e=>setTxHash(e.target.value)} style={inputStyle} />
                      </div>
                   </div>

                   <button onClick={handleDepSubmit} style={{...mainBtnStyle, background:'linear-gradient(45deg, #00C853, #64DD17)', boxShadow:'0 0 20px rgba(0, 200, 83, 0.3)'}}>
                       CONFIRM DEPOSIT
                   </button>
                   <div style={{textAlign:'center', fontSize:'0.7rem', color:'#666', marginTop:5}}>
                      <i className="fa-regular fa-clock" style={{marginRight:5}}></i>
                      Verification takes 1-24 hours.
                   </div>
              </div>
            )}

        </div>
      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

// --- STYLED COMPONENTS ---

const Label = ({ text }) => (
    <div style={{fontSize:'0.7rem', color:'#888', marginBottom:8, marginLeft:5, fontWeight:'bold', letterSpacing:0.5}}>{text}</div>
);

const TabBtn = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
        flex:1, padding:'10px', background: active ? 'rgba(0, 229, 255, 0.15)' : 'transparent', border:'none', borderRadius:10,
        color: active ? '#00E5FF' : '#666', fontWeight:'bold', cursor:'pointer', fontSize:'0.8rem',
        transition:'all 0.2s'
    }}>
        {label}
    </button>
);

const MethodBtn = ({ label, sub, icon, active, onClick }) => (
    <button onClick={onClick} style={{
        flex:1, padding:'12px 5px', borderRadius:12, cursor:'pointer',
        background: active ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.05)',
        display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.2s'
    }}>
        <i className={`fa-solid ${icon}`} style={{fontSize:'1.2rem', color: active ? '#00E5FF' : '#555', marginBottom:5}}></i>
        <div style={{color:'white', fontWeight:'bold', fontSize:'0.75rem'}}>{label}</div>
        <div style={{color: active ? '#80DEEA' : '#666', fontSize:'0.6rem'}}>{sub}</div>
    </button>
);

const CoinBtn = ({ name, active, onClick }) => (
    <button onClick={onClick} style={{
        padding:'6px 16px', borderRadius:20, border: active ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.1)', 
        cursor:'pointer',
        background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
        color: active ? 'white' : '#888', fontWeight:'bold', fontSize:'0.75rem',
        whiteSpace:'nowrap', transition:'all 0.2s'
    }}>
        {name}
    </button>
);

const inputContainerStyle = {
    display:'flex', alignItems:'center', background:'rgba(0,0,0,0.3)', 
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'0 15px'
};

const inputStyle = { 
    width:'100%', padding:'12px 0', background:'transparent', border:'none', 
    color:'white', outline:'none', fontSize:'0.95rem', fontWeight:'500'
};

const maxBtnStyle = {
    background:'rgba(0, 229, 255, 0.1)', border:'none', color:'#00E5FF', 
    borderRadius:6, padding:'4px 8px', fontWeight:'bold', fontSize:'0.7rem', cursor:'pointer'
};

const rowStyle = { display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#aaa' };

const mainBtnStyle = {
    width:'100%', padding:15, marginTop:10, borderRadius:15, border:'none', cursor:'pointer',
    background:'linear-gradient(90deg, #00E5FF, #2979FF)', color:'white', fontWeight:'bold',
    boxShadow:'0 0 20px rgba(0, 229, 255, 0.3)', fontSize:'1rem', letterSpacing:1
};

export default WithdrawModal;