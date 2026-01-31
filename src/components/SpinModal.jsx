import { useState, useEffect, useRef } from 'react';
import { SPIN_PRIZES, ITEM_DETAILS, CONSUMABLES, SPIN_CONFIG } from '../config/gameConstants';
import { showAdStack } from '../services/adManager';

const SpinModal = ({ isOpen, onClose, onSpin, userBalance, lastFreeSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pendingReward, setPendingReward] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claimLoading, setClaimLoading] = useState(false);

  const isMounted = useRef(false);

  // isOpen dependency removed as component now unmounts on close
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Helper Timer Cooldown
  useEffect(() => {
    if (!isOpen) return;
    const cooldownSec = SPIN_CONFIG?.COOLDOWN_FREE || 3600;
    const checkTimer = setInterval(() => {
      const now = Date.now();
      const nextFree = (lastFreeSpin || 0) + (cooldownSec * 1000);
      const diff = Math.ceil((nextFree - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(checkTimer);
  }, [isOpen, lastFreeSpin]);

  // --- 1. SPIN (ROLL STEP) ---
  const handleSpinClick = async (mode) => {
    if (isSpinning || pendingReward) return;
    setPendingReward(null);
    setIsSpinning(true);

    try {
      // API Call: ROLL
      const data = await onSpin(mode, 'ROLL');

      // --- SAFETY CHECK ---
      // Jika data kosong (misal koneksi putus), stop spinning agar tidak macet.
      if (!isMounted.current || !data || !data.rewardId) {
        setIsSpinning(false);
        return;
      }

      // Logika Animasi Roda
      const wonId = data.rewardId;
      const prizeIndex = SPIN_PRIZES.findIndex(p => p.id === wonId);
      const segmentAngle = 360 / SPIN_PRIZES.length;
      const targetAngle = -(prizeIndex * segmentAngle) - (segmentAngle / 2);
      const fullSpins = 5 * 360;
      const newRotation = rotation + fullSpins + (360 - (rotation % 360)) + targetAngle;

      setRotation(newRotation);

      // Tunggu animasi selesai (4 detik)
      setTimeout(() => {
        if (!isMounted.current) return;
        setIsSpinning(false);
        const prize = SPIN_PRIZES[prizeIndex];
        // Tampilkan Popup Hasil VIP
        setPendingReward({ prize: prize, mode: mode });
      }, 4000);

    } catch (err) {
      console.error("Spin Error:", err);
      if (isMounted.current) setIsSpinning(false);
    }
  };

  // --- 2. CLAIM REWARD (CLAIM STEP) ---
  const handleClaim = async () => {
    if (claimLoading) return;
    setClaimLoading(true);

    // Jika Free Spin -> Wajib Nonton Iklan
    if (pendingReward.mode === 'FREE') {
      const success = await showAdStack(1);
      if (!success) {
        setClaimLoading(false);
        return; // Iklan gagal/dibatal -> Stop claim
      }
      // Iklan Sukses -> Panggil API Claim
      try {
        await onSpin('FREE', 'CLAIM');
        setPendingReward(null);
        onClose();
      } catch {
        setClaimLoading(false);
      }
    } else {
      // Paid spin langsung tutup (hadiah sudah masuk di awal)
      setPendingReward(null);
      onClose();
    }
  };

  const handleDiscard = () => {
    setPendingReward(null);
    onClose();
  };

  // --- VISUAL HELPERS ---
  const getIcon = (prize) => {
    if (prize.type === 'COIN') return '💰';
    if (prize.type === 'ITEM') {
      if (CONSUMABLES[prize.val]) return '🧪';
      return ITEM_DETAILS[prize.val]?.icon || '🎁';
    }
    return '❓';
  };

  const segmentAngle = 360 / SPIN_PRIZES.length;
  const wheelGradient = `conic-gradient(` +
    SPIN_PRIZES.map((p, i) => `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`).join(', ') +
    `)`;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
  };

  if (!isOpen) return null;

  const prizeColor = pendingReward?.prize?.color || '#fff';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>

      <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 20, textShadow: '0 0 15px gold', letterSpacing: 2 }}>
        LUCKY WHEEL
      </div>

      {/* RODA SPIN */}
      <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 30 }}>
        {/* Penunjuk Merah */}
        <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', zIndex: 20, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.8))' }}>
          <div style={{ width: 0, height: 0, borderLeft: '25px solid transparent', borderRight: '25px solid transparent', borderTop: '40px solid #FF1744' }} />
        </div>
        {/* Lingkaran Roda */}
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #1a1a2e', boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: wheelGradient, transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none' }}>
            {SPIN_PRIZES.map((prize, i) => (
              <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: `translate(-50%, -50%) rotate(${(i * segmentAngle) + (segmentAngle / 2)}deg)` }}>
                <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', textShadow: '0 2px 4px black' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 2, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>{getIcon(prize)}</div>
                  <div style={{ maxWidth: 50, lineHeight: 1.1 }}>{prize.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Tombol Tengah */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 70, height: 70, background: 'radial-gradient(circle at 30% 30%, #fff, #ccc)', borderRadius: '50%', border: '5px solid #1a1a2e', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1a1a2e', boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.5)' }}>SPIN</div>
      </div>

      {/* === VIP REWARD POPUP === */}
      {pendingReward && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '85%', maxWidth: '360px', padding: '30px 25px',
          background: 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 100%)',
          border: `2px solid ${prizeColor}`, borderRadius: 30, textAlign: 'center',
          zIndex: 50, boxShadow: `0 0 60px ${prizeColor}60`, animation: 'popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          overflow: 'hidden' // Penting untuk efek sinar
        }}>
          {/* Efek Sinar Berputar di Belakang */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: '200%', height: '200%',
            transform: 'translate(-50%, -50%)', zIndex: -1, opacity: 0.3,
            background: `radial-gradient(circle, ${prizeColor} 0%, transparent 60%)`,
            animation: 'rotateSlow 10s linear infinite'
          }}></div>

          <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: 15, letterSpacing: 2, textTransform: 'uppercase' }}>CONGRATULATIONS!</div>

          <div style={{ fontSize: '5rem', marginBottom: 15, filter: `drop-shadow(0 0 20px ${prizeColor})`, animation: 'float 3s ease-in-out infinite' }}>
            {getIcon(pendingReward.prize)}
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: prizeColor, marginBottom: 5, textShadow: `0 0 20px ${prizeColor}80` }}>
            {pendingReward.prize.label}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: 30 }}>
            {pendingReward.mode === 'FREE' ? 'Watch a short ad to claim your reward' : 'Reward added to inventory!'}
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            {/* TOMBOL DISCARD */}
            <button onClick={handleDiscard} style={{
              flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`,
              color: '#aaa', fontWeight: 'bold', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              DISCARD
            </button>

            {/* TOMBOL CLAIM (VIP) */}
            <button onClick={handleClaim} disabled={claimLoading} style={{
              flex: 2, padding: '15px',
              background: pendingReward.mode === 'FREE' ? 'linear-gradient(90deg, #FFC107, #FF9800)' : `linear-gradient(90deg, ${prizeColor}, #4CAF50)`,
              border: 'none', color: pendingReward.mode === 'FREE' ? 'black' : 'white', fontWeight: 'bold', borderRadius: 20, cursor: claimLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 10px 25px ${prizeColor}40`, position: 'relative', overflow: 'hidden'
            }}>
              {claimLoading ? 'PROCESSING...' : (
                <>
                  {pendingReward.mode === 'FREE' && <i className="fa-solid fa-film"></i>}
                  {pendingReward.mode === 'FREE' ? 'CLAIM REWARD' : 'COLLECT'}
                </>
              )}
              {/* Efek Kilau di Tombol */}
              {!claimLoading && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shine 3s infinite' }} />}
            </button>
          </div>
        </div>
      )}

      {/* TOMBOL CONTROLLER */}
      {!pendingReward && (
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <button onClick={() => handleSpinClick('FREE')} disabled={isSpinning || timeLeft > 0} style={{ padding: '14px 30px', borderRadius: 50, border: 'none', background: timeLeft > 0 ? '#333' : 'linear-gradient(135deg, #00E5FF, #2979FF)', color: timeLeft > 0 ? '#888' : 'white', fontWeight: 'bold', cursor: timeLeft > 0 ? 'not-allowed' : 'pointer', minWidth: 140, boxShadow: timeLeft > 0 ? 'none' : '0 0 25px rgba(0, 229, 255, 0.4)', fontSize: '1rem' }}>
            {timeLeft > 0 ? formatTime(timeLeft) : 'FREE SPIN'}
          </button>
          <button onClick={() => handleSpinClick('PAID')} disabled={isSpinning || userBalance < (SPIN_CONFIG?.COST_PAID || 150)} style={{ padding: '14px 30px', borderRadius: 50, border: 'none', background: userBalance < (SPIN_CONFIG?.COST_PAID || 150) ? '#333' : 'linear-gradient(135deg, #FFD700, #FF8F00)', color: userBalance < (SPIN_CONFIG?.COST_PAID || 150) ? '#888' : 'black', fontWeight: 'bold', cursor: userBalance < (SPIN_CONFIG?.COST_PAID || 150) ? 'not-allowed' : 'pointer', minWidth: 140, boxShadow: userBalance < (SPIN_CONFIG?.COST_PAID || 150) ? 'none' : '0 0 25px rgba(255, 215, 0, 0.4)', fontSize: '1rem' }}>
            {SPIN_CONFIG?.COST_PAID || 150} PTS
          </button>
        </div>
      )}

      <button onClick={onClose} disabled={isSpinning || pendingReward} style={{ marginTop: 50, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 50, height: 50, borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes popIn { from {transform: translate(-50%, -40%) scale(0.8); opacity: 0} to {transform: translate(-50%, -50%) scale(1); opacity: 1} }
        @keyframes rotateSlow { from {transform: translate(-50%, -50%) rotate(0deg)} to {transform: translate(-50%, -50%) rotate(360deg)} }
        @keyframes float { 0%, 100% {transform: translateY(0)} 50% {transform: translateY(-10px)} }
        @keyframes shine { 0% {transform: translateX(-150%) skewX(-20deg)} 100% {transform: translateX(150%) skewX(-20deg)} }
      `}</style>
    </div>
  );
};

export default SpinModal;