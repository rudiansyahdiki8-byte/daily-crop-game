import { useState, useEffect } from 'react';

// 1. IMPORT API SERVICES
import { 
  loginUser, 
  startFarming, 
  harvestCrop, 
  sellAllItems, 
  upgradePlan, 
  requestWithdraw, 
  buyItem, 
  spinWheel,
  bindUpline,
  claimDailyTask 
} from './services/api';

// 2. IMPORT SEMUA MODAL
import MemberModal from './components/MemberModal';
import WithdrawModal from './components/WithdrawModal';
import MarketModal from './components/MarketModal';
import ProfileModal from './components/ProfileModal';
import WarehouseModal from './components/WarehouseModal';
import MenuModal from './components/MenuModal';
import FriendsModal from './components/FriendsModal';
import SpinModal from './components/SpinModal';
import DailyTaskModal from './components/DailyTaskModal';

function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // ID Dinamis (Telegram/Dummy)
  const [loading, setLoading] = useState(false);
  const [timers, setTimers] = useState({});
  const [activeModal, setActiveModal] = useState(null); 
  const [activePage, setActivePage] = useState(0); // 0=Kebun1, 1=Kebun2, dst

  // --- 1. INISIALISASI & DETEKSI TELEGRAM ---
  useEffect(() => {
    const initApp = async () => {
      // Cek apakah jalan di Telegram WebApp
      const tg = window.Telegram?.WebApp;
      
      if (tg && tg.initDataUnsafe?.user) {
        // --- LOGIC TELEGRAM ASLI ---
        const realId = tg.initDataUnsafe.user.id;
        const realUsername = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
        
        setCurrentUserId(realId);
        
        // Auto Login/Register ke Backend
        try {
          const userData = await loginUser(realId, realUsername);
          setUser(userData);
        } catch (e) {
          console.error("Login Error:", e);
        }

        // Expand tampilan Telegram agar full screen
        tg.expand();
        tg.ready();

      } else {
        // --- LOGIC DEV / BROWSER (LOCALHOST) ---
        console.warn("⚠️ Mode Browser: Menggunakan ID Dummy 123456789");
        const dummyId = 123456789;
        setCurrentUserId(dummyId);
        
        try {
          const userData = await loginUser(dummyId, "DevPetani");
          setUser(userData);
        } catch (e) {
          console.error("Dev Login Error:", e);
        }
      }
    };

    initApp();
  }, []);

  // Timer interval (Update UI hitung mundur)
  useEffect(() => {
    const interval = setInterval(() => setTimers({}), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fungsi Refresh Data User
  const fetchUserData = async () => {
    if (!currentUserId) return;
    try {
      const data = await loginUser(currentUserId, null);
      setUser(data);
    } catch (err) { console.error("Refresh Error:", err); }
  };

  // --- HANDLERS (LOGIKA GAME) ---

  const handleSlotClick = async (slotId) => {
    if (!currentUserId) return;
    const slotData = user?.farm?.[slotId];

    try {
      setLoading(true);
      if (!slotData) {
        // Logic Membuka / Menanam
        const slotNum = parseInt(slotId.replace('slot', ''));
        const userSlots = user.slots || [];
        
        if (!userSlots.includes(slotNum)) { 
          // Jika terkunci
          if (slotNum === 2 || slotNum === 3) {
             if(confirm(`Slot ${slotNum} terkunci! Beli Tanah di Market?`)) setActiveModal('MARKET'); 
          } else {
             if(confirm(`Slot ${slotNum} terkunci! Upgrade Member untuk membuka?`)) setActiveModal('MEMBER');
          }
          return; 
        }
        await startFarming(currentUserId, slotId);
      } else if (Date.now() >= slotData.harvestAt) {
        // Logic Panen
        await harvestCrop(currentUserId, slotId);
      }
      await fetchUserData();
    } catch (err) { 
      alert(err.response?.data?.message || "Error Farm"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSell = async (useAdBooster) => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const res = await sellAllItems(currentUserId, useAdBooster);
      // Tampilkan hasil penjualan + bonus
      alert(`Terjual! +${res.totalReceived} PTS\n(Bonus: ${res.bonusPct}%)`);
      await fetchUserData();
    } catch (e) { 
      alert(e.response?.data?.message || "Gagal Jual"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleBuyItem = async (itemId) => {
    if (!currentUserId) return;
    if(!confirm(`Beli item ini?`)) return;
    try {
      setLoading(true);
      await buyItem(currentUserId, itemId);
      alert("Pembelian Berhasil!");
      await fetchUserData(); 
    } catch (err) { 
      alert(err.response?.data?.message || "Gagal Beli"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpgrade = async (planId) => {
    if (!currentUserId) return;
    if (!confirm(`Upgrade ke ${planId}?`)) return;
    try {
      setLoading(true);
      await upgradePlan(currentUserId, planId);
      alert("Upgrade Berhasil!");
      setActiveModal(null);
      await fetchUserData();
    } catch (err) { 
      alert(err.response?.data?.message || "Gagal Upgrade"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleWithdraw = async (amount, address, method) => {
    if (!currentUserId) return;
    if(!confirm(`Cairkan ${amount} PTS via ${method}?`)) return;
    try {
      setLoading(true);
      await requestWithdraw(currentUserId, amount, address, method);
      alert("Permintaan withdraw dikirim.");
      setActiveModal(null);
      await fetchUserData();
    } catch (err) { 
      alert(err.response?.data?.message || "Gagal Withdraw"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSpin = async (mode) => {
    if (!currentUserId) return;
    try {
      const data = await spinWheel(currentUserId, mode);
      await fetchUserData(); 
      return data; 
    } catch (err) { throw err; }
  };

  const renderTimer = (harvestAt) => {
    const diff = Math.ceil((harvestAt - Date.now()) / 1000);
    return diff <= 0 ? "PANEN!" : `${diff}s`;
  };

  // --- RENDER GRID SYSTEM ---
  const renderGridItems = () => {
    let items = [];
    
    for (let i = 0; i < 128; i++) {
      
      // A. HEADER USER (Grid 0)
      if (i === 0) {
        items.push(
          <div key="ua" style={{
            gridColumn: '1 / 5', gridRow: '1 / 3', 
            background: '#222', border: '1px solid #444', borderRadius: '0 0 15px 0', 
            display: 'flex', alignItems: 'center', padding: '0 10px', gap: 10, zIndex: 10
          }}>
            <div style={{fontSize:'2rem'}}>👨‍🌾</div>
            {user ? (
               <div>
                 <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{user.username}</div>
                 <div style={{fontSize:'0.7rem', color:'#FFC107'}}>{user.plan}</div>
               </div>
            ) : <div style={{fontSize:'0.8rem', color:'#888'}}>Login...</div>}
          </div>
        );
        continue; 
      }
      if ([1,2,3,8,9,10,11].includes(i)) continue;

      // B. WALLET (Grid 6)
      if (i === 6) {
        items.push(
          <div key="wal" onClick={() => setActiveModal('WITHDRAW')} style={{
            gridColumn: '7 / 9', gridRow: '1 / 3', 
            background: '#1a1a1a', borderLeft: '2px solid #333', borderBottom: '2px solid #333', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            zIndex: 10, cursor: 'pointer'
          }}>
            {user ? (
              <>
                <div style={{fontSize:'0.8rem', color:'#888'}}>SALDO</div>
                <div style={{color:'#FFC107', fontWeight:'bold', fontSize:'1rem'}}>{user.balance}</div>
              </>
            ) : '...'}
          </div>
        );
        continue;
      }
      if ([7, 14,15].includes(i)) continue;

      // C. WAREHOUSE (Grid 16)
      if (i === 16) {
        items.push(
          <div key="wh" onClick={() => setActiveModal('WAREHOUSE')} style={{
            gridColumn: '1 / 4', gridRow: '3 / 6', 
            background: '#3E2723', border: '2px solid #5D4037', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            zIndex: 10, cursor: 'pointer', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}>
             <div style={{fontSize:'1.5rem', marginBottom:2}}>📦</div>
             {user ? (
               <div style={{fontWeight:'bold', fontSize:'0.9rem', color:'#D7CCC8'}}>
                 {Object.values(user.inventory || {}).reduce((a,b)=>a+b, 0)}/{user.storageLimit}
               </div>
             ) : '...'}
          </div>
        );
        continue;
      }
      if ([17,18, 24,25,26, 32,33,34].includes(i)) continue;

      // D. NAVIGASI TENGAH (Grid 40-47)
      if (i >= 40 && i <= 47) {
        // Tombol SPIN (40-41)
        if (i === 40) {
          items.push(
            <button key="btn-spin" onClick={() => setActiveModal('SPIN')} style={{
              gridColumn: 'span 2', 
              background: 'linear-gradient(45deg, #FFC107, #FF9800)', border: '2px solid #fff', borderRadius: 8,
              color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 0 #E65100'
            }}>🎡 Spin</button>
          );
          continue;
        }
        if (i === 41) continue;

        // Tombol TASK (42-43)
        if (i === 42) {
          items.push(
            <button key="btn-task" onClick={() => setActiveModal('TASK')} style={{
              gridColumn: 'span 2', 
              background: 'linear-gradient(45deg, #2196F3, #03A9F4)', border: '2px solid #fff', borderRadius: 8,
              color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 0 #01579B'
            }}>📅 Tugas</button>
          );
          continue;
        }
        if (i === 43) continue;

        // Tombol Page Kebun (44-47)
        const pageIndex = i - 44; 
        const isActive = activePage === pageIndex;
        items.push(
           <button key={`nav-${pageIndex}`} onClick={() => setActivePage(pageIndex)} style={{
             gridColumn: 'span 1', background: isActive ? '#4CAF50' : '#333',
             color: isActive ? '#fff' : '#aaa', border: isActive ? '1px solid #fff' : '1px solid #555', 
             borderRadius: 5, fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', padding: 0
           }}>{pageIndex + 1}</button>
        );
        continue;
      }

      // E. FARM AREA (Grid 48)
      if (i === 48) {
         const startSlot = (activePage * 4) + 1;
         const currentSlots = [0, 1, 2, 3].map(offset => `slot${startSlot + offset}`);

         items.push(
           <div key="farm" style={{
             gridColumn: '1 / 9', gridRow: '7 / 14', 
             background: 'rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 10
           }}>
              {user && currentSlots.map(slotId => {
                  const s = user.farm?.[slotId];
                  const userSlots = user.slots || [];
                  const slotNum = parseInt(slotId.replace('slot', ''));
                  const locked = !userSlots.includes(slotNum);
                  
                  return (
                    <div key={slotId} onClick={() => handleSlotClick(slotId)} style={{
                      background: locked ? '#111' : '#222', 
                      border: s && Date.now() >= s.harvestAt ? '2px solid #FFC107' : '1px solid #444',
                      borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      position: 'relative'
                    }}>
                        <div style={{position:'absolute', top:5, left:8, fontSize:'0.6rem', color:'#555'}}>#{slotNum}</div>
                        {locked ? <div style={{fontSize:'1.5rem'}}>🔒</div> : s ? <><div style={{fontSize:'2rem'}}>{s.cropName === 'Carrot' ? '🥕' : '🥬'}</div>{renderTimer(s.harvestAt)}</> : '🌱 Tanam'}
                        {locked && (slotNum === 2 || slotNum === 3) && <div style={{position:'absolute', bottom:5, fontSize:'0.6rem', color:'#FFC107'}}>{slotNum === 2 ? '10k' : '750k'}</div>}
                    </div>
                  )
              })}
           </div>
         );
         continue;
      }
      if (i > 48 && i < 104) continue;

      // F. FOOTER MENU (Grid 112)
      if (i === 112) {
        items.push(
          <div key="foot" style={{
            gridColumn: '1 / 9', gridRow: '15 / 17', 
            background: '#1a1a1a', borderTop: '1px solid #333', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px'
          }}>
             <div style={{display:'flex', flex:1, justifyContent:'space-evenly'}}>
               <MenuBtn icon="👤" txt="Profile" onClick={() => setActiveModal('PROFILE')}/>
               <MenuBtn icon="🤝" txt="Teman" onClick={() => setActiveModal('FRIENDS')}/>
               <MenuBtn icon="🏪" txt="Market" onClick={() => setActiveModal('MARKET')}/>
               <MenuBtn icon="⭐" txt="Member" onClick={() => setActiveModal('MEMBER')}/>
             </div>
             <div style={{borderLeft:'1px solid #333', paddingLeft:5, marginLeft:5}}>
                <MenuBtn icon="☰" txt="Menu" onClick={() => setActiveModal(activeModal === 'MENU' ? null : 'MENU')}/>
             </div>
          </div>
        );
        continue;
      }
      if (i > 112) continue;

      items.push(<div key={i} className="debug-cell" style={{border: '0.5px dashed rgba(0,255,255,0.1)', fontSize: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(0,255,255,0.3)'}}>{i}</div>);
    }
    return items;
  };

if (!currentUserId) {
    return (
      <div style={{
        width:'100vw', height:'100vh', background:'#000', color:'#4CAF50',
        display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
        fontFamily:'monospace'
      }}>
        <div style={{fontSize:'2rem', marginBottom:10}}>🚜</div>
        <div>Mendeteksi Akun...</div>
        <div style={{fontSize:'0.8rem', color:'#555', marginTop:5}}>Telegram / Browser</div>
      </div>
    );
  }

  // 2. APLIKASI UTAMA (Hanya jalan kalau currentUserId ADA)
  return (
    <div style={{
      width: '100%', height: '100%', 
      display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(16, 1fr)', 
      background: '#000', position: 'relative', overflow: 'hidden'
    }}>
      
      {renderGridItems()}

      {/* MODAL POPUPS */}
      <MemberModal isOpen={activeModal === 'MEMBER'} onClose={() => setActiveModal(null)} currentPlan={user?.plan} onUpgrade={handleUpgrade} loading={loading} />
      <WithdrawModal isOpen={activeModal === 'WITHDRAW'} onClose={() => setActiveModal(null)} userBalance={user?.balance || 0} onWithdraw={handleWithdraw} loading={loading} />
      <MarketModal isOpen={activeModal === 'MARKET'} onClose={() => setActiveModal(null)} user={user || {}} onSellAll={handleSell} onBuyItem={handleBuyItem} loading={loading} />
      <ProfileModal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal(null)} user={user} />
      <WarehouseModal isOpen={activeModal === 'WAREHOUSE'} onClose={() => setActiveModal(null)} inventory={user?.inventory || {}} storageLimit={user?.storageLimit || 50} onOpenMarket={() => setActiveModal('MARKET')} />
      <MenuModal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} />
      <FriendsModal isOpen={activeModal === 'FRIENDS'} onClose={() => setActiveModal(null)} user={user} onRefresh={fetchUserData} />
      <SpinModal isOpen={activeModal === 'SPIN'} onClose={() => setActiveModal(null)} onSpin={handleSpin} userBalance={user?.balance || 0} lastFreeSpin={user?.lastFreeSpin} />
      <DailyTaskModal isOpen={activeModal === 'TASK'} onClose={() => setActiveModal(null)} user={user} onRefresh={fetchUserData} />

    </div>
  );
}

const MenuBtn = ({icon, txt, onClick}) => (
  <button onClick={onClick} style={{background: 'none', border: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10, minWidth: 50, cursor: 'pointer'}}>
    <span style={{fontSize: 18, marginBottom: 2}}>{icon}</span>{txt}
  </button>
);

export default App;