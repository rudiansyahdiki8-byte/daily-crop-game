import { useState } from 'react';

// Helper Warna Rarity 
const getRarityColor = (itemName) => {
  // Mapping sederhana berdasarkan nama item
  const lower = itemName.toLowerCase();
  if (['wasabi', 'black garlic', 'black truffle'].some(x => lower.includes(x))) return '#FFD700'; // Legendary (Gold)
  if (['shiitake', 'artichoke', 'bamboo', 'giant pumpkin'].some(x => lower.includes(x))) return '#9C27B0'; // Epic (Purple)
  if (['asparagus', 'pepper', 'cauliflower', 'purple', 'oyster'].some(x => lower.includes(x))) return '#2196F3'; // Rare (Blue)
  if (['tomato', 'carrot', 'broccoli', 'potato', 'cucumber'].some(x => lower.includes(x))) return '#4CAF50'; // Uncommon (Green)
  return '#9E9E9E'; // Common (Gray)
};

const WarehouseModal = ({ isOpen, onClose, inventory, storageLimit, onOpenMarket }) => {
  if (!isOpen) return null;

  const totalItems = Object.values(inventory || {}).reduce((a, b) => a + b, 0);
  const percentage = Math.min((totalItems / storageLimit) * 100, 100);
  
  // Logic Warna Progress Bar 
  let progressColor = '#4CAF50'; // Hijau
  if (percentage > 50) progressColor = '#FFC107'; // Kuning
  if (percentage > 90) progressColor = '#F44336'; // Merah

  const inventoryList = Object.entries(inventory || {}).filter(([_, qty]) => qty > 0);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '85%', maxHeight: '80%', background: '#3E2723', 
        border: '2px solid #8D6E63', borderRadius: 15,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.8)'
      }}>
        
        {/* HEADER */}
        <div style={{padding: 15, background: '#2D1B18', borderBottom: '1px solid #5D4037', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0, color:'#D7CCC8', fontSize:'1.2rem'}}>📦 Gudang</h2>
          <button onClick={onClose} style={{background:'transparent', border:'none', color:'#aaa', fontSize:'1.2rem'}}>✕</button>
        </div>

        {/* PROGRESS BAR KAPASITAS [cite: 53, 54] */}
        <div style={{padding: '15px 15px 5px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#D7CCC8', marginBottom:5}}>
            <span>Kapasitas</span>
            <span>{totalItems} / {storageLimit}</span>
          </div>
          <div style={{width:'100%', height:10, background:'#1a1a1a', borderRadius:5, overflow:'hidden'}}>
            <div style={{
              width: `${percentage}%`, height:'100%', 
              background: progressColor,
              transition: 'width 0.5s ease'
            }}/>
          </div>
          {percentage >= 100 && <div style={{color:'#F44336', fontSize:'0.7rem', marginTop:5, textAlign:'center'}}>GUDANG PENUH! Tidak bisa panen.</div>}
        </div>

        {/* LIST ITEM */}
        <div style={{flex:1, overflowY:'auto', padding:15, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, alignContent:'start'}}>
          {inventoryList.length === 0 ? (
            <div style={{gridColumn:'1/4', textAlign:'center', color:'#8D6E63', marginTop:20}}>
              Kosong...<br/><span style={{fontSize:'0.8rem'}}>Ayo Tanam & Panen!</span>
            </div>
          ) : (
            inventoryList.map(([name, qty]) => (
              <div key={name} style={{
                background: '#2D1B18', 
                borderRadius: 8, padding: 8,
                 border: `2px solid ${getRarityColor(name)}`, // [cite: 56]
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{fontSize:'2rem', marginBottom:5}}>
                  {/* Icon Mapping Sederhana */}
                  {name.includes('Spinach') ? '🥬' : name.includes('Corn') ? '🌽' : name.includes('Tomato') ? '🍅' : '🌱'}
                </div>
                <div style={{fontSize:'0.6rem', color:'#D7CCC8', textAlign:'center', lineHeight:1.2}}>{name}</div>
                <div style={{
                  position:'absolute', top:-5, right:-5, 
                  background: getRarityColor(name), color:'#000', 
                  fontSize:'0.7rem', fontWeight:'bold', padding:'2px 6px', borderRadius:10
                }}>
                  x{qty}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{padding: 15, background: '#2D1B18', borderTop: '1px solid #5D4037'}}>
           <button 
             onClick={() => { onClose(); onOpenMarket(); }}
             style={{
               width:'100%', padding:12, background: '#FFC107', 
               color: '#3E2723', fontWeight:'bold', border:'none', borderRadius:8,
               cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5
             }}
           >
             <span>⬆️</span> Upgrade Kapasitas
           </button>
        </div>

      </div>
    </div>
  );
};

export default WarehouseModal;