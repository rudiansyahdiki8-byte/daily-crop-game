import React, { useState } from 'react';
import { ITEM_DETAILS, PLANS, EXTRA_SLOT_PRICE } from '../config/gameConstants';
import { showAdStack, showRewardPopup, showConfirmPopup } from '../services/adManager'; // Import showConfirmPopup
import { startFarming, harvestCrop, buyItem } from '../services/api';

const FarmGrid = ({ user, activePage, currentUserId, onRefreshUser, onOpenMember, onOpenWithdraw, setLoading }) => {

  // --- 1. LOGIC STATUS SLOT ---
  const getSlotStatus = (slotNum) => {
      const userSlots = user?.slots || [1];
      const currentPlan = PLANS[user?.plan || 'FREE'];
      const baseLimit = currentPlan.plots; 
      const extraBought = user?.extraSlotsPurchased || 0; 

      if (userSlots.includes(slotNum)) return 'ACTIVE';

      // Logic Shop: Slot berikutnya setelah batas plan + extra
      const nextShopSlot = baseLimit + extraBought + 1;
      if (slotNum === nextShopSlot && extraBought < 2) {
          return 'LOCKED_SHOP';
      }

      return 'DISABLED';
  };

  // --- 2. HANDLER KLIK SLOT (ENGLISH & CUSTOM POPUP) ---
  const handleSlotClick = async (slotId) => {
    if (!currentUserId) return;
    
    const slotNum = parseInt(slotId.replace('slot', ''));
    const status = getSlotStatus(slotNum);

    // A. LOGIC SHOP (BELI EXTRA SLOT)
    if (status === 'LOCKED_SHOP') {
        const currentExtra = user?.extraSlotsPurchased || 0;
        const nextExtraIndex = currentExtra + 1;
        const price = EXTRA_SLOT_PRICE[nextExtraIndex] || 0;

        // GANTI window.confirm DENGAN showConfirmPopup
        const isConfirmed = await showConfirmPopup(
            "EXPAND FARM", 
            `Purchase Permanent Extra Land?\nPrice: ${price.toLocaleString()} PTS`,
            "fa-expand"
        );

        if (isConfirmed) {
             try {
                  setLoading(true);
                  await buyItem(currentUserId, `EXTRA_LAND_${nextExtraIndex}`); // Sesuai ID di buy.js
                  await onRefreshUser(); 
                  setLoading(false);
                  await showRewardPopup("LAND UNLOCKED!", "Permanent Asset Acquired", "fa-check-double");
             } catch(e) {
                  setLoading(false);
                  // Cek Error Saldo
                  if(e.response?.data?.message?.includes('Saldo') || e.message?.includes('Saldo')) {
                      const deposit = await showConfirmPopup(
                          "INSUFFICIENT BALANCE",
                          "You don't have enough PTS.\nDeposit USDT now?",
                          "fa-wallet"
                      );
                      if(deposit) onOpenWithdraw();
                  } else {
                      // Error Lain (Ganti Alert Biasa)
                      await showRewardPopup("ERROR", e.response?.data?.message || "Transaction Failed", "fa-circle-exclamation");
                  }
             }
        }
        return;
    }

    // B. LOGIC PLAN LOCKED (UPGRADE)
    if (status === 'DISABLED') {
        const isUpgrade = await showConfirmPopup(
            "AREA LOCKED", 
            "This plot is locked by your Plan.\nUpgrade Membership to unlock?",
            "fa-lock"
        );
        if(isUpgrade) {
            onOpenMember();
        }
        return;
    }

    // C. LOGIC FARMING (Active)
    const slotData = user?.farm?.[slotId];
    
    // PANEN (HARVEST)
    if (slotData && Date.now() >= slotData.harvestAt) {
      const success = await showAdStack(1); 
      if (success) {
          try {
              setLoading(true); 
              const res = await harvestCrop(currentUserId, slotId);
              await onRefreshUser();
              setLoading(false);
              // Tidak perlu popup sukses tiap panen (mengganggu flow), cukup visual update
          } catch(e) {
              setLoading(false);
              await showRewardPopup("HARVEST FAILED", e.response?.data?.message || "Server Error", "fa-bug");
          }
      }
      return; 
    }

    // TANAM (PLANT)
    try {
      setLoading(true);
      if (!slotData) {
        await startFarming(currentUserId, slotId);
        await onRefreshUser();
      }
      setLoading(false);
    } catch (err) { 
        setLoading(false);
        await showRewardPopup("PLANT FAILED", err.response?.data?.message || "Server Error", "fa-bug");
    }
  };

  // --- 3. RENDER VISUAL (ENGLISH) ---
  const startSlot = (activePage * 4) + 1;
  const pageSlots = [0, 1, 2, 3].map(offset => startSlot + offset);

  return (
    <div className="zone-farm">
         {user && pageSlots.map((slotNum) => {
             const slotId = `slot${slotNum}`;
             const visualStatus = getSlotStatus(slotNum);
             const s = user.farm?.[slotId]; 
             
             let displayPrice = 0;
             if (visualStatus === 'LOCKED_SHOP') {
                 const currentExtra = user?.extraSlotsPurchased || 0;
                 displayPrice = EXTRA_SLOT_PRICE[currentExtra + 1] || 0;
             }

             // Logic Visual Progress
             const now = Date.now();
             const isReady = s && now >= s.harvestAt;
             let progressPct = 0;
             let timeText = "";
             
             if (s && !isReady) {
                const totalDuration = (s.harvestAt - s.plantedAt) || 180000; 
                const timeLeft = s.harvestAt - now;
                const timeElapsed = totalDuration - timeLeft;
                progressPct = Math.min(100, Math.max(0, (timeElapsed / totalDuration) * 100));
                timeText = `${Math.ceil(timeLeft / 1000)}s`;
             }

             let overlayImage = null; 
             let showBubble = false;
             if (visualStatus === 'ACTIVE' && s) {
                if (isReady) {
                   overlayImage = '/assets/stage_growing.png'; 
                   showBubble = true;
                } else {
                   overlayImage = progressPct < 50 ? '/assets/stage_sprout.png' : '/assets/stage_growing.png';
                }
             }

             const bgImage = visualStatus === 'ACTIVE' ? '/assets/soil_dry.png' : '/assets/soil_locked.png';

             return (
               <div key={slotId} onClick={() => handleSlotClick(slotId)} 
                  className={`farm-slot ${visualStatus === 'DISABLED' ? 'disabled' : ''}`}
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'contain', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    position:'relative', 
                    cursor: visualStatus === 'DISABLED' ? 'not-allowed' : 'pointer',
                    width:'100%', height:'100%',
                    opacity: visualStatus === 'DISABLED' ? 0.6 : 1,
                    filter: visualStatus === 'DISABLED' ? 'grayscale(0.8)' : 'none'
                  }}
               >
                  <div style={{position:'absolute', top:15, left:15, fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', textShadow:'0 1px 2px black', fontWeight:'bold', zIndex:15}}>#{slotNum}</div>
                  
                  {visualStatus === 'ACTIVE' ? (
                      <>
                        {overlayImage && (
                            <img src={overlayImage} alt="Crop" style={{
                                position: 'absolute', top:-17, width: '75%', height: 'auto', zIndex: 5, pointerEvents: 'none', 
                                filter: isReady ? 'drop-shadow(0 0 5px #39FF14)' : 'none'
                            }} />
                        )}
                        {isReady ? (
                            <>
                                {showBubble && (
                                    <div className="harvest-bubble" style={{zIndex: 20}}>
                                        <div style={{fontSize:'2.8rem'}}>{ITEM_DETAILS[s.cropName]?.icon || '📦'}</div>
                                    </div>
                                )}
                                <div className="harvest-label" style={{zIndex: 20}}>HARVEST!</div>
                            </>
                        ) : s ? (
                            <div className="custom-progress-container" style={{top: '10%', width: '70%'}}>
                                <div className="progress-fill-farm" style={{width: `${progressPct}%`}}></div>
                                <span className="progress-text">{timeText}</span>
                            </div>
                        ) : (
                            <div style={{marginTop:'20%', border:'1px dashed #aaa', color:'#aaa', padding:'2px 8px', borderRadius:5, fontSize:'0.6rem', zIndex:15}}>PLANT</div>
                        )}
                      </>
                  ) : visualStatus === 'LOCKED_SHOP' ? (
                      <div style={{
                          marginTop:'10%', background:'rgba(0,0,0,0.8)', color:'#FFD700', 
                          padding:'5px 10px', borderRadius:8, border:'1px solid #FFD700', 
                          textAlign:'center', zIndex:15, boxShadow: '0 0 10px #FFD700',
                          animation: 'pulse 1.5s infinite'
                      }}>
                          <i className="fa-solid fa-cart-shopping" style={{marginBottom:3, display:'block'}}></i>
                          <div style={{fontSize:'0.6rem'}}>PERMANENT</div>
                          <div style={{fontSize:'0.8rem', fontWeight:'bold'}}>{(displayPrice / 1000)}k</div>
                      </div>
                  ) : (
                      <div style={{marginTop:'10%', color:'#aaa', textAlign:'center', zIndex:15}}>
                          <i className="fa-solid fa-lock fa-2x"></i>
                          <div style={{fontSize:'0.6rem', marginTop: 5}}>LOCKED</div>
                      </div>
                  )}
               </div>
             )
         })}
    </div>
  );
};

export default FarmGrid;