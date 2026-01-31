import React, { useState, useEffect } from 'react';
import { CONSUMABLES, ITEM_DETAILS, CROPS, EXTRA_SLOT_PRICE, STORAGE_UPGRADES } from '../config/gameConstants';

// --- LOGIC HARGA (TETAP SAMA) ---
// (Logic ini untuk tampilan visual saja, harga asli tetap divalidasi backend)
const getHourlyPrice = (itemName, seed) => {
  let min = 10, max = 20;
  for (const group of Object.values(CROPS)) {
    if (group.items.includes(itemName)) {
      [min, max] = group.priceRange;
      break;
    }
  }
  const seedString = `${seed}-${itemName}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }
  const rand01 = Math.abs(hash) / 2147483647;
  return Math.floor(min + (rand01 * (max - min)));
};

const MarketModal = ({ isOpen, onClose, user, onSellAll, onBuyItem, loading, onWatchAd }) => {
  const [activeTab, setActiveTab] = useState('SELL');
  const [prices, setPrices] = useState({});
  const [, setSeed] = useState(0);
  
  // STATE BARU: Untuk Popup "Kotak Kecil" Jual Eceran
  const [sellPopup, setSellPopup] = useState(null); 

  useEffect(() => {
    if (!isOpen) return;
    const currentHour = Math.floor(Date.now() / 3600000);
    setSeed(currentHour);
    const newPrices = {};
    Object.keys(ITEM_DETAILS).forEach(item => {
        if (!CONSUMABLES[item]) {
            newPrices[item] = getHourlyPrice(item, currentHour);
        }
    });
    setPrices(newPrices);
  }, [isOpen]);

  if (!isOpen) return null;

  const inventory = user?.inventory || {};
  const balance = user?.balance || 0;
  const extraPurchased = user?.extraSlotsPurchased || 0;
  
  const sellList = Object.keys(ITEM_DETAILS).filter(key => !CONSUMABLES[key]);
  const lastAdBoost = user?.lastAdBoost || 0;
  const isAdAvailable = Date.now() - lastAdBoost > (24 * 60 * 60 * 1000);

  let totalAssetValue = 0;
  Object.entries(inventory).forEach(([item, qty]) => {
      if (prices[item]) totalAssetValue += prices[item] * qty;
  });

  // --- HANDLER CUSTOM SELL ---
  const openSellDialog = (name, currentQty) => {
      setSellPopup({ name, max: currentQty, val: 1 });
  };

  const handleConfirmSell = () => {
      if (!sellPopup) return;
      onSellAll(false, sellPopup.name, sellPopup.val);
      setSellPopup(null); 
  };

  // --- RENDER SHOP (BUY) - VIP STYLE ---
  const renderShop = () => {
    return (
      <div style={{display:'flex', flexDirection:'column', gap:20}}>
          {/* EXPANSION */}
          <div>
              <div style={{
                  fontSize:'0.9rem', color:'#00E5FF', fontWeight:'bold', marginBottom:10, 
                  letterSpacing:1, textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.3)', paddingBottom: 5, display:'inline-block'
              }}>
                  🏗️ EXPANSION & STORAGE
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <ShopCard name="Extra Land #1" price={EXTRA_SLOT_PRICE[1]} icon="🌱" color="#4CAF50"
                      owned={extraPurchased >= 1} buy={() => onBuyItem('EXTRA_LAND_1')} disabled={extraPurchased >= 1} desc="Permanent Slot" />
                  <ShopCard name="Extra Land #2" price={EXTRA_SLOT_PRICE[2]} icon="🚜" color="#4CAF50"
                      owned={extraPurchased >= 2} buy={() => onBuyItem('EXTRA_LAND_2')} disabled={extraPurchased < 1 || extraPurchased >= 2} desc="Permanent Slot" />
                  <ShopCard name={STORAGE_UPGRADES.STORAGE_20.name} price={STORAGE_UPGRADES.STORAGE_20.price} icon={STORAGE_UPGRADES.STORAGE_20.icon} color="#FFD700"
                      owned={false} buy={() => onBuyItem('STORAGE_20')} disabled={false} desc={`Capacity +${STORAGE_UPGRADES.STORAGE_20.capacity}`} />
              </div>
          </div>
          {/* TOOLS */}
          <div>
              <div style={{
                  fontSize:'0.9rem', color:'#E040FB', fontWeight:'bold', marginBottom:10, 
                  letterSpacing:1, textShadow: '0 0 10px rgba(224, 64, 251, 0.5)',
                  borderBottom: '1px solid rgba(224, 64, 251, 0.3)', paddingBottom: 5, display:'inline-block'
              }}>
                  ⚡ TOOLS & BOOSTER
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:10}}>
                  {Object.values(CONSUMABLES).map(item => {
                      const detail = ITEM_DETAILS[item.id];
                      return (
                        <div key={item.id} style={{
                            display:'flex', alignItems:'center', background:'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', 
                            padding:'10px 15px', borderRadius:15, borderLeft: `3px solid ${detail?.color || '#fff'}`, boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{fontSize:'2rem', marginRight:15, filter: `drop-shadow(0 0 5px ${detail?.color})`}}>{detail?.icon || '⚡'}</div>
                            <div style={{flex:1}}>
                                <div style={{fontWeight:'bold', fontSize:'0.95rem', color: detail?.color}}>{item.name}</div>
                                <div style={{fontSize:'0.7rem', color:'#aaa'}}>{item.desc}</div>
                            </div>
                            <button onClick={() => onBuyItem(item.id)} disabled={loading || balance < item.price} style={{
                                   background: balance >= item.price ? 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)' : '#444',
                                   color: balance >= item.price ? 'black' : '#888', border:'none', padding:'8px 16px', borderRadius:20, 
                                   fontWeight:'bold', cursor: balance >= item.price ? 'pointer' : 'not-allowed', boxShadow: balance >= item.price ? '0 4px 10px rgba(255, 193, 7, 0.3)' : 'none'
                               }}
                            >{item.price.toLocaleString()}</button>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>
    );
  };

  // --- RENDER SELL ---
  const renderSell = () => {
    return (
      <div style={{display:'flex', flexDirection:'column', height:'100%', gap:15}}>
        {/* HEADER ASET */}
        <div style={{
            background:'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.2))', 
            padding:15, borderRadius:20, border:'1px solid rgba(255,255,255,0.1)',
            display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink: 0,
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        }}>
            <div>
               <div style={{fontSize:'0.7rem', color:'#888', letterSpacing:1}}>ESTIMATED VALUE</div>
               <div style={{fontSize:'1.6rem', color:'#FFD700', fontWeight:'bold', textShadow:'0 0 15px rgba(255,215,0,0.4)'}}>
                  {totalAssetValue.toLocaleString()} <span style={{fontSize:'0.8rem', color:'#fff'}}>PTS</span>
               </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                <button onClick={() => onSellAll(false, null, null)} disabled={loading || totalAssetValue === 0} style={{
                    background: totalAssetValue > 0 ? 'linear-gradient(90deg, #4CAF50, #00E676)' : '#333', 
                    border:'none', padding:'8px 20px', borderRadius:10, color:'white', fontWeight:'bold', fontSize:'0.85rem', cursor:'pointer',
                    boxShadow: totalAssetValue > 0 ? '0 4px 10px rgba(76, 175, 80, 0.3)' : 'none'
                  }}
                >SELL ALL</button>
                {isAdAvailable ? (
                    <button onClick={() => onWatchAd({ context: 'MARKET_BOOST', rewardAmount: 'BOOST 20%' })} style={{
                        background:'rgba(255, 152, 0, 0.1)', border:'1px solid #FF9800', padding:'5px 12px', borderRadius:8, color:'#FF9800', 
                        fontWeight:'bold', fontSize:'0.7rem', cursor:'pointer', display:'flex', alignItems:'center', gap:5
                      }}
                    >🚀 BOOST +20%</button>
                ) : (<span style={{fontSize:'0.6rem', color:'#555'}}>Boost Cooldown</span>)}
            </div>
        </div>

        {/* SPLIT VIEW */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, flex:1, overflow:'hidden'}}>
            
            {/* LIVE MARKET (Kiri) */}
            <div style={{background:'rgba(0,0,0,0.2)', borderRadius:20, padding:12, border:'1px solid rgba(0, 229, 255, 0.1)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                <div style={{fontSize:'0.85rem', color:'#00E5FF', fontWeight:'bold', marginBottom:10, textAlign:'center', paddingBottom:5, borderBottom:'1px solid rgba(0, 229, 255, 0.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><span>📈</span> MARKET PRICE</div>
                <div className="no-scrollbar" style={{flex:1, overflowY:'scroll', display:'flex', flexDirection:'column', gap:6}}>
                    {sellList.map(name => (
                        <div key={name} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', padding:'8px 10px', borderRadius:10}}>
                             <div style={{display:'flex', alignItems:'center', gap:8}}><span style={{fontSize:'1.2rem'}}>{ITEM_DETAILS[name].icon}</span><span style={{fontSize:'0.75rem', color:'#ccc'}}>{name}</span></div>
                             <div style={{fontSize:'0.85rem', color:'#FFD700', fontWeight:'bold'}}>{prices[name]}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* MY INVENTORY (Kanan) - FIX: Added overflow:'hidden' to wrapper */}
            <div style={{background:'rgba(0,0,0,0.2)', borderRadius:20, padding:12, border:'1px solid rgba(76, 175, 80, 0.1)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                <div style={{fontSize:'0.85rem', color:'#4CAF50', fontWeight:'bold', marginBottom:10, textAlign:'center', paddingBottom:5, borderBottom:'1px solid rgba(76, 175, 80, 0.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}><span>🎒</span> INVENTORY</div>
                
                {/* FIX: Added className="no-scrollbar" and ensure overflowY is scroll */}
                <div className="no-scrollbar" style={{flex:1, overflowY:'scroll', display:'flex', flexDirection:'column', gap:6}}>
                    {sellList.filter(n => inventory[n] > 0).length === 0 ? (
                        <div style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:0.3}}>
                            <i className="fa-solid fa-basket-shopping fa-2x" style={{marginBottom:10}}></i><span style={{fontSize:'0.8rem'}}>Empty</span>
                        </div>
                    ) : (
                        sellList.filter(n => inventory[n] > 0).map(name => {
                            const qty = inventory[name];
                            return (
                                <div key={name} style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:10, display:'flex', flexDirection:'column', gap:6}}>
                                     <div style={{display:'flex', justifyContent:'space-between'}}>
                                         <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{fontSize:'1.2rem'}}>{ITEM_DETAILS[name].icon}</span><span style={{fontSize:'0.75rem', fontWeight:'bold'}}>{name}</span></div>
                                         <div style={{fontSize:'0.7rem', background:'#111', padding:'2px 8px', borderRadius:6, color:'#4CAF50'}}>x{qty}</div>
                                     </div>
                                     {/* TOMBOL SELL TUNGGAL */}
                                     <button onClick={() => openSellDialog(name, qty)} disabled={loading} style={{
                                         width:'100%', background:'#2196F3', border:'none', borderRadius:6, color:'white', 
                                         fontSize:'0.7rem', padding:'6px', cursor:'pointer', fontWeight:'bold', marginTop:5,
                                         boxShadow:'0 2px 5px rgba(33, 150, 243, 0.3)'
                                     }}>
                                         SELL...
                                     </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1100, 
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '95%', height: '90%', maxWidth:'500px',
        background: 'linear-gradient(160deg, #121212 0%, #1e1e2e 100%)', 
        borderRadius: 25, border: '1px solid rgba(255,255,255,0.08)', 
        display:'flex', flexDirection:'column', overflow:'hidden', 
        boxShadow:'0 0 50px rgba(0,0,0,0.7)', position:'relative'
      }}>
        
        {/* TAB HEADER */}
        <div style={{display:'flex', background:'rgba(0,0,0,0.3)', flexShrink:0, borderBottom: '1px solid rgba(255,255,255,0.05)', position:'relative'}}>
           <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background: activeTab === 'SELL' ? 'radial-gradient(circle at 25% 0%, rgba(76, 175, 80, 0.15), transparent 60%)' : 'radial-gradient(circle at 75% 0%, rgba(0, 229, 255, 0.15), transparent 60%)', pointerEvents:'none'}}/>
           <button onClick={() => setActiveTab('SELL')} style={{flex:1, padding:18, background: 'transparent', borderBottom: activeTab === 'SELL' ? '3px solid #4CAF50' : '3px solid transparent', color: activeTab === 'SELL' ? '#4CAF50' : '#666', fontWeight:'bold', borderTop:'none', borderLeft:'none', borderRight:'none', fontSize:'1rem', letterSpacing:1, cursor:'pointer', transition: 'all 0.3s'}}>💰 MARKET</button>
           <button onClick={() => setActiveTab('BUY')} style={{flex:1, padding:18, background: 'transparent', borderBottom: activeTab === 'BUY' ? '3px solid #00E5FF' : '3px solid transparent', color: activeTab === 'BUY' ? '#00E5FF' : '#666', fontWeight:'bold', borderTop:'none', borderLeft:'none', borderRight:'none', fontSize:'1rem', letterSpacing:1, cursor:'pointer', transition: 'all 0.3s'}}>🛒 SHOP</button>
           <button onClick={onClose} style={{position:'absolute', top:10, right:10, width:30, height:30, background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:'50%', cursor:'pointer'}}>✕</button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1, overflow:'hidden', padding:20}}>
            {activeTab === 'SELL' ? renderSell() : (<div style={{height:'100%', overflowY:'auto', paddingRight:5}} className="no-scrollbar">{renderShop()}</div>)}
        </div>

        {/* FOOTER */}
        <div style={{padding:'15px 20px', background:'rgba(0,0,0,0.4)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{fontSize:'0.85rem', color:'#aaa'}}>Your Balance</span>
            <span style={{fontSize:'1.2rem', color:'#FFD700', fontWeight:'bold', textShadow:'0 0 10px rgba(255, 215, 0, 0.3)'}}>{balance.toLocaleString()} PTS</span>
        </div>

        {/* === KOTAK KECIL (CUSTOM QUANTITY DIALOG) === */}
        {sellPopup && (
            <div style={{
                position:'absolute', top:0, left:0, width:'100%', height:'100%', 
                background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', zIndex:1200,
                display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.2s'
            }}>
                <div style={{
                    width:'80%', background:'#222', border:'1px solid #444', borderRadius:15, padding:20,
                    display:'flex', flexDirection:'column', alignItems:'center',
                    boxShadow:'0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <div style={{fontSize:'3rem', marginBottom:10}}>{ITEM_DETAILS[sellPopup.name]?.icon}</div>
                    <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'white', marginBottom:5}}>{sellPopup.name}</div>
                    <div style={{color:'#888', fontSize:'0.8rem', marginBottom:20}}>Price: {prices[sellPopup.name]} PTS / item</div>
                    
                    {/* QUANTITY SLIDER & INPUT */}
                    <div style={{display:'flex', alignItems:'center', gap:10, width:'100%', marginBottom:10}}>
                        <button onClick={() => setSellPopup({...sellPopup, val: Math.max(1, sellPopup.val - 1)})} style={{width:35, height:35, borderRadius:8, border:'none', background:'#333', color:'white', fontWeight:'bold'}}>-</button>
                        <div style={{flex:1, textAlign:'center', fontSize:'1.5rem', fontWeight:'bold', color:'#00E5FF'}}>{sellPopup.val}</div>
                        <button onClick={() => setSellPopup({...sellPopup, val: Math.min(sellPopup.max, sellPopup.val + 1)})} style={{width:35, height:35, borderRadius:8, border:'none', background:'#333', color:'white', fontWeight:'bold'}}>+</button>
                    </div>

                    {/* RANGE SLIDER */}
                    <input 
                        type="range" min="1" max={sellPopup.max} value={sellPopup.val} 
                        onChange={(e) => setSellPopup({...sellPopup, val: parseInt(e.target.value)})}
                        style={{width:'100%', marginBottom:20, accentColor:'#00E5FF'}}
                    />

                    {/* TOTAL INFO */}
                    <div style={{background:'rgba(255,255,255,0.05)', padding:'10px 20px', borderRadius:10, marginBottom:20, width:'100%', textAlign:'center'}}>
                        <div style={{fontSize:'0.7rem', color:'#aaa'}}>TOTAL RECEIVE</div>
                        <div style={{fontSize:'1.2rem', color:'#FFD700', fontWeight:'bold'}}>{(sellPopup.val * prices[sellPopup.name]).toLocaleString()} PTS</div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{display:'flex', gap:10, width:'100%'}}>
                        <button onClick={() => setSellPopup(null)} style={{flex:1, padding:12, background:'#333', color:'#ccc', border:'none', borderRadius:10, fontWeight:'bold', cursor:'pointer'}}>CANCEL</button>
                        <button onClick={handleConfirmSell} style={{flex:1, padding:12, background:'#4CAF50', color:'white', border:'none', borderRadius:10, fontWeight:'bold', cursor:'pointer', boxShadow:'0 5px 15px rgba(76, 175, 80, 0.3)'}}>CONFIRM</button>
                    </div>
                </div>
            </div>
        )}

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:translateY(10px)} to {opacity:1; transform:translateY(0)} }`}</style>
    </div>
  );
};

// ... ShopCard Component (Sama seperti sebelumnya, tidak perlu diubah)
const ShopCard = ({name, price, icon, owned, buy, disabled, desc, color}) => (
    <div style={{
        background: owned ? `linear-gradient(145deg, rgba(76, 175, 80, 0.1), rgba(0,0,0,0.3))` : `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2))`,
        borderRadius:15, padding:15, textAlign:'center', 
        border: owned ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        boxShadow: owned ? `0 0 15px ${color}30` : 'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative'
    }}>
        <div style={{fontSize:'2.5rem', marginBottom:10, filter:`drop-shadow(0 0 8px ${color})`}}>{icon}</div>
        <div style={{fontSize:'0.9rem', fontWeight:'bold', color: color || 'white', marginBottom:2}}>{name}</div>
        {desc && <div style={{fontSize:'0.65rem', color:'#aaa', marginBottom:10}}>{desc}</div>}
        {owned ? (
            <div style={{background:'rgba(76, 175, 80, 0.2)', color:'#4CAF50', padding:'5px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:'bold', marginTop:'auto'}}>OWNED</div>
        ) : (
            <button onClick={buy} disabled={disabled} style={{
                background: disabled ? '#333' : 'linear-gradient(90deg, #FFC107, #FF9800)', 
                color: disabled ? '#666' : 'black', border:'none', borderRadius:20, padding:'8px 15px', fontSize:'0.8rem', 
                fontWeight:'bold', cursor: disabled?'not-allowed':'pointer', marginTop:'auto', width:'100%', boxShadow: disabled ? 'none' : '0 4px 10px rgba(255, 152, 0, 0.3)'
            }}>{typeof price === 'number' ? price.toLocaleString() : price}</button>
        )}
    </div>
);

export default MarketModal;
