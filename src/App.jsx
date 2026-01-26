import { useState, useEffect } from 'react';
import './App.css'; 
import { ITEM_DETAILS } from './config/gameConstants';

// --- IMPORT MANAGER IKLAN ---
import { showAdStack } from './services/adManager'; 

import { 
  loginUser, startFarming, harvestCrop, sellAllItems, upgradePlan, 
  requestWithdraw, buyItem, spinWheel, claimDailyTask, useItem 
} from './services/api';

import MemberModal from './components/MemberModal';
import WithdrawModal from './components/WithdrawModal';
import MarketModal from './components/MarketModal';
import ProfileModal from './components/ProfileModal';
import WarehouseModal from './components/WarehouseModal';
import MenuModal from './components/MenuModal';
import FriendsModal from './components/FriendsModal';
import SpinModal from './components/SpinModal';
import DailyTaskModal from './components/DailyTaskModal';
import EncyclopediaModal from './components/EncyclopediaModal';

function App() {
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(false); // Loading Server (bukan iklan)
  const [activeModal, setActiveModal] = useState(null); 
  const [activePage, setActivePage] = useState(0);

  // --- INIT APP ---
  useEffect(() => {
    const initApp = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        const realId = tg.initDataUnsafe.user.id;
        const realUsername = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
        setCurrentUserId(realId);
        try {
          const userData = await loginUser(realId, realUsername);
          setUser(userData);
        } catch (e) { console.error("Login Error:", e); }
        tg.expand(); tg.ready();
        tg.setHeaderColor('#000000');
      } else {
        const dummyId = 123456789;
        setCurrentUserId(dummyId);
        try {
          const userData = await loginUser(dummyId, "CyberFarmer");
          setUser(userData);
        } catch (e) { console.error("Dev Login Error:", e); }
      }
    };
    initApp();
  }, []);

  const fetchUserData = async () => {
    if (!currentUserId) return;
    try {
      const data = await loginUser(currentUserId, null);
      setUser(data);
    } catch (err) { console.error("Refresh Error:", err); }
  };

  // --- HANDLERS DENGAN POP-UP HADIAH ---

  // 1. DAILY TASK
  const handleTaskClick = async (taskId) => {
     setActiveModal(null); 
     
     // Iklan Loading dihandle otomatis oleh adManager (Layar Hitam "MENCARI IKLAN")
     const success = await showAdStack(3);

     if (success) {
         try {
             setLoading(true); // Loading Server
             const res = await claimDailyTask(currentUserId, taskId);
             await fetchUserData();
             setLoading(false);
             
             // POP UP HADIAH (KEMBALI MUNCUL)
             alert(`Tugas Selesai!\nReward: +${res.reward || 'Bonus'} Coin`);
         } catch(e) {
             setLoading(false);
             alert(e.response?.data?.message || "Gagal klaim task");
         }
     } else {
         alert("Iklan dibatalkan/gagal. Reward tidak masuk.");
     }
  };

  // 2. FARMING / PANEN
  const handleSlotClick = async (slotId) => {
    if (!currentUserId) return;
    const slotData = user?.farm?.[slotId];
    
    // PANEN
    if (slotData && Date.now() >= slotData.harvestAt) {
      const success = await showAdStack(1); 

      if (success) {
          try {
              setLoading(true); 
              const res = await harvestCrop(currentUserId, slotId);
              await fetchUserData();
              setLoading(false);
              
              // POP UP HADIAH PANEN (Opsional, aktifkan jika mau)
              // alert(`Panen Sukses! Hasil masuk gudang.`); 
          } catch(e) {
              setLoading(false);
              alert(e.response?.data?.message || "Gagal panen");
          }
      }
      return; 
    }

    // TANAM
    try {
      setLoading(true);
      if (!slotData) {
        const slotNum = parseInt(slotId.replace('slot', ''));
        const userSlots = user.slots || [];
        if (!userSlots.includes(slotNum)) { 
          setLoading(false);
          if (slotNum === 2 || slotNum === 3) {
             if(confirm(`Slot ${slotNum} terkunci! Beli Lahan?`)) setActiveModal('MARKET'); 
          } else {
             if(confirm(`Slot ${slotNum} terkunci! Upgrade Member?`)) setActiveModal('MEMBER');
          }
          return; 
        }
        await startFarming(currentUserId, slotId);
      }
      await fetchUserData();
      setLoading(false);
    } catch (err) { 
        setLoading(false);
        alert(err.response?.data?.message || "Farm Error"); 
    }
  };

  // 3. SPIN WHEEL (FIX ITEM BOOSTER HILANG)
  const handleSpin = async (mode) => {
    if (!currentUserId) return;

    if (mode === 'FREE') {
        const success = await showAdStack(2); 
        if (!success) return; 
    }

    try {
      // API Spin
      const data = await spinWheel(currentUserId, mode);
      
      // Refresh user data AGAR ITEM BOOSTER MUNCUL DI GUDANG
      await fetchUserData(); 

      // Return data agar SpinModal bisa menampilkan animasi hadiah
      return data; 
    } catch (err) { throw err; }
  };

  // 4. JUAL
  const handleSell = async (useAdBooster, itemName = null, qty = null) => {
    if (!currentUserId) return;
    
    if (useAdBooster) {
        const success = await showAdStack(2);
        if (!success) return;
    }

    try {
      setLoading(true);
      const res = await sellAllItems(currentUserId, useAdBooster, itemName, qty);
      await fetchUserData();
      setLoading(false);
      
      // POP UP HASIL JUAL
      alert(`Terjual!\nTotal: ${res.totalReceived} PTS\n(Bonus Iklan: ${res.bonusPct}%)`);
    } catch (e) { 
        setLoading(false);
        alert(e.response?.data?.message || "Gagal Menjual"); 
    }
  };

  // --- FUNGSI STANDARD ---
  const handleBuyItem = async (itemId) => {
    if (!currentUserId) return;
    if(!confirm(`Beli item?`)) return;
    try {
      setLoading(true);
      await buyItem(currentUserId, itemId);
      await fetchUserData();
      setLoading(false);
      alert("Pembelian Berhasil!"); // POP UP BELI
    } catch (err) { 
        setLoading(false);
        alert("Gagal Beli"); 
    } 
  };

  const handleUseItem = async (itemId) => {
    if (!currentUserId) return;
    if(!confirm("Pakai item?")) return;
    try {
      setLoading(true);
      await useItem(currentUserId, itemId);
      await fetchUserData();
      setLoading(false);
      alert("Item Aktif!"); // POP UP PAKAI
    } catch (err) { 
        setLoading(false);
        alert("Gagal Pakai"); 
    } 
  };

  const handleUpgrade = async (planId) => {
    if (!currentUserId) return;
    if (!confirm(`Upgrade ke ${planId}?`)) return;
    try {
      setLoading(true);
      await upgradePlan(currentUserId, planId);
      setActiveModal(null);
      await fetchUserData();
      setLoading(false);
      alert("Upgrade Berhasil!"); // POP UP UPGRADE
    } catch (err) { 
        setLoading(false);
        alert("Gagal Upgrade"); 
    } 
  };

  const handleWithdraw = async (amount, address, method) => {
    if (!currentUserId) return;
    if(!confirm(`Withdraw ${amount}?`)) return;
    try {
      setLoading(true);
      await requestWithdraw(currentUserId, amount, address, method);
      setActiveModal(null);
      await fetchUserData();
      setLoading(false);
      alert("Request Terkirim."); // POP UP WD
    } catch (err) { 
        setLoading(false);
        alert("Gagal WD"); 
    } 
  };

  // --- RENDERERS ---
  const renderGridItems = () => {
    const items = [];
    
    // Header
    items.push(
      <div key="header-user" className="header-user">
        <div className="glass-panel" onClick={() => setActiveModal('PROFILE')}>
           <i className="fa-solid fa-user-astronaut fa-2x" style={{color:'#00E5FF'}}></i>
           <div>
              <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user?.username || 'Player'}</div>
              <div style={{fontSize:'0.6rem', color:'#FFD700'}}>{user?.plan || 'GUEST'}</div>
           </div>
        </div>
      </div>
    );
    items.push(
      <div key="header-wallet" className="header-wallet">
        <div className="glass-panel" onClick={() => setActiveModal('WITHDRAW')} style={{justifyContent:'center'}}>
           <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#FFD700', marginRight:10}}>{user?.balance.toLocaleString() || 0}</div>
           <i className="fa-solid fa-wallet fa-3x" style={{color:'#181078'}}></i>
        </div>
      </div>
    );

    // Warehouse
    items.push(
      <div key="zone-wh" className="zone-warehouse" onClick={() => setActiveModal('WAREHOUSE')}>
          {(() => {
             const current = user ? Object.values(user.inventory || {}).reduce((a,b)=>a+b, 0) : 0;
             const max = user?.storageLimit || 1;
             const pct = Math.min(100, (current / max) * 100);
             return (
               <>
                 <div className="custom-progress-container" style={{top: -25}}>
                    <div className="progress-fill-warehouse" style={{width: `${pct}%`}}></div>
                    <span className="progress-text">{current} / {max}</span>
                 </div>
                 <img src="/assets/warehouse_iso.png" alt="Warehouse" style={{
                    width:'130%', filter:'drop-shadow(0 10px 10px rgba(0,0,0,0.5))', transform: 'translateY(20px)'
                 }} />
               </>
             )
          })()}
      </div>
    );

    // Nav
    items.push(
      <div key="zone-nav" className="zone-nav">
          <div className="nav-buttons-row">
            <button onClick={() => setActiveModal('SPIN')} className="iso-circle-btn btn-spin"><i className="fa-solid fa-dharmachakra fa-spin"></i><span style={{fontSize:'0.5rem'}}>SPIN</span></button>
            <button onClick={() => setActiveModal('TASK')} className="iso-circle-btn btn-task"><i className="fa-solid fa-list-check"></i><span style={{fontSize:'0.5rem'}}>TASK</span></button>
            <button onClick={() => setActiveModal('ENCYCLOPEDIA')} className="iso-circle-btn btn-wiki"><i className="fa-solid fa-book-open"></i><span style={{fontSize:'0.5rem'}}>WIKI</span></button>
          </div>
          <div className="farm-nav-card">
              <div style={{display:'flex'}}>
                 {[0, 1, 2, 3].map(idx => (
                    <button key={idx} onClick={() => setActivePage(idx)} className={`mini-nav-btn ${activePage === idx ? 'active' : ''}`}>{idx + 1}</button>
                 ))}
              </div>
          </div>
      </div>
    );

    // Slots
    const startSlot = (activePage * 4) + 1;
    const currentSlots = [0, 1, 2, 3].map(offset => `slot${startSlot + offset}`);

    items.push(
      <div key="zone-farm" className="zone-farm">
         {user && currentSlots.map((slotId) => {
             const s = user.farm?.[slotId]; 
             const userSlots = user.slots || [];
             const slotNum = parseInt(slotId.replace('slot', ''));
             const locked = !userSlots.includes(slotNum);
             const now = Date.now();
             const isReady = s && now >= s.harvestAt;
             
             let progressPct = 0;
             let timeText = "";
             if (s && !isReady) {
                const totalDuration = 180000; 
                const timeLeft = s.harvestAt - now;
                const timeElapsed = totalDuration - timeLeft;
                progressPct = Math.min(100, Math.max(0, (timeElapsed / totalDuration) * 100));
                const secondsLeft = Math.ceil(timeLeft / 1000);
                timeText = `${secondsLeft}s`;
             }

             let overlayImage = null; 
             let showBubble = false;
             if (!locked && s) {
                if (isReady) {
                   overlayImage = '/assets/stage_growing.png'; 
                   showBubble = true;
                } else {
                   if (progressPct < 50) overlayImage = '/assets/stage_sprout.png';
                   else overlayImage = '/assets/stage_growing.png';
                }
             }
             const baseSoil = locked ? '/assets/soil_locked.png' : '/assets/soil_dry.png';

             return (
               <div key={slotId} onClick={() => handleSlotClick(slotId)} style={{
                  backgroundImage: `url(${baseSoil})`,
                  backgroundSize: 'contain', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  position:'relative', cursor:'pointer', width:'100%', height:'100%',
               }}>
                  {!locked && overlayImage && (
                    <img src={overlayImage} alt="Crop" style={{
                        position: 'absolute', top:0, width: '75%', height: 'auto', zIndex: 5, pointerEvents: 'none', 
                        filter: isReady ? 'drop-shadow(0 0 5px #39FF14)' : 'none'
                      }} 
                    />
                  )}
                  <div style={{position:'absolute', top:15, left:15, fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', textShadow:'0 1px 2px black', fontWeight:'bold', zIndex:15}}>#{slotNum}</div>
                  
                  {locked ? (
                     <div style={{marginTop:'30%', background:'black', color:'#FFD700', padding:'2px 8px', borderRadius:5, border:'1px solid #FFD700', fontSize:'0.7rem', zIndex:15}}>{slotNum === 2 ? '10k' : '750k'}</div>
                  ) : isReady ? (
                     <>
                      {showBubble && (
                         <div className="harvest-bubble" style={{zIndex: 20}}>
                            <div style={{fontSize:'2.8rem'}}>
                               {ITEM_DETAILS[s.cropName]?.icon || '験'} 
                            </div>
                         </div>
                       )}
                       <div className="harvest-label" style={{zIndex: 20}}>PANEN!</div>
                     </>
                  ) : s ? (
                     <div className="custom-progress-container" style={{top: '10%', width: '70%'}}>
                        <div className="progress-fill-farm" style={{width: `${progressPct}%`}}></div>
                        <span className="progress-text">{timeText}</span>
                     </div>
                  ) : (
                     <div style={{marginTop:'20%', border:'1px dashed #aaa', color:'#aaa', padding:'2px 8px', borderRadius:5, fontSize:'0.6rem', zIndex:15}}>TANAM</div>
                  )}
               </div>
             )
         })}
      </div>
    );

    items.push(
      <div key="footer" className="iso-footer">
          <MenuBtn icon="fa-solid fa-user" txt="Profile" onClick={() => setActiveModal('PROFILE')}/>
          <MenuBtn icon="fa-solid fa-users" txt="Friends" onClick={() => setActiveModal('FRIENDS')}/>
          <MenuBtn icon="fa-solid fa-shop" txt="Market" onClick={() => setActiveModal('MARKET')}/>
          <MenuBtn icon="fa-solid fa-crown" txt="Member" onClick={() => setActiveModal('MEMBER')}/>
          <MenuBtn icon="fa-solid fa-bars" txt="Menu" onClick={() => setActiveModal(activeModal === 'MENU' ? null : 'MENU')}/>
      </div>
    );

    return items;
  };

  // Loading Indicator (SERVER ONLY)
  if (loading) {
      return (
          <div style={{
              position:'fixed', top:0, left:0, width:'100%', height:'100%', 
              background:'rgba(0,0,0,0.8)', zIndex:999999, 
              display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#00E5FF'
          }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{marginBottom:15}}></i>
              <div style={{fontWeight:'bold'}}>MENGHUBUNGI SERVER...</div>
          </div>
      );
  }

  if (!currentUserId) return <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#0f0', display:'flex', justifyContent:'center', alignItems:'center'}}>INITIALIZING...</div>;

  return (
    <div className="game-container">
      {renderGridItems()}
      
      {/* Container Adextra */}
      <div id="adextra-overlay" style={{display:'none', position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.95)', zIndex:99999, flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          <div style={{color:'white', marginBottom:10, fontSize:'0.8rem'}}>Sponsored Ad</div>
          <div id="25e584f1c176cb01a08f07b23eca5b3053fc55b8"></div>
          <button id="adextra-close-btn" style={{marginTop:20, padding:'10px 20px', background:'red', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>TUTUP IKLAN</button>
      </div>

      <MemberModal isOpen={activeModal === 'MEMBER'} onClose={() => setActiveModal(null)} currentPlan={user?.plan} onUpgrade={handleUpgrade} loading={loading} />
      <WithdrawModal isOpen={activeModal === 'WITHDRAW'} onClose={() => setActiveModal(null)} userBalance={user?.balance || 0} onWithdraw={handleWithdraw} loading={loading} userId={currentUserId} />
      <ProfileModal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal(null)} user={user} />
      <MenuModal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} />
      <FriendsModal isOpen={activeModal === 'FRIENDS'} onClose={() => setActiveModal(null)} user={user} onRefresh={fetchUserData} />
      <EncyclopediaModal isOpen={activeModal === 'ENCYCLOPEDIA'} onClose={() => setActiveModal(null)} />

      <WarehouseModal 
          isOpen={activeModal === 'WAREHOUSE'} 
          onClose={() => setActiveModal(null)} 
          inventory={user?.inventory || {}} 
          storageLimit={user?.storageLimit || 50} 
          onOpenMarket={() => setActiveModal('MARKET')}
          onUseItem={handleUseItem}
          loading={loading}
      />
      
      <MarketModal 
          isOpen={activeModal === 'MARKET'} 
          onClose={() => setActiveModal(null)} 
          user={user || {}} 
          onSellAll={(itemName) => handleSell(false, itemName)} 
          onBuyItem={handleBuyItem} 
          loading={loading}
          onWatchAd={() => handleSell(true)} 
      />

      <SpinModal 
          isOpen={activeModal === 'SPIN'} 
          onClose={() => setActiveModal(null)} 
          onSpin={handleSpin} 
          userBalance={user?.balance || 0} 
          lastFreeSpin={user?.lastFreeSpin} 
          onWatchAd={() => {}} 
      />

      <DailyTaskModal 
          isOpen={activeModal === 'TASK'} 
          onClose={() => setActiveModal(null)} 
          user={user} 
          onRefresh={fetchUserData}
          onClaimTask={handleTaskClick} 
      />
    </div>
  );
}

const MenuBtn = ({icon, txt, onClick}) => (
  <button onClick={onClick} className="menu-btn-style">
    <i className={icon}></i>
    {txt}
  </button>
);

export default App;
