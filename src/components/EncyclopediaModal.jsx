import React, { useState } from 'react';
import { CROPS, ITEM_DETAILS } from '../config/gameConstants';

// Helper untuk format waktu (Detik -> Menit/Jam)
const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  return `${min}m`;
};

const EncyclopediaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // State untuk Tab Filter (All, Common, Rare, etc.)
  const [activeTab, setActiveTab] = useState('ALL');
  const rarities = ['ALL', ...Object.keys(CROPS)];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '90%', maxHeight: '90%', 
        // GLASSMORPHISM CONTAINER (Senada dengan Warehouse)
        background: 'linear-gradient(160deg, rgba(30,30,40,0.95) 0%, rgba(10,10,20,0.98) 100%)', 
        border: '1px solid rgba(224, 64, 251, 0.3)', // Border Ungu Neon (Khas Wiki)
        borderRadius: 20,
        boxShadow: '0 0 30px rgba(224, 64, 251, 0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white'
      }}>
        
        {/* HEADER */}
        <div style={{
            padding: '15px 20px', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', 
            display:'flex', justifyContent:'space-between', alignItems:'center',
            background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
             <span style={{fontSize:'1.5rem'}}>📖</span>
             <div>
                <h2 style={{margin:0, fontSize:'1.1rem', letterSpacing:'1px', textTransform:'uppercase', color:'#E040FB'}}>ENCYCLOPEDIA</h2>
                <div style={{fontSize:'0.6rem', color:'#aaa'}}>Crop Guide & Prices</div>
             </div>
          </div>
          <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.1)', border:'none', color:'white', 
              width:35, height:35, borderRadius:'50%', cursor:'pointer', fontSize:'1rem'
          }}>✕</button>
        </div>

        {/* TABS FILTER */}
        <div style={{
            padding: '10px 15px', display:'flex', gap:8, overflowX:'auto', 
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            scrollbarWidth: 'none' // Hide scrollbar Firefox
        }}>
           {rarities.map(rarity => (
             <button key={rarity} 
               onClick={() => setActiveTab(rarity)}
               style={{
                 padding: '6px 12px', borderRadius: 20, border: 'none',
                 fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                 background: activeTab === rarity ? '#E040FB' : 'rgba(255,255,255,0.1)',
                 color: activeTab === rarity ? 'white' : '#aaa',
                 transition: 'all 0.2s'
               }}
             >
               {rarity}
             </button>
           ))}
        </div>

        {/* CONTENT LIST */}
        <div style={{flex:1, overflowY:'auto', padding:15}}>
           {Object.entries(CROPS).map(([rarityKey, data]) => {
              // Filter Logic
              if (activeTab !== 'ALL' && activeTab !== rarityKey) return null;

              // Tentukan Warna Header berdasarkan Rarity (Ambil contoh warna dari item pertama)
              const sampleItem = data.items[0];
              const rarityColor = ITEM_DETAILS[sampleItem]?.color || '#ccc';

              return (
                <div key={rarityKey} style={{marginBottom: 20}}>
                   {/* Rarity Header Card */}
                   <div style={{
                       background: `linear-gradient(90deg, ${rarityColor}20, transparent)`,
                       borderLeft: `4px solid ${rarityColor}`,
                       padding: '8px 12px', borderRadius: '0 10px 10px 0',
                       display:'flex', justifyContent:'space-between', alignItems:'center',
                       marginBottom: 10
                   }}>
                      <div>
                        <div style={{color: rarityColor, fontWeight:'bold', fontSize:'0.9rem'}}>{rarityKey}</div>
                        <div style={{fontSize:'0.65rem', color:'#ccc'}}>Chance: {(data.chance * 100).toFixed(1)}%</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                         <div style={{fontSize:'0.7rem', color:'#ddd'}}>⏳ {formatTime(data.growthTime)}</div>
                         <div style={{fontSize:'0.7rem', color:'#FFD700'}}>💰 {data.priceRange[0]} - {data.priceRange[1]} PTS</div>
                      </div>
                   </div>

                   {/* Grid Items dalam Rarity ini */}
                   <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:10}}>
                      {data.items.map(itemName => {
                         const itemVisual = ITEM_DETAILS[itemName] || { icon: '❓', color: '#ccc' };
                         return (
                           <div key={itemName} style={{
                              background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10,
                              display:'flex', flexDirection:'column', alignItems:'center',
                              border: `1px solid ${rarityColor}30`
                           }}>
                              <div style={{fontSize:'2rem', marginBottom:5, filter:'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'}}>
                                 {itemVisual.icon}
                              </div>
                              <div style={{fontSize:'0.65rem', textAlign:'center', color:'#eee', lineHeight:1.1}}>
                                 {itemName}
                              </div>
                           </div>
                         )
                      })}
                   </div>
                </div>
              )
           })}
        </div>

      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

export default EncyclopediaModal;