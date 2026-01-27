import { useState, useEffect } from 'react';
import './App.css'; 
import { ITEM_DETAILS, DAILY_TASKS_LIST } from './config/gameConstants';

// --- SERVICES ---
import { showAdStack, showRewardPopup, showConfirmPopup } from './services/adManager'; 
import { 
  loginUser, sellAllItems, upgradePlan, requestWithdraw, 
  buyItem, spinWheel, claimDailyTask, useItem, bindUpline // <-- Import bindUpline
} from './services/api';

// --- COMPONENTS ---
import FarmGrid from './components/FarmGrid';       
import ModalManager from './components/ModalManager'; 

function App() {
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [activePage, setActivePage] = useState(0); 
  const [, setTick] = useState(0);

  // 1. INIT & LOGIN & AUTO-BIND
  useEffect(() => {
    const initApp = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        const realId = tg.initDataUnsafe.user.id;
        const realUsername = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
        
        // Ambil Parameter Referral (jika ada)
        // Format link: t.me/bot?startapp=12345
        const startParam = tg.initDataUnsafe.start_param; 

        setCurrentUserId(realId);
        try {
          const userData = await loginUser(realId, realUsername);
          setUser(userData);

          // --- LOGIC AUTO BIND ---
          // Jika punya parameter, belum punya upline, dan bukan kode sendiri
          if (startParam && !userData.uplineId && String(startParam) !== String(realId)) {
              try {
                  console.log("Auto-Binding to:", startParam);
                  await bindUpline(realId, startParam);
                  // Refresh user data setelah bind sukses
                  const updatedUser = await loginUser(realId, null);
                  setUser(updatedUser);
                  // Opsional: Tampilkan notif
                  // showRewardPopup("WELCOME!", "You accepted an invite!", "fa-handshake");
              } catch (err) {
                  console.log("Auto-Bind skipped:", err.message);
              }
          }
          // -----------------------

        } catch (e) { console.error("Login Error:", e); }
        
        tg.expand(); 
        tg.ready();
        tg.setHeaderColor('#000000');
      } else {
        // Dev Mode
        const dummyId = 123456789;
        setCurrentUserId(dummyId);
        try {
          const userData = await loginUser(dummyId, "CyberFarmer");
          setUser(userData);
        } catch (e) { console.error("Dev Login Error:", e); }
      }
    };
    initApp();

    const interval = setInterval(() => setTick(t => t + 1), 60000); 
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    if (!currentUserId) return;
    try {
      const data = await loginUser(currentUserId, null);
      setUser(data);
    } catch (err) { console.error("Refresh Error:", err); }
  };

  // ... (HANDLERS LAINNYA TIDAK BERUBAH - COPY PASTE DARI YANG LAMA) ...
  // (Pastikan handleTaskClick, handleSpin, handleSell dll tetap ada)

  // 2. HANDLERS
  const handleTaskClick = async (taskId) => {
     setActiveModal(null); 
     const success = await showAdStack(3); 
     if (success) {
         try {
             setLoading(true); 
             const res = await claimDailyTask(currentUserId, taskId);
             await fetchUserData();
             setLoading(false);
             await showRewardPopup("TASK COMPLETED!", `${res.reward} PTS`, "fa-check-circle");
         } catch(e) { setLoading(false); await showRewardPopup("ERROR", e.response?.data?.message || "Task Failed", "fa-xmark"); }
     }
  };

  const handleSpin = async (mode, step = null) => {
    if (!currentUserId) return;
    try {
      const data = await spinWheel(currentUserId, mode, step);
      await fetchUserData(); 
      return data; 
    } catch (err) { throw err; }
  };

  const handleSell = async (useAdBooster, itemName = null, qty = null) => {
    if (!currentUserId) return;
    if (useAdBooster) { if (!(await showAdStack(2))) return; }
    try {
      setLoading(true);
      const res = await sellAllItems(currentUserId, useAdBooster, itemName, qty);
      await fetchUserData();
      setLoading(false);
      await showRewardPopup("SOLD!", `Received ${res.totalReceived} PTS`, "fa-sack-dollar");
    } catch (e) { setLoading(false); await showRewardPopup("ERROR", e.response?.data?.message || "Sell Failed", "fa-xmark"); }
  };

  const handleBuyItem = async (itemId) => {
    if (!currentUserId) return;
    const confirmBuy = await showConfirmPopup("CONFIRM PURCHASE", "Buy this item?", "fa-cart-shopping");
    if (!confirmBuy) return;
    try {
      setLoading(true);
      await buyItem(currentUserId, itemId);
      await fetchUserData();
      setLoading(false);
      await showRewardPopup("PURCHASE SUCCESSFUL!", "Item Added to Inventory", "fa-bag-shopping");
    } catch (err) { setLoading(false); await showRewardPopup("ERROR", "Purchase Failed", "fa-xmark"); } 
  };

  const handleUseItem = async (itemId) => {
    if (!currentUserId) return;
    const confirmUse = await showConfirmPopup("USE ITEM", "Activate this item effect?", "fa-bolt");
    if (!confirmUse) return;
    try {
      setLoading(true);
      await useItem(currentUserId, itemId);
      await fetchUserData();
      setLoading(false);
      await showRewardPopup("ITEM ACTIVATED!", "Effect active for 24h", "fa-bolt");
    } catch (err) { setLoading(false); await showRewardPopup("ERROR", "Failed to use item", "fa-xmark"); } 
  };

  const handleUpgrade = async (planId) => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      await upgradePlan(currentUserId, planId);
      setActiveModal(null);
      await fetchUserData();
      setLoading(false);
      await showRewardPopup("UPGRADE SUCCESSFUL!", "New Membership Plan Active", "fa-crown");
    } catch (err) { 
        setLoading(false); 
        await showRewardPopup("UPGRADE FAILED", err.response?.data?.message || err.message, "fa-xmark");
    } 
  };

  const handleWithdraw = async (amount, address, method) => {
    if (!currentUserId) return;
    const confirmWd = await showConfirmPopup("CONFIRM WITHDRAW", `Withdraw ${amount} PTS?`, "fa-money-bill-transfer");
    if (!confirmWd) return;
    try {
      setLoading(true);
      await requestWithdraw(currentUserId, amount, address, method);
      setActiveModal(null);
      await fetchUserData();
      setLoading(false);
      await showRewardPopup("REQUEST SENT", "Withdrawal processing...", "fa-clock");
    } catch (err) { setLoading(false); await showRewardPopup("ERROR", "Withdraw Failed", "fa-xmark"); } 
  };

  // 3. HELPERS
  const renderActiveBuffs = () => {
    if (!user || !user.buffs) return null;
    const now = Date.now();
    const activeBuffs = Object.entries(user.buffs).filter(([_, expireTime]) => expireTime > now);
    if (activeBuffs.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: 5, marginLeft: 10 }}>
        {activeBuffs.map(([itemId, expireTime]) => {
          const detail = ITEM_DETAILS[itemId];
          const diffMin = Math.ceil((expireTime - now) / 60000);
          const timeText = diffMin > 60 ? `${Math.ceil(diffMin/60)}h` : `${diffMin}m`;
          return (
            <div key={itemId} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(0,0,0,0.6)', borderRadius: 5, padding: '2px 5px',
              border: `1px solid ${detail?.color || '#fff'}`,
              boxShadow: `0 0 5px ${detail?.color || '#fff'}`
            }}>
               <span style={{fontSize: '0.8rem', textShadow:'0 0 3px black'}}>{detail?.icon || '⚡'}</span>
               <span style={{fontSize: '0.5rem', color: '#fff', fontWeight:'bold', marginTop:-2}}>{timeText}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // --- LOGIC RED DOT ---
  const countUnclaimedTasks = () => {
      if (!user) return 0;
      const userTasks = user.dailyTasks || {};
      const todayStr = new Date().toISOString().split('T')[0];
      
      let count = 0;
      DAILY_TASKS_LIST.forEach(task => {
          const lastClaimDate = userTasks[task.id]; 
          if (lastClaimDate !== todayStr) {
              count++;
          }
      });
      return count;
  };
  
  const isFreeSpinReady = () => {
      if (!user) return false;
      const lastSpin = user.lastFreeSpin || 0;
      const cooldown = 3600 * 1000;
      return (Date.now() - lastSpin) > cooldown;
  };

  const unclaimedCount = countUnclaimedTasks();

  // 4. RENDER
  if (loading) return <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:999999, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#00E5FF'}}><i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{marginBottom:15}}></i><div style={{fontWeight:'bold', letterSpacing:1}}>CONNECTING...</div></div>;
  if (!currentUserId) return <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#0f0', display:'flex', justifyContent:'center', alignItems:'center'}}>INITIALIZING...</div>;

  return (
    <div className="game-container">
      
      {/* HEADER: User & Wallet */}
      <div className="header-user">
        <div className="glass-panel" onClick={() => setActiveModal('PROFILE')}>
           <i className="fa-solid fa-user-astronaut fa-2x" style={{color:'#00E5FF'}}></i>
           <div>
              <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user?.username || 'Player'}</div>
              <div style={{fontSize:'0.6rem', color:'#FFD700'}}>{user?.plan || 'GUEST'}</div>
           </div>
           {renderActiveBuffs()}
        </div>
      </div>

      <div className="header-wallet">
        <div className="glass-panel" onClick={() => setActiveModal('WITHDRAW')} style={{justifyContent:'center'}}>
           <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#FFD700', marginRight:10}}>{user?.balance.toLocaleString() || 0}</div>
           <i className="fa-solid fa-wallet fa-3x" style={{color:'#181078'}}></i>
        </div>
      </div>

      {/* WAREHOUSE BAR */}
      <div className="zone-warehouse" onClick={() => setActiveModal('WAREHOUSE')}>
          {(() => {
             const current = user ? Object.values(user.inventory || {}).reduce((a,b)=>a+b, 0) : 0;
             const max = user?.storageLimit || 1;
             const pct = Math.min(100, (current / max) * 100);
             return (
               <>
                 <div className="custom-progress-container" style={{top: -15}}>
                    <div className="progress-fill-warehouse" style={{width: `${pct}%`}}></div>
                    <span className="progress-text">{current} / {max}</span>
                 </div>
                 <img src="/assets/warehouse_iso.png" alt="Warehouse" style={{
                    width:'130%', filter:'drop-shadow(0 10px 10px rgba(0,0,0,0.5))', transform: 'translateY(10px)'
                 }} />
               </>
             )
          })()}
      </div>

      {/* NAVIGATION BAR */}
      <div className="zone-nav">
          <div className="nav-buttons-row">
            <button onClick={() => setActiveModal('SPIN')} className="iso-circle-btn btn-spin" style={{position:'relative'}}>
                <i className="fa-solid fa-dharmachakra fa-spin"></i>
                <span style={{fontSize:'0.5rem'}}>SPIN</span>
                {isFreeSpinReady() && (
                    <div style={{
                        position: 'absolute', top: -2, right: -2, background: '#00E676', 
                        width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white', boxShadow: '0 0 5px #00E676', zIndex:10
                    }}></div>
                )}
            </button>
            
            <button onClick={() => setActiveModal('TASK')} className="iso-circle-btn btn-task" style={{position:'relative'}}>
                <i className="fa-solid fa-list-check"></i>
                <span style={{fontSize:'0.5rem'}}>TASK</span>
                {unclaimedCount > 0 && (
                    <div style={{
                        position: 'absolute', top: -5, right: -5, background: '#FF1744', color: 'white', 
                        fontSize: '0.7rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #222', boxShadow: '0 0 5px red', zIndex:10
                    }}>
                        {unclaimedCount}
                    </div>
                )}
            </button>
            
            <button onClick={() => setActiveModal('ENCYCLOPEDIA')} className="iso-circle-btn btn-wiki"><i className="fa-solid fa-book-open"></i><span style={{fontSize:'0.5rem'}}>WIKI</span></button>
          </div>
          <div className="farm-nav-card">
              <div style={{display:'flex'}}>
                 {[0, 1, 2].map(idx => (
                    <button key={idx} onClick={() => setActivePage(idx)} className={`mini-nav-btn ${activePage === idx ? 'active' : ''}`}>{idx + 1}</button>
                 ))}
              </div>
          </div>
      </div>

      <FarmGrid 
        user={user}
        activePage={activePage}
        currentUserId={currentUserId}
        onRefreshUser={fetchUserData}
        onOpenMember={() => setActiveModal('MEMBER')}
        onOpenWithdraw={() => setActiveModal('WITHDRAW')}
        setLoading={setLoading}
      />

      <div className="iso-footer">
          <MenuBtn icon="fa-solid fa-user" txt="Profile" onClick={() => setActiveModal('PROFILE')}/>
          <MenuBtn icon="fa-solid fa-users" txt="Friends" onClick={() => setActiveModal('FRIENDS')}/>
          <MenuBtn icon="fa-solid fa-shop" txt="Market" onClick={() => setActiveModal('MARKET')}/>
          <MenuBtn icon="fa-solid fa-crown" txt="Member" onClick={() => setActiveModal('MEMBER')}/>
          <MenuBtn icon="fa-solid fa-bars" txt="Menu" onClick={() => setActiveModal(activeModal === 'MENU' ? null : 'MENU')}/>
      </div>

      <ModalManager 
        activeModal={activeModal}
        closeModal={() => setActiveModal(null)}
        user={user}
        loading={loading}
        currentUserId={currentUserId}
        fetchUserData={fetchUserData}
        setActiveModal={setActiveModal}
        handleUpgrade={handleUpgrade}
        handleWithdraw={handleWithdraw}
        handleSell={handleSell}
        handleBuyItem={handleBuyItem}
        handleUseItem={handleUseItem}
        handleSpin={handleSpin}
        handleTaskClick={handleTaskClick}
      />

      <div id="adextra-overlay" style={{display:'none', position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.95)', zIndex:99999, flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          <div style={{color:'white', marginBottom:10, fontSize:'0.8rem'}}>Sponsored Ad</div>
          <div id="25e584f1c176cb01a08f07b23eca5b3053fc55b8"></div>
          <button id="adextra-close-btn" style={{marginTop:20, padding:'10px 20px', background:'red', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>CLOSE AD</button>
      </div>

      <style>{`@keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); } }`}</style>
    </div>
  );
}

const MenuBtn = ({icon, txt, onClick}) => <button onClick={onClick} className="menu-btn-style"><i className={icon}></i>{txt}</button>;

export default App;