import React from 'react';
import { PLANS, GAME_CONFIG } from '../config/gameConstants';
// IMPORT FUNGSI BARU KITA
import { showConfirmPopup } from '../services/adManager';

const MemberModal = ({ isOpen, onClose, currentPlan, onUpgrade, loading, userBalance, onOpenDeposit }) => {
    if (!isOpen) return null;

    // ... (Bagian PLAN_THEME dan rate TETAP SAMA) ...
    const PLAN_THEME = {
        FREE: { color: '#B0BEC5', icon: 'fa-user', label: 'BASIC', desc: 'Starter Pack (1 Plot)' },
        MORTGAGE: { color: '#00E5FF', icon: 'fa-house-chimney', label: 'MANAGER', desc: 'Full Farm 1 (4 Plots)' },
        TENANT: { color: '#E040FB', icon: 'fa-building', label: 'TYCOON', desc: 'Full Farm 2 (7 Plots)' },
        OWNER: { color: '#FFD700', icon: 'fa-crown', label: 'VIP KING', desc: 'Full Farm 3 (10 Plots)' }
    };

    const rate = GAME_CONFIG.EXCHANGE_RATE || 100000;

    // ----------------------------------------------------
    // IMPORTANT UPDATE HERE (SWITCH TO ASYNC)
    // ----------------------------------------------------
    const handleUpgradeClick = async (planId, priceUsdt) => {
        const priceInPts = priceUsdt * rate;

        // 1. CHECK BALANCE
        if (userBalance < priceInPts) {
            const isDeposit = await showConfirmPopup(
                "INSUFFICIENT BALANCE",
                `Price: ${priceInPts.toLocaleString()} PTS.\nYour balance is too low.\nDeposit USDT now?`,
                "fa-wallet"
            );

            if (isDeposit) {
                onClose();
                onOpenDeposit();
            }
            return;
        }

        // 2. CONFIRM PURCHASE
        const isConfirmed = await showConfirmPopup(
            "CONFIRM PURCHASE",
            `Buy ${planId} Membership\nfor ${priceInPts.toLocaleString()} PTS?`,
            "fa-cart-shopping"
        );

        // Jika user klik CONFIRM (Tombol Emas), baru eksekusi
        if (isConfirmed) {
            onUpgrade(planId);
        }
    };

    return (
        // ... (BAGIAN RETURN HTML DI BAWAHNYA SAMA PERSIS, TIDAK ADA YANG DIUBAH) ...
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1200,
            display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s'
        }}>
            <div style={{
                width: '90%', maxWidth: '420px', height: '90%', maxHeight: '800px',
                background: 'linear-gradient(160deg, #121212 0%, #1e1e2e 100%)',
                borderRadius: 25, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 0 50px rgba(0,0,0,0.8)'
            }}>

                {/* HEADER */}
                <div style={{
                    padding: '25px 20px', textAlign: 'center', position: 'relative',
                    background: 'radial-gradient(circle at top, rgba(255, 215, 0, 0.15), transparent 70%)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{
                        width: 60, height: 60, margin: '0 auto 10px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                    }}>
                        <i className="fa-solid fa-gem fa-2x" style={{ color: 'white' }}></i>
                    </div>
                    <h2 style={{ margin: 0, color: 'white', letterSpacing: 1, textTransform: 'uppercase', fontSize: '1.4rem' }}>
                        UPGRADE PLAN
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 5 }}>
                        Your Balance: <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{userBalance?.toLocaleString()} PTS</span>
                    </div>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)',
                        border: 'none', color: 'white', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer'
                    }}>✕</button>
                </div>

                {/* LIST PLAN */}
                <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {Object.values(PLANS).map((plan) => {
                        const theme = PLAN_THEME[plan.id];
                        const isCurrent = currentPlan === plan.id;

                        if (plan.id === 'FREE' && !isCurrent) return null;

                        return (
                            <div key={plan.id} style={{
                                position: 'relative',
                                background: isCurrent
                                    ? `linear-gradient(145deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2))`
                                    : `linear-gradient(145deg, ${theme.color}10, transparent)`,
                                borderRadius: 15, padding: 2,
                                border: isCurrent ? `1px solid ${theme.color}` : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isCurrent ? `0 0 15px ${theme.color}40` : 'none'
                            }}>
                                <div style={{ background: '#1a1a1a', borderRadius: 13, padding: 15 }}>

                                    {/* HEADER CARD */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, background: `${theme.color}20`,
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                border: `1px solid ${theme.color}40`
                                            }}>
                                                <i className={`fa-solid ${theme.icon}`} style={{ color: theme.color }}></i>
                                            </div>
                                            <div>
                                                <div style={{ color: theme.color, fontWeight: 'bold' }}>{theme.label}</div>
                                                <div style={{ color: '#666', fontSize: '0.7rem' }}>{theme.desc}</div>
                                            </div>
                                        </div>
                                        {plan.id !== 'FREE' && (
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'white', fontWeight: 'bold' }}>${plan.priceUsdt}</div>
                                                <div style={{ color: '#555', fontSize: '0.6rem' }}>≈ {(plan.priceUsdt * rate).toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* FEATURE LIST */}
                                    <div style={{
                                        background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 10,
                                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 15
                                    }}>
                                        <FeatureItem icon="fa-layer-group" txt={`${plan.plots} Land Plots`} highlight={true} />
                                        <FeatureItem icon="fa-warehouse" txt={plan.storage === Infinity ? 'Unlimited' : `${plan.storage} Storage`} />
                                        <FeatureItem icon="fa-percent" txt={`+${(plan.bonusSell * 100)}% Sales Bonus`} color="#FFC107" />
                                        <FeatureItem icon="fa-ban" txt={plan.ads === 'None' ? 'No Ads' : `${plan.ads} Ads`} />
                                    </div>

                                    {/* BUTTON ACTION */}
                                    {isCurrent ? (
                                        <div style={{
                                            textAlign: 'center', padding: 10, borderRadius: 10,
                                            background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50',
                                            fontWeight: 'bold', border: '1px solid rgba(76, 175, 80, 0.3)'
                                        }}>
                                            <i className="fa-solid fa-check-circle"></i> CURRENT PLAN
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgradeClick(plan.id, plan.priceUsdt)}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: 12, borderRadius: 10, border: 'none',
                                                background: `linear-gradient(90deg, ${theme.color}, ${theme.color}AA)`,
                                                color: plan.id === 'OWNER' ? 'black' : 'white', fontWeight: 'bold',
                                                boxShadow: `0 4px 15px ${theme.color}40`, cursor: 'pointer',
                                                opacity: loading ? 0.7 : 1
                                            }}
                                        >
                                            {loading ? 'Processing...' : `UPGRADE NOW`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
        </div>
    );
};

const FeatureItem = ({ icon, txt, highlight, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: color || '#ccc' }}>
        <i className={`fa-solid ${icon}`} style={{ width: 15, textAlign: 'center', color: highlight ? 'white' : (color || '#666') }}></i>
        <span>{txt}</span>
    </div>
);

export default MemberModal;
