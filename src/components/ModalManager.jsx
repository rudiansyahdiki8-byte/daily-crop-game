import React from 'react';

// Import all Modals here (to keep App.jsx clean)
import MemberModal from './MemberModal';
import WithdrawModal from './WithdrawModal';
import MarketModal from './MarketModal';
import ProfileModal from './ProfileModal';
import WarehouseModal from './WarehouseModal';
import MenuModal from './MenuModal';
import FriendsModal from './FriendsModal';
import SpinModal from './SpinModal';
import DailyTaskModal from './DailyTaskModal';
import EncyclopediaModal from './EncyclopediaModal';

const ModalManager = ({
  activeModal,
  closeModal,
  user,
  loading,
  // Special Props
  currentUserId,
  fetchUserData,
  setActiveModal,
  // Handlers from App.jsx
  handleUpgrade,
  handleWithdraw,
  handleSell,
  handleBuyItem,
  handleUseItem,
  handleSpin,
  handleTaskClick
}) => {

  if (!activeModal) return null;

  return (
    <>
      {/* 1. MEMBER / UPGRADE PLAN */}
      <MemberModal
        isOpen={activeModal === 'MEMBER'}
        onClose={closeModal}
        currentPlan={user?.plan}
        onUpgrade={handleUpgrade}
        loading={loading}
        userBalance={user?.balance || 0}
        onOpenDeposit={() => setActiveModal('WITHDRAW')}
      />

      {/* 2. WITHDRAW / DEPOSIT */}
      <WithdrawModal
        isOpen={activeModal === 'WITHDRAW'}
        onClose={closeModal}
        userBalance={user?.balance || 0}
        onWithdraw={handleWithdraw}
        loading={loading}
        userId={currentUserId}
      />

      {/* 3. PROFILE */}
      <ProfileModal
        isOpen={activeModal === 'PROFILE'}
        onClose={closeModal}
        user={user}
      />

      {/* 4. HAMBURGER MENU */}
      <MenuModal
        isOpen={activeModal === 'MENU'}
        onClose={closeModal}
      />

      {/* 5. FRIENDS / AFFILIATE */}
      <FriendsModal
        isOpen={activeModal === 'FRIENDS'}
        onClose={closeModal}
        user={user}
        onRefresh={fetchUserData}
      />

      {/* 6. ENCYCLOPEDIA / WIKI */}
      <EncyclopediaModal
        isOpen={activeModal === 'ENCYCLOPEDIA'}
        onClose={closeModal}
      />

      {/* 7. WAREHOUSE */}
      <WarehouseModal
        isOpen={activeModal === 'WAREHOUSE'}
        onClose={closeModal}
        inventory={user?.inventory || {}}
        storageLimit={user?.storageLimit || 50}
        userPlan={user?.plan || 'FREE'}
        storageUpgradesPurchased={user?.storageUpgradesPurchased || 0}
        onOpenMarket={() => setActiveModal('MARKET')}
        onUseItem={handleUseItem}
        loading={loading}
      />

      {/* 8. MARKET */}
      {/* [MAIN FIX HERE] */}
      <MarketModal
        isOpen={activeModal === 'MARKET'}
        onClose={closeModal}
        user={user || {}}
        // FIX: Don't use arrow function, pass handler directly
        // So (useAd, name, qty) are passed correctly
        onSellAll={handleSell}
        onBuyItem={handleBuyItem}
        loading={loading}
        // onWatchAd for Boost (Sell All + Ad)
        onWatchAd={() => handleSell(true)}
      />

      {/* 9. SPIN WHEEL */}
      <SpinModal
        isOpen={activeModal === 'SPIN'}
        onClose={closeModal}
        onSpin={handleSpin}
        userBalance={user?.balance || 0}
        lastFreeSpin={user?.lastFreeSpin}
        onWatchAd={() => { }}
      />

      {/* 10. DAILY TASK */}
      <DailyTaskModal
        isOpen={activeModal === 'TASK'}
        onClose={closeModal}
        user={user}
        onRefresh={fetchUserData}
        onClaimTask={handleTaskClick}
      />
    </>
  );
};

export default ModalManager;