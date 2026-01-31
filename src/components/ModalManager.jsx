import React from 'react';

// Import semua Modal di sini (supaya App.jsx bersih)
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
  // Props Khusus
  currentUserId,
  fetchUserData,
  setActiveModal,
  // Handlers dari App.jsx
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
      {activeModal === 'MEMBER' && (
        <MemberModal
          isOpen={true}
          onClose={closeModal}
          currentPlan={user?.plan}
          onUpgrade={handleUpgrade}
          loading={loading}
          userBalance={user?.balance || 0}
          onOpenDeposit={() => setActiveModal('WITHDRAW')}
        />
      )}

      {/* 2. WITHDRAW / DEPOSIT */}
      {activeModal === 'WITHDRAW' && (
        <WithdrawModal
          isOpen={true}
          onClose={closeModal}
          userBalance={user?.balance || 0}
          onWithdraw={handleWithdraw}
          loading={loading}
          userId={currentUserId}
        />
      )}

      {/* 3. PROFILE */}
      {activeModal === 'PROFILE' && (
        <ProfileModal
          isOpen={true}
          onClose={closeModal}
          user={user}
        />
      )}

      {/* 4. MENU HAMBURGER */}
      {activeModal === 'MENU' && (
        <MenuModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {/* 5. FRIENDS / AFFILIATE */}
      {activeModal === 'FRIENDS' && (
        <FriendsModal
          isOpen={true}
          onClose={closeModal}
          user={user}
          onRefresh={fetchUserData}
        />
      )}

      {/* 6. ENCYCLOPEDIA / WIKI */}
      {activeModal === 'ENCYCLOPEDIA' && (
        <EncyclopediaModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {/* 7. WAREHOUSE (GUDANG) */}
      {activeModal === 'WAREHOUSE' && (
        <WarehouseModal
          isOpen={true}
          onClose={closeModal}
          inventory={user?.inventory || {}}
          storageLimit={user?.storageLimit || 50}
          onOpenMarket={() => setActiveModal('MARKET')}
          onUseItem={handleUseItem}
          loading={loading}
        />
      )}

      {/* 8. MARKET (TOKO) */}
      {activeModal === 'MARKET' && (
        <MarketModal
          isOpen={true}
          onClose={closeModal}
          user={user || {}}
          onSellAll={handleSell}
          onBuyItem={handleBuyItem}
          loading={loading}
          onWatchAd={() => handleSell(true)}
        />
      )}

      {/* 9. SPIN WHEEL */}
      {activeModal === 'SPIN' && (
        <SpinModal
          isOpen={true}
          onClose={closeModal}
          onSpin={handleSpin}
          userBalance={user?.balance || 0}
          lastFreeSpin={user?.lastFreeSpin}
          onWatchAd={() => { }}
        />
      )}

      {/* 10. DAILY TASK */}
      {activeModal === 'TASK' && (
        <DailyTaskModal
          isOpen={true}
          onClose={closeModal}
          user={user}
          onRefresh={fetchUserData}
          onClaimTask={handleTaskClick}
        />
      )}
    </>
  );
};

export default ModalManager;