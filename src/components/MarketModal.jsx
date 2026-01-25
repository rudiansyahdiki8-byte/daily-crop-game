import React, { useState, useEffect } from 'react';
import { LAND_PLOTS, CONSUMABLES, ITEM_DETAILS, CROPS } from '../config/gameConstants';

// Helper Harga
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
  const [seed, setSeed] = useState(0);

  // --- LOGIC HARGA LIVE ---
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

  const userSlots = user?.slots || [];
  const inventory = user?.inventory || {};
  const balance = user?.balance || 0;
  const sellList = Object.keys(ITEM_DETAILS).filter(key => !CONSUMABLES[key]);
  
  // Logic Ad Booster
  const lastAdBoost = user?.lastAdBoost || 0;
  const isAdAvailable = Date.now() - lastAdBoost > (24 * 60 * 60 * 1000);

  // --- HITUNG ESTIMASI TOTAL ASET ---
  let totalAssetValue = 0;
  Object.entries(inventory).forEach(([item, qty]) => {
      if (prices[item]) totalAssetValue += prices[item] * qty;
  });

  // --- RENDER TAB SELL (3 KOTAK) ---
  const renderSell = () => {
    return (
      <div style={{display:'flex', flexDirection:'column', height:'100%', gap:10}}>
        
        {/* === KOTAK 1: ATAS (PREVIEW & ACTION) === */}
        <div style={{
            background:'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', 
            padding:15, borderRadius:15, border:'1px solid rgba(255,255,255,0.1)',
            display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink: 0
        }}>
            <div>
               <div style={{fontSize:'0.7rem', color:'#aaa'}}>ESTIMASI ASET GUDANG</div>
               <div style={{fontSize:'1.5rem', color:'#FFD700', fontWeight:'bold', textShadow:'0 0 10px rgba(255,215,0,0.3)'}}>
                  {totalAssetValue.toLocaleString()} PTS
               </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end'}}>
                {/* TOMBOL JUAL SEMUA */}
                <button 
                  onClick={() => onSellAll(false, null, null)} // Jual Semua (Tanpa Booster, Semua Item, Semua Qty)
                  disabled={loading || totalAssetValue === 0}
                  style={{
                    background: totalAssetValue > 0 ? '#4CAF50' : '#555', border:'none', 
                    padding:'8px 15px', borderRadius:8, color:'white', fontWeight:'bold', fontSize:'0.8rem', cursor:'pointer'
                  }}
                >
                  JUAL SEMUA
                </button>

                {/* TOMBOL BOOSTER */}
                {isAdAvailable ? (
                    <button 
                      onClick={() => onWatchAd({ context: 'MARKET_BOOST', rewardAmount: 'BOOST 20%' })}
                      style={{
                        background:'transparent', border:'1px solid #FF9800', 
                        padding:'5px 10px', borderRadius:8, color:'#FF9800', fontWeight:'bold', fontSize:'0.7rem', cursor:'pointer'
                      }}
                    >
                      🚀 BOOST +20% (IKLAN)
                    </button>
                ) : (
                    <span style={{fontSize:'0.6rem', color:'#555'}}>Boost Cooldown</span>
                )}
            </div>
        </div>

        {/* CONTAINER BAWAH (GRID 2 KOLOM) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flex:1, overflow:'hidden'}}>
            
            {/* === KOTAK 2: KIRI BAWAH (LIVE MARKET) === */}
            <div style={{
                background:'rgba(0,0,0,0.3)', borderRadius:15, padding:10, 
                border:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column'
            }}>
                <div style={{fontSize:'0.8rem', color:'#00E5FF', fontWeight:'bold', marginBottom:10, textAlign:'center', borderBottom:'1px solid #333', paddingBottom:5}}>
                    📈 PASAR (LIVE)
                </div>
                <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:5}}>
                    {sellList.map(name => (
                        <div key={name} style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            background:'rgba(255,255,255,0.05)', padding:'5px 8px', borderRadius:8
                        }}>
                             <div style={{display:'flex', alignItems:'center', gap:5}}>
                                 <span style={{fontSize:'1rem'}}>{ITEM_DETAILS[name].icon}</span>
                                 <span style={{fontSize:'0.7rem', color:'#ccc'}}>{name}</span>
                             </div>
                             <div style={{fontSize:'0.8rem', color:'#FFD700', fontWeight:'bold'}}>
                                 {prices[name]}
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === KOTAK 3: KANAN BAWAH (MY WAREHOUSE) === */}
            <div style={{
                background:'rgba(0,0,0,0.3)', borderRadius:15, padding:10, 
                border:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column'
            }}>
                <div style={{fontSize:'0.8rem', color:'#4CAF50', fontWeight:'bold', marginBottom:10, textAlign:'center', borderBottom:'1px solid #333', paddingBottom:5}}>
                    🎒 GUDANG SAYA
                </div>
                <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:5}}>
                    {sellList.filter(n => inventory[n] > 0).length === 0 ? (
                        <div style={{textAlign:'center', color:'#555', marginTop:20, fontSize:'0.7rem'}}>Kosong</div>
                    ) : (
                        sellList.filter(n => inventory[n] > 0).map(name => {
                            const qty = inventory[name];
                            const price = prices[name];
                            return (
                                <div key={name} style={{
                                    background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:8,
                                    display:'flex', flexDirection:'column', gap:5
                                }}>
                                     <div style={{display:'flex', justifyContent:'space-between'}}>
                                         <div style={{display:'flex', alignItems:'center', gap:5}}>
                                             <span>{ITEM_DETAILS[name].icon}</span>
                                             <span style={{fontSize:'0.75rem', fontWeight:'bold'}}>{name}</span>
                                         </div>
                                         <div style={{fontSize:'0.7rem', background:'#333', padding:'2px 5px', borderRadius:4}}>
                                             x{qty}
                                         </div>
                                     </div>
                                     
                                     {/* TOMBOL AKSI JUAL */}
                                     <div style={{display:'flex', gap:5}}>
                                         <button 
                                            onClick={() => onSellAll(false, name, 1)} // Jual 1 Biji
                                            disabled={loading}
                                            style={{
                                                flex:1, background:'#2196F3', border:'none', borderRadius:4, 
                                                color:'white', fontSize:'0.6rem', padding:'4px', cursor:'pointer'
                                            }}
                                         >
                                            Jual 1 ({price})
                                         </button>
                                         <button 
                                            onClick={() => onSellAll(false, name, null)} // Jual Semua Item Ini
                                            disabled={loading}
                                            style={{
                                                flex:1, background:'#4CAF50', border:'none', borderRadius:4, 
                                                color:'white', fontSize:'0.6rem', padding:'4px', cursor:'pointer'
                                            }}
                                         >
                                            All ({price * qty})
                                         </button>
                                     </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

        </div>
      </div>
    );
  };

  // --- RENDER TAB BUY (SHOP) - TETAP SAMA ---
  const renderShop = () => {
    return (
      <div style={{display:'flex', flexDirection:'column', gap:15}}>
          {/* SECTION 1: TANAH (LAND) */}
          <div>
              <div style={{fontSize:'0.8rem', color:'#00E5FF', fontWeight:'bold', marginBottom:8, letterSpacing:1}}>
                  EXPANSION 🚧
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <ShopCard 
                      name="Slot #2" price={LAND_PLOTS.SLOT_2.cost} icon="🌱"
                      owned={userSlots.includes(2)}
                      buy={() => onBuyItem('SLOT_2')}
                      disabled={false}
                  />
                  <ShopCard 
                      name="Slot #3" price={LAND_PLOTS.SLOT_3.cost} icon="🚜"
                      owned={userSlots.includes(3)}
                      buy={() => onBuyItem('SLOT_3')}
                      disabled={!userSlots.includes(2)} 
                  />
                  <ShopCard 
                      name="Slot #4" price={LAND_PLOTS.SLOT_4?.cost || 'FREE'} icon="🏡"
                      owned={userSlots.includes(4)}
                      buy={() => alert("Upgrade ke MORTGAGE Plan!")}
                      disabled={true}
                      customLabel="PLAN ONLY"
                  />
              </div>
          </div>

          {/* SECTION 2: TOOLS (CONSUMABLES) */}
          <div>
              <div style={{fontSize:'0.8rem', color:'#E040FB', fontWeight:'bold', marginBottom:8, letterSpacing:1}}>
                  TOOLS & BOOSTER ⚡
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8}}>
                  {Object.values(CONSUMABLES).map(item => (
                      <div key={item.id} style={{
                          display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', 
                          padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)'
                      }}>
                          <div style={{fontSize:'1.8rem', marginRight:12}}>
                              {ITEM_DETAILS[item.id]?.icon || '⚡'}
                          </div>
                          <div style={{flex:1}}>
                              <div style={{fontWeight:'bold', color: ITEM_DETAILS[item.id]?.color}}>{item.name}</div>
                              <div style={{fontSize:'0.7rem', color:'#aaa'}}>{item.desc}</div>
                          </div>
                          <button 
                             onClick={() => onBuyItem(item.id)}
                             disabled={loading || balance < item.price}
                             style={{
                                 background: balance >= item.price ? '#FFC107' : '#555',
                                 color: balance >= item.price ? 'black' : '#888',
                                 border:'none', padding:'6px 12px', borderRadius:20, fontWeight:'bold', cursor:'pointer'
                             }}
                          >
                             {item.price}
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1100,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '95%', height: '90%', 
        background: 'linear-gradient(170deg, #1a1a2e 0%, #16213e 100%)', 
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 0 30px rgba(0,0,0,0.5)'
      }}>
        
        {/* HEADER TAB */}
        <div style={{display:'flex', background:'rgba(0,0,0,0.3)', flexShrink:0}}>
           <button onClick={() => setActiveTab('SELL')} style={{
               flex:1, padding:15, background: activeTab === 'SELL' ? 'rgba(255,255,255,0.05)' : 'transparent',
               borderBottom: activeTab === 'SELL' ? '3px solid #4CAF50' : '3px solid transparent',
               color: activeTab === 'SELL' ? '#4CAF50' : '#888', fontWeight:'bold', borderTop:'none', borderLeft:'none', borderRight:'none'
           }}>
               💰 PASAR (SELL)
           </button>
           <button onClick={() => setActiveTab('BUY')} style={{
               flex:1, padding:15, background: activeTab === 'BUY' ? 'rgba(255,255,255,0.05)' : 'transparent',
               borderBottom: activeTab === 'BUY' ? '3px solid #00E5FF' : '3px solid transparent',
               color: activeTab === 'BUY' ? '#00E5FF' : '#888', fontWeight:'bold', borderTop:'none', borderLeft:'none', borderRight:'none'
           }}>
               🛒 TOKO (BUY)
           </button>
           <button onClick={onClose} style={{
               padding:'0 20px', background:'#B71C1C', color:'white', border:'none', fontWeight:'bold'
           }}>✕</button>
        </div>

        {/* CONTENT (Scrollable) */}
        <div style={{flex:1, overflow:'hidden', padding:15}}>
            {activeTab === 'SELL' ? renderSell() : (
               <div style={{height:'100%', overflowY:'auto'}}>
                 {renderShop()}
               </div>
            )}
        </div>

        {/* FOOTER */}
        <div style={{padding:12, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
            <span style={{fontSize:'0.8rem', color:'#aaa'}}>Saldo Anda:</span>
            <span style={{fontSize:'1.1rem', color:'#FFD700', fontWeight:'bold'}}>{balance.toLocaleString()} PTS</span>
        </div>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:translateY(10px)} to {opacity:1; transform:translateY(0)} }`}</style>
    </div>
  );
};

// Sub-Component Kartu Toko
const ShopCard = ({name, price, icon, owned, buy, disabled, customLabel}) => (
    <div style={{
        background: owned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)', 
        borderRadius:10, padding:10, textAlign:'center', border: owned ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)'
    }}>
        <div style={{fontSize:'2rem', marginBottom:5}}>{icon}</div>
        <div style={{fontSize:'0.8rem', fontWeight:'bold', color:'white', marginBottom:5}}>{name}</div>
        
        {owned ? (
            <div style={{fontSize:'0.7rem', color:'#4CAF50', fontWeight:'bold'}}>OWNED</div>
        ) : customLabel ? (
            <div style={{fontSize:'0.7rem', color:'#FF5252', fontWeight:'bold'}}>{customLabel}</div>
        ) : (
            <button onClick={buy} disabled={disabled} style={{
                background: disabled ? '#555' : '#FFC107', color: disabled ? '#888' : 'black',
                border:'none', borderRadius:15, padding:'4px 10px', fontSize:'0.8rem', fontWeight:'bold', cursor: disabled?'not-allowed':'pointer'
            }}>
                {typeof price === 'number' ? price.toLocaleString() : price}
            </button>
        )}
    </div>
);

export default MarketModal;