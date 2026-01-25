import { useState, useEffect } from 'react';
import './App.css'; 
import { ITEM_DETAILS } from './config/gameConstants';

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
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [activePage, setActivePage] = useState(0);

  // --- STATE UNTUK IKLAN & REWARD ---
  const [adState, setAdState] = useState({
    show: false,
    step: 'IDLE', // IDLE, WATCHING, REWARD
    timer: 3,
    context: null, 
    slotId: null,   // Untuk Panen
    cropName: '',   // Untuk Panen
    taskId: null,   // Untuk Task
    rewardAmount: 0 // Untuk Task/Spin
  });

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

  // --- LOGIKA TIMER IKLAN ---
  useEffect(() => {
    let adInterval;
    if (adState.show && adState.step === 'WATCHING') {
      adInterval = setInterval(() => {
        setAdState((prev) => {
          if (prev.timer <= 1) {
            clearInterval(adInterval);
            return { ...prev, step: 'REWARD', timer: 0 }; // Selesai nonton -> Pindah ke Reward
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(adInterval);
  }, [adState.show, adState.step]);

  const fetchUserData = async () => {
    if (!currentUserId) return;
    try {
      const data = await loginUser(currentUserId, null);
      setUser(data);
    } catch (err) { console.error("Refresh Error:", err); }
  };

  // --- HANDLERS ---

  const handleTaskClick = (taskId) => {
     // Simulasi acak reward task
     const randomReward = Math.floor(Math.random() * (200 - 80 + 1)) + 80;
     setActiveModal(null); 
     setAdState({
        show: true, step: 'WATCHING', timer: 3,
        context: 'TASK', taskId: taskId, rewardAmount: randomReward
     });
  };

  const handleSlotClick = async (slotId) => {
    if (!currentUserId) return;
    const slotData = user?.farm?.[slotId];
    
    // A. CEK APAKAH SIAP PANEN?
    if (slotData && Date.now() >= slotData.harvestAt) {
      setAdState({
        show: true, step: 'WATCHING', timer: 3, 
        context: 'FARM', slotId: slotId, cropName: slotData.cropName
      });
      return; 
    }

    // B. LOGIKA TANAM / BELI LAHAN
    try {
      setLoading(true);
      if (!slotData) {
        const slotNum = parseInt(slotId.replace('slot', ''));
        const userSlots = user.slots || [];
        
        if (!userSlots.includes(slotNum)) { 
          if (slotNum === 2 || slotNum === 3) {
             if(confirm(`Slot ${slotNum} is locked! Buy Land in Market?`)) setActiveModal('MARKET'); 
          } else {
             if(confirm(`Slot ${slotNum} is locked! Upgrade Membership to unlock?`)) setActiveModal('MEMBER');
          }
          return; 
        }
        await startFarming(currentUserId, slotId);
      }
      await fetchUserData();
    } catch (err) { 
      alert(err.response?.data?.message || "Farm Error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleClaimReward = async () => {
    try {
      setLoading(true);

      if (adState.context === 'FARM') {
          await harvestCrop(currentUserId, adState.slotId);
      } else if (adState.context === 'TASK') {
          try { await claimDailyTask(currentUserId, adState.taskId); } catch(e){}
          setUser(prev => ({...prev, balance: prev.balance + adState.rewardAmount}));
      } else if (adState.context === 'SPIN_CLAIM') {
          // Spin reward logic handled by spin.js backend
      } else if (adState.context === 'MARKET_BOOST') {
           // Logic Market Boost (misal panggil API boost)
           // Untuk sekarang visual saja atau implementasi API boost
           alert("Market Boost Activated!");
      }
      
      setAdState({ show: false, step: 'IDLE', timer: 3, context: null, slotId:null, cropName:'', taskId:null, rewardAmount:0 });
      await fetchUserData();

    } catch (err) {
      alert("Gagal klaim: " + err.message);
      setAdState({ show: false, step: 'IDLE', timer: 3, context: null });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (useAdBooster, itemName = null, qty = null) => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const res = await sellAllItems(currentUserId, useAdBooster, itemName, qty);
      alert(`Berhasil Terjual!\n+${res.totalReceived} PTS\n(Bonus: ${res.bonusPct}%)`);
      await fetchUserData();
    } catch (e) { 
        alert(e.response?.data?.message || "Gagal Menjual"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleBuyItem = async (itemId) => {
    if (!currentUserId) return;
    if(!confirm(`Buy this item?`)) return;
    try {
      setLoading(true);
      await buyItem(currentUserId, itemId);
      alert("Purchase Successful!");
      await fetchUserData(); 
    } catch (err) { alert(err.response?.data?.message || "Purchase Failed"); } 
    finally { setLoading(false); }
  };

  const handleUseItem = async (itemId) => {
    if (!currentUserId) return;
    if(!confirm("Aktifkan item ini selama 24 Jam?")) return;
    try {
      setLoading(true);
      await useItem(currentUserId, itemId);
      alert("Item BERHASIL Diaktifkan! Efek berlaku 24 Jam.");
      await fetchUserData(); 
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menggunakan item");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!currentUserId) return;
    if (!confirm(`Upgrade to ${planId}?`)) return;
    try {
      setLoading(true);
      await upgradePlan(currentUserId, planId);
      alert("Upgrade Successful!");
      setActiveModal(null);
      await fetchUserData();
    } catch (err) { alert(err.response?.data?.message || "Upgrade Failed"); } 
    finally { setLoading(false); }
  };

  const handleWithdraw = async (amount, address, method) => {
    if (!currentUserId) return;
    if(!confirm(`Withdraw ${amount} PTS via ${method}?`)) return;
    try {
      setLoading(true);
      await requestWithdraw(currentUserId, amount, address, method);
      alert("Withdrawal request sent.");
      setActiveModal(null);
      await fetchUserData();
    } catch (err) { alert(err.response?.data?.message || "Withdraw Failed"); } 
    finally { setLoading(false); }
  };

  const handleSpin = async (mode) => {
    if (!currentUserId) return;
    try {
      const data = await spinWheel(currentUserId, mode);
      await fetchUserData(); 
      return data; 
    } catch (err) { throw err; }
  };

  // --- RENDERERS ---
  const renderGridItems = () => {
    const items = [];
    
    // Header User
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

    // Header Wallet
    items.push(
      <div key="header-wallet" className="header-wallet">
        <div className="glass-panel" onClick={() => setActiveModal('WITHDRAW')} style={{justifyContent:'center'}}>
           <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#FFD700', marginRight:10}}>{user?.balance.toLocaleString() || 0}</div>
           <i className="fa-solid fa-wallet fa-xl" style={{color:'#FFD700'}}></i>
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
                    width:'150%', filter:'drop-shadow(0 10px 10px rgba(0,0,0,0.5))', transform: 'translateY(-10px)'
                 }} />
               </>
             )
          })()}
      </div>
    );

    // Navigasi
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

    // Farm Slots
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
                        position: 'absolute', bottom: 0, width: '100%', height: 'auto', zIndex: 5, pointerEvents: 'none', 
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
                            <div style={{fontSize:'1.8rem'}}>
                               {ITEM_DETAILS[s.cropName]?.icon || '🌱'} 
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

  const renderAdOverlay = () => {
    if (!adState.show) return null;
    return (
      <div className="ad-overlay">
        {adState.step === 'WATCHING' && (
          <div className="ad-watching-container">
            <div className="ad-timer-circle">{adState.timer}</div>
            <div className="ad-text">MEMUTAR IKLAN...</div>
            <div style={{fontSize:'0.8rem', color:'#aaa', marginTop:10}}>Harap tunggu sampai selesai</div>
          </div>
        )}

        {adState.step === 'REWARD' && (
          <div className="reward-container">
             <div className="reward-title">
                {adState.context === 'SPIN_CLAIM' ? 'SPIN REWARD!' : 'CONGRATULATIONS!'}
             </div>
             
             {adState.context === 'FARM' && (
                 <>
                   <div style={{color:'white'}}>Anda panen tanaman:</div>
                   <div className="reward-icon-wrapper">
                      <div style={{fontSize:'3rem'}}>{ITEM_DETAILS[adState.cropName]?.icon || '🌱'}</div>
                   </div>
                   <div style={{color:'#FFD700', fontWeight:'bold', fontSize:'1.2rem', marginBottom:20}}>
                     {adState.cropName}
                   </div>
                 </>
             )}

             {adState.context === 'TASK' && (
                 <>
                   <div style={{color:'white'}}>Daily Task Reward:</div>
                   <div className="reward-icon-wrapper" style={{borderColor:'#FFD700', boxShadow:'inset 0 0 20px rgba(255, 215, 0, 0.5)'}}>
                      <div style={{fontSize:'3rem'}}>💰</div>
                   </div>
                   <div style={{color:'#FFD700', fontWeight:'bold', fontSize:'2rem', marginBottom:20, textShadow:'0 0 10px gold'}}>
                     +{adState.rewardAmount} PTS
                   </div>
                 </>
             )}

             {(adState.context === 'SPIN_CLAIM' || adState.context === 'MARKET_BOOST') && (
                 <>
                   <div style={{color:'white'}}>Reward Diterima:</div>
                   <div className="reward-icon-wrapper" style={{borderColor:'#E040FB', boxShadow:'inset 0 0 20px rgba(224, 64, 251, 0.5)'}}>
                      <div style={{fontSize:'3rem'}}>
                         {adState.cropName || '🎁'} 
                      </div>
                   </div>
                   <div style={{color:'#E040FB', fontWeight:'bold', fontSize:'1.5rem', marginBottom:20, textShadow:'0 0 10px #E040FB'}}>
                     {adState.rewardAmount}
                   </div>
                 </>
             )}

             <button className="btn-claim" onClick={handleClaimReward} disabled={loading}>
                {loading ? 'Processing...' : 'OK, TERIMA'}
             </button>
          </div>
        )}
      </div>
    );
  };

  if (!currentUserId) return <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#0f0', display:'flex', justifyContent:'center', alignItems:'center'}}>LOADING...</div>;

  return (
    <div className="game-container">
      {renderGridItems()}
      {renderAdOverlay()}

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
          // PERBAIKAN: Menggunakan setAdState langsung, bukan triggerAdSequence yang belum ada
          onWatchAd={(adData) => setAdState({ 
              show: true, step: 'WATCHING', timer: 3, ...adData 
          })} 
      />

      <SpinModal 
          isOpen={activeModal === 'SPIN'} 
          onClose={() => setActiveModal(null)} 
          onSpin={handleSpin} 
          userBalance={user?.balance || 0} 
          lastFreeSpin={user?.lastFreeSpin} 
          onWatchAd={(adData) => setAdState({ 
              show: true, step: 'WATCHING', timer: 3, ...adData 
          })}
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