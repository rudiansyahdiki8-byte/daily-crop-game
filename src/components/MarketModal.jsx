import { useState } from 'react';
import { LAND_PLOTS, CONSUMABLES } from '../config/gameConstants'; 

const MarketModal = ({ isOpen, onClose, user, onSellAll, onBuyItem, loading }) => {
  const [activeTab, setActiveTab] = useState('BUY'); 

  if (!isOpen) return null;

  // --- SAFETY CHECK & DATA USER ---
  const userSlots = user?.slots || [];
  const userInventory = user?.inventory || {};
  const userBalance = user?.balance || 0;
  const userPlan = user?.plan || 'FREE';
  const userStorageLimit = user?.storageLimit || 50;

  // --- HALAMAN TOKO (BUY) ---
  const renderShop = () => {
    // 1. DEFINISI VARIABEL PENTING (JANGAN DIHAPUS)
    const userBuffs = user?.buffs || {}; 
    const now = Date.now();

    return (
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        
        {/* HEADER KATEGORI */}
        <div style={{color:'#888', fontSize:'0.8rem', fontWeight:'bold', borderBottom:'1px solid #444', paddingBottom:5, marginBottom:5}}>ASET PERMANEN</div>

        {/* ITEM 1: LAND PLOT #2 */}
        <ShopItem 
           name="Land Plot #2" 
           price={LAND_PLOTS?.SLOT_2?.cost || 10000} 
           icon="🚧"
           isOwned={userSlots.includes(2)}
           onBuy={() => onBuyItem('SLOT_2')}
           loading={loading}
           desc="Membuka Slot Tanam ke-2"
        />
        
        {/* ITEM 2: LAND PLOT #3 */}
        <ShopItem 
           name="Land Plot #3" 
           price={LAND_PLOTS?.SLOT_3?.cost || 750000} 
           icon="🏗️"
           isOwned={userSlots.includes(3)}
           disabled={!userSlots.includes(2)} // Harus punya slot 2 dulu
           onBuy={() => onBuyItem('SLOT_3')}
           loading={loading}
           desc="Membuka Slot Tanam ke-3"
        />

        {/* ITEM 3: EXTRA STORAGE */}
        <ShopItem 
           name="Gudang +20" 
           price={2000} 
           icon="📦"
           onBuy={() => onBuyItem('STORAGE_20')}
           loading={loading}
           desc="Menambah kapasitas gudang"
           isConsumable={true}
        />

        {/* HEADER KATEGORI BUFF */}
        <div style={{color:'#888', fontSize:'0.8rem', fontWeight:'bold', borderBottom:'1px solid #444', paddingBottom:5, marginBottom:5, marginTop:15}}>BUFF AKTIF (24 JAM)</div>

        {/* LOOP ITEM CONSUMABLES */}
        {/* Pastikan CONSUMABLES terimport dari gameConstants */}
        {CONSUMABLES && Object.values(CONSUMABLES).map(item => {
           // Cek apakah buff sedang aktif (waktu expire > sekarang)
           const isActive = (userBuffs[item.id] || 0) > now;
           
           return (
             <ShopItem 
               key={item.id}
               name={item.name}
               price={item.price}
               icon="⚡"
               onBuy={() => onBuyItem(item.id)}
               loading={loading}
               desc={item.desc}
               isOwned={isActive} 
               isConsumable={false}
               customLabel={isActive ? "AKTIF" : null}
             />
           );
        })}
      </div>
    );
  };

  // --- HALAMAN GUDANG (SELL) ---
  const renderSell = () => {
    const totalItems = Object.values(userInventory).reduce((a,b)=>a+b, 0);
    return (
       <div style={{textAlign:'center', padding:20}}>
          <div style={{fontSize:'3rem', marginBottom:10}}>🚛</div>
          <p>Isi Gudang: {totalItems} / {userStorageLimit} Item</p>
          <p style={{fontSize:'0.8rem', color:'#aaa', marginBottom:20}}>
             Harga jual berubah setiap jam secara acak. <br/>
             (Bonus Member: +{userPlan === 'OWNER' ? '30%' : userPlan === 'TENANT' ? '15%' : userPlan === 'MORTGAGE' ? '5%' : '0%'})
          </p>
          
          <button 
            onClick={onSellAll}
            disabled={loading || totalItems === 0}
            style={{
              width:'100%', padding:15, background: totalItems > 0 ? '#4CAF50' : '#555', 
              color:'white', border:'none', borderRadius:10, fontWeight:'bold', fontSize:'1.1rem', cursor: 'pointer'
            }}
          >
             {loading ? 'Menjual...' : 'JUAL SEMUA HASIL PANEN'}
          </button>
       </div>
    );
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '90%', height:'80%', background: '#222', border: '1px solid #aaa', borderRadius: 15,
        display:'flex', flexDirection:'column', overflow:'hidden'
      }}>
        {/* TAB HEADER */}
        <div style={{display:'flex', borderBottom:'1px solid #444'}}>
          <button 
             onClick={() => setActiveTab('BUY')}
             style={{flex:1, padding:15, background: activeTab==='BUY'?'#222':'#111', color: activeTab==='BUY'?'#FFC107':'#888', border:'none', fontWeight:'bold'}}
          >
             TOKO (BUY)
          </button>
          <button 
             onClick={() => setActiveTab('SELL')}
             style={{flex:1, padding:15, background: activeTab==='SELL'?'#222':'#111', color: activeTab==='SELL'?'#4CAF50':'#888', border:'none', fontWeight:'bold'}}
          >
             GUDANG (SELL)
          </button>
          <button onClick={onClose} style={{padding:'0 15px', background:'#B71C1C', color:'white', border:'none'}}>✕</button>
        </div>

        {/* ISI KONTEN */}
        <div style={{flex:1, padding:15, overflowY:'auto'}}>
           {activeTab === 'BUY' ? renderShop() : renderSell()}
        </div>
        
        {/* FOOTER SALDO */}
        <div style={{padding:10, background:'#111', textAlign:'center', borderTop:'1px solid #333'}}>
           Saldo Anda: <span style={{color:'#FFC107', fontWeight:'bold'}}>{userBalance} PTS</span>
        </div>
      </div>
    </div>
  );
};

// SUB-KOMPONEN ITEM TOKO
const ShopItem = ({name, price, icon, isOwned, disabled, onBuy, loading, desc, isConsumable, customLabel}) => (
  <div style={{
     display:'flex', alignItems:'center', background:'#333', padding:10, borderRadius:8, marginBottom:10,
     border: (isOwned || customLabel) ? '1px solid #4CAF50' : '1px solid #555', opacity: disabled ? 0.5 : 1
  }}>
     <div style={{fontSize:'2rem', marginRight:10}}>{icon}</div>
     <div style={{flex:1}}>
        <div style={{fontWeight:'bold', color:'white'}}>{name}</div>
        <div style={{fontSize:'0.7rem', color:'#ccc'}}>{desc}</div>
     </div>
     <div>
        {customLabel ? (
           <span style={{color:'#000', background:'#4CAF50', fontWeight:'bold', fontSize:'0.7rem', padding:'3px 8px', borderRadius:5}}>{customLabel}</span>
        ) : isOwned && !isConsumable ? (
           <span style={{color:'#4CAF50', fontWeight:'bold', fontSize:'0.8rem'}}>SUDAH PUNYA</span>
        ) : (
           <button 
             onClick={onBuy}
             disabled={loading || disabled}
             style={{
                background: '#FFC107', border:'none', padding:'5px 10px', borderRadius:5, 
                fontWeight:'bold', color:'#000', cursor:'pointer'
             }}
           >
              {price} PTS
           </button>
        )}
     </div>
  </div>
);

export default MarketModal;