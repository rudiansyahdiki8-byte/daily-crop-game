import React, { useState } from 'react';
import { ITEM_DETAILS, CONSUMABLES } from '../config/gameConstants';

const WarehouseModal = ({ isOpen, onClose, inventory, storageLimit, onOpenMarket, onUseItem, loading }) => {
  if (!isOpen) return null;

  // State untuk Tab Aktif (HARVEST atau TOOLS)
  const [activeTab, setActiveTab] = useState('HARVEST');

  // Hitung Total Item (Semua jenis)
  const totalItems = Object.values(inventory || {}).reduce((a, b) => a + b, 0);
  const percentage = Math.min((totalItems / storageLimit) * 100, 100);
  
  // Logic Warna Progress Bar (Hijau -> Kuning -> Merah)
  let progressGradient = 'linear-gradient(90deg, #39FF14, #00E5FF)'; 
  if (percentage > 50) progressGradient = 'linear-gradient(90deg, #FFD700, #FFA000)'; 
  if (percentage > 90) progressGradient = 'linear-gradient(90deg, #FF5252, #FF1744)'; 

  // --- FILTER ITEM BERDASARKAN TAB ---
  const inventoryEntries = Object.entries(inventory || {});
  
  const filteredList = inventoryEntries.filter(([name, qty]) => {
     if (qty <= 0) return false;

     // Cek apakah item ini ada di daftar CONSUMABLES?
     const isBooster = CONSUMABLES[name];

     if (activeTab === 'TOOLS') {
         // Tab TOOLS hanya menampilkan item yang ada di CONSUMABLES
         return isBooster;
     } else {
         // Tab HARVEST menampilkan sisanya (Sayuran/Crop)
         return !isBooster;
     }
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '90%', maxHeight: '85%', 
        background: 'linear-gradient(160deg, rgba(30,30,40,0.95) 0%, rgba(10,10,20,0.98) 100%)', 
        border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: 20,
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white'
      }}>
        
        {/* HEADER */}
        <div style={{
            padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', 
            display:'flex', justifyContent:'space-between', alignItems:'center', background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
             <span style={{fontSize:'1.5rem'}}>📦</span>
             <div>
                <h2 style={{margin:0, fontSize:'1.1rem', letterSpacing:'1px', textTransform:'uppercase', color:'#00E5FF'}}>STORAGE</h2>
             </div>
          </div>
          <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:35, height:35, borderRadius:'50%', cursor:'pointer', fontSize:'1rem'
          }}>✕</button>
        </div>

        {/* TABS SWITCHER */}
        <div style={{display:'flex', padding:'10px 15px', gap:10}}>
            <button onClick={() => setActiveTab('HARVEST')} style={{
                flex:1, padding:'8px', borderRadius:10, border:'none', fontWeight:'bold',
                background: activeTab === 'HARVEST' ? '#39FF14' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'HARVEST' ? 'black' : '#aaa', cursor:'pointer'
            }}>
                🥬 HARVEST
            </button>
            <button onClick={() => setActiveTab('TOOLS')} style={{
                flex:1, padding:'8px', borderRadius:10, border:'none', fontWeight:'bold',
                background: activeTab === 'TOOLS' ? '#03A9F4' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'TOOLS' ? 'black' : '#aaa', cursor:'pointer'
            }}>
                ⚡ TOOLS
            </button>
        </div>

        {/* PROGRESS BAR */}
        <div style={{padding: '5px 20px 10px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', marginBottom:5, color:'#aaa'}}>
            <span>Capacity</span>
            <span>{totalItems} / {storageLimit}</span>
          </div>
          <div style={{width:'100%', height:6, background:'rgba(0,0,0,0.5)', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{
              width: `${percentage}%`, height:'100%', background: progressGradient,
              boxShadow: `0 0 10px ${percentage > 90 ? '#FF1744' : '#39FF14'}`
            }}/>
          </div>
        </div>

        {/* LIST ITEM (GRID) */}
        <div style={{
            flex:1, overflowY:'auto', padding:15, 
            display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, alignContent:'start'
        }}>
          {filteredList.length === 0 ? (
            <div style={{gridColumn:'1/4', textAlign:'center', color:'#666', marginTop:40, display:'flex', flexDirection:'column', alignItems:'center'}}>
              <span style={{fontSize:'3rem', opacity:0.3}}>{activeTab === 'HARVEST' ? '🕸️' : '🎒'}</span>
              <p style={{fontSize:'0.9rem', marginTop:10}}>No items here</p>
            </div>
          ) : (
            filteredList.map(([name, qty]) => {
                // Ambil Data Visual dari Config
                const itemData = ITEM_DETAILS[name] || { icon: '❓', color: '#ccc' };
                const rarityColor = itemData.color;
                
                // Ambil nama pendek jika ada (khusus Consumables)
                const displayName = CONSUMABLES[name]?.name || name;

                return (
                  <div key={name} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 5px',
                    border: `1px solid ${rarityColor}40`, boxShadow: `inset 0 0 20px ${rarityColor}10`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
                    transition: 'transform 0.1s'
                  }}>
                    <div style={{fontSize:'2.2rem', marginBottom:5, filter:'drop-shadow(0 5px 5px rgba(0,0,0,0.5))'}}>
                      {itemData.icon}
                    </div>
                    
                    <div style={{fontSize:'0.65rem', color:'#eee', textAlign:'center', lineHeight:1.2, fontWeight:'bold', marginBottom:2, minHeight:24, display:'flex', alignItems:'center'}}>
                        {displayName}
                    </div>
                    
                    <div style={{background: 'rgba(0,0,0,0.5)', color: rarityColor, fontSize:'0.7rem', fontWeight:'bold', padding:'2px 8px', borderRadius:10, marginTop: 2, border: `1px solid ${rarityColor}50`}}>
                      x{qty}
                    </div>

                    {/* --- TOMBOL USE KHUSUS TAB TOOLS --- */}
                    {activeTab === 'TOOLS' && (
                        <button 
                           onClick={() => onUseItem(name)}
                           disabled={loading}
                           style={{
                             marginTop: 8, padding: '4px 12px', fontSize: '0.65rem',
                             background: 'linear-gradient(90deg, #00C853, #64DD17)',
                             border: 'none', borderRadius: 10, color: 'white', fontWeight: 'bold', cursor:'pointer',
                             boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                           }}
                        >
                           PAKAI
                        </button>
                    )}
                  </div>
                )
            })
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{padding: 15, background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
           
           {/* JIKA TAB HARVEST: Munculkan Tombol Ke Market */}
           {activeTab === 'HARVEST' && (
             <button 
               onClick={() => { onClose(); onOpenMarket(); }}
               style={{
                 width:'100%', padding:'12px', 
                 background: 'linear-gradient(135deg, #00E676 0%, #69F0AE 100%)', 
                 color: '#004D40', fontWeight:'bold', fontSize:'1rem',
                 border:'none', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10
               }}
             >
               <span style={{fontSize:'1.4rem'}}>🛻</span> JUAL DI MARKET
             </button>
           )}

           {/* JIKA TAB TOOLS: Info */}
           {activeTab === 'TOOLS' && (
             <div style={{textAlign:'center', fontSize:'0.75rem', color:'#03A9F4', background:'rgba(3, 169, 244, 0.1)', padding:10, borderRadius:10, border:'1px solid rgba(3, 169, 244, 0.3)'}}>
                ℹ️ Item aktif selama 24 Jam setelah digunakan.
             </div>
           )}

        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

export default WarehouseModal;