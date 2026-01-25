import { useState, useEffect, useRef } from 'react';
import { SPIN_PRIZES, ITEM_DETAILS, CONSUMABLES } from '../config/gameConstants';

const SpinModal = ({ isOpen, onClose, onSpin, userBalance, lastFreeSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pendingReward, setPendingReward] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Ref untuk mendeteksi apakah komponen masih aktif (biar timer gak bocor)
  const isMounted = useRef(false);

  // --- 1. RESET STATE SAAT DIBUKA ---
  useEffect(() => {
    if (isOpen) {
        // Setiap kali dibuka, pastikan bersih dari sisa spin sebelumnya
        setPendingReward(null);
        setIsSpinning(false);
        isMounted.current = true;
    } else {
        isMounted.current = false;
    }
  }, [isOpen]);

  // Helper Ikon
  const getIcon = (prize) => {
    if (prize.type === 'COIN') return '💰';
    if (prize.type === 'ITEM') {
        if (CONSUMABLES[prize.val]) return '🧪'; 
        return ITEM_DETAILS[prize.val]?.icon || '🎁';
    }
    return '❓';
  };

  // Gradient Roda
  const segmentAngle = 360 / SPIN_PRIZES.length;
  const wheelGradient = `conic-gradient(` + 
    SPIN_PRIZES.map((p, i) => `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`).join(', ') + 
  `)`;

  // Timer Cooldown
  useEffect(() => {
    if (!isOpen) return;
    const checkTimer = setInterval(() => {
      const now = Date.now();
      const nextFree = (lastFreeSpin || 0) + (3600 * 1000); 
      const diff = Math.ceil((nextFree - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(checkTimer);
  }, [isOpen, lastFreeSpin]);

  if (!isOpen) return null;

  const handleSpinClick = async (mode) => {
    // Cegah klik ganda
    if (isSpinning || pendingReward) return;

    setPendingReward(null); 
    setIsSpinning(true);

    try {
      // 1. PANGGIL API DULU (JANGAN PUTAR DULU)
      // Kita tunggu backend memberi tahu kita dapat apa, baru kita putar rodanya.
      const data = await onSpin(mode); 
      
      // Jika modal ditutup saat loading, stop.
      if (!isMounted.current) return;

      const wonId = data.rewardId; 

      // 2. HITUNG MATEMATIKA RODA
      // Ambil posisi sekarang agar putaran berlanjut (tidak reset ke 0)
      const currentRotation = rotation; 
      
      // Cari segmen hadiah
      const prizeIndex = SPIN_PRIZES.findIndex(p => p.id === wonId);
      
      // Sudut target segmen (pointer ada di atas/0 derajat)
      // Rumus: -(Index * LebarSegmen) - (SetengahLebarSegmen)
      const targetAngle = -(prizeIndex * segmentAngle) - (segmentAngle / 2);

      // 3. TENTUKAN PUTARAN AKHIR
      // Kita ingin menambah minimal 5 putaran penuh (1800 derajat) dari posisi sekarang
      // Trik: Kita harus menyesuaikan sisa putaran agar pas mendarat di targetAngle
      
      // Hitung posisi target absolut berikutnya yang > currentRotation + 1800
      // Caranya: (RotasiSekarang - SisaModulus) + (5 Putaran) + TargetBaru
      const fullSpins = 5 * 360; // 5 Putaran Penuh
      
      // Penyesuaian agar sudutnya pas (Relative Calculation)
      // Kita ambil kelipatan 360 terdekat, tambah 5 putaran, lalu set ke target
      const newRotation = currentRotation + fullSpins + (360 - (currentRotation % 360)) + targetAngle;

      // 4. EKSEKUSI PUTARAN (HANYA SEKALI)
      setRotation(newRotation);

      // 5. TUNGGU ANIMASI SELESAI (4 Detik sesuai CSS)
      setTimeout(() => {
        if (!isMounted.current) return;

        setIsSpinning(false);
        const prize = SPIN_PRIZES[prizeIndex];
        
        // Tampilkan Popup
        setPendingReward({
            prize: prize,
            mode: mode 
        });
      }, 4000);

    } catch (err) {
      if (isMounted.current) {
         setIsSpinning(false);
         alert(err.response?.data?.message || "Gagal Spin");
      }
    }
  };

  // Tombol "AMBIL" (Logic Sementara Tanpa Iklan)
  const handleTakeReward = () => {
      // Tutup modal dan reset
      setPendingReward(null);
      onClose();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0'+sec : sec}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      
      <div style={{color:'#FFD700', fontSize:'1.5rem', fontWeight:'bold', marginBottom:20, textShadow:'0 0 10px gold'}}>
         LUCKY WHEEL
      </div>

      {/* AREA RODA */}
      <div style={{position:'relative', width: 300, height: 300, marginBottom: 30}}>
        {/* POINTER */}
        <div style={{
          position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
        }}>
           <div style={{
             width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: '30px solid #FF1744'
           }}/>
        </div>

        {/* RODA */}
        <div style={{
            width:'100%', height:'100%', borderRadius:'50%', border:'8px solid #333', boxShadow:'0 0 20px rgba(255, 215, 0, 0.3)', overflow:'hidden', position:'relative'
        }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', background: wheelGradient,
              transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none',
            }}>
               {SPIN_PRIZES.map((prize, i) => (
                 <div key={i} style={{
                    position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%',
                    transform: `translate(-50%, -50%) rotate(${(i * segmentAngle) + (segmentAngle/2)}deg)`,
                 }}>
                    <div style={{
                        position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                        textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', textShadow: '0 1px 2px black'
                    }}>
                        <div style={{fontSize:'1.2rem', marginBottom:2}}>{getIcon(prize)}</div>
                        <div style={{maxWidth:50, lineHeight:1}}>{prize.label}</div>
                    </div>
                 </div>
               ))}
            </div>
        </div>
        
        {/* TITIK TENGAH */}
        <div style={{
           position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
           width: 60, height: 60, background:'radial-gradient(circle, #fff, #ddd)', 
           borderRadius:'50%', border:'4px solid #333', zIndex:10,
           display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#333'
        }}>SPIN</div>
      </div>

      {/* POPUP HASIL */}
      {pendingReward && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
          width: '80%', padding: 20, background: 'rgba(20, 20, 30, 0.95)', 
          border: '2px solid #FFD700', borderRadius: 20, textAlign: 'center', 
          zIndex: 50, boxShadow:'0 0 50px rgba(0,0,0,0.8)', animation: 'popIn 0.3s'
        }}>
           <div style={{color:'#aaa', fontSize:'0.8rem', marginBottom:5}}>HASIL SPIN:</div>
           <div style={{fontSize:'3rem', marginBottom:10}}>{getIcon(pendingReward.prize)}</div>
           <div style={{fontSize:'1.5rem', fontWeight:'bold', color: pendingReward.prize.color, marginBottom:20}}>
              {pendingReward.prize.label}
           </div>

           <button onClick={handleTakeReward} style={{
               width:'100%', padding:'12px', background:'#4CAF50', border:'none', color:'white', fontWeight:'bold', borderRadius:10
           }}>
               AMBIL HADIAH
           </button>
        </div>
      )}

      {/* TOMBOL SPIN (Hilang saat ada Popup Hasil) */}
      {!pendingReward && (
          <div style={{display:'flex', gap:20}}>
            <button 
              onClick={() => handleSpinClick('FREE')}
              disabled={isSpinning || timeLeft > 0}
              style={{
                padding: '12px 25px', borderRadius: 50, border: 'none',
                background: timeLeft > 0 ? '#333' : 'linear-gradient(135deg, #2196F3, #2979FF)',
                color: timeLeft > 0 ? '#888' : 'white', fontWeight: 'bold', 
                cursor: timeLeft > 0 ? 'not-allowed' : 'pointer', minWidth: 120
              }}
            >
              {timeLeft > 0 ? formatTime(timeLeft) : 'FREE SPIN'}
            </button>

            <button 
              onClick={() => handleSpinClick('PAID')}
              disabled={isSpinning || userBalance < 150}
              style={{
                padding: '12px 25px', borderRadius: 50, border: 'none',
                background: userBalance < 150 ? '#333' : 'linear-gradient(135deg, #FFD700, #FF8F00)',
                color: userBalance < 150 ? '#888' : 'black', fontWeight: 'bold', 
                cursor: userBalance < 150 ? 'not-allowed' : 'pointer', minWidth: 120
              }}
            >
              150 PTS
            </button>
          </div>
      )}

      <button onClick={onClose} disabled={isSpinning || pendingReward} style={{
          marginTop: 40, background:'transparent', border:'none', color:'#aaa', fontSize:'2rem', cursor:'pointer'
      }}>✕</button>

      <style>{`@keyframes popIn { from {transform: translate(-50%, -40%); opacity: 0} to {transform: translate(-50%, -50%); opacity: 1} }`}</style>
    </div>
  );
};

export default SpinModal;