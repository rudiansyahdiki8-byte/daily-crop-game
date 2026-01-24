import { useState, useEffect } from 'react';

const SpinModal = ({ isOpen, onClose, onSpin, userBalance, lastFreeSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultMsg, setResultMsg] = useState(null);

  // Hitung Cooldown
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    if (!isOpen) return;
    const checkTimer = setInterval(() => {
      const now = Date.now();
      const nextFree = (lastFreeSpin || 0) + (3600 * 1000); // 1 Jam Cooldown
      const diff = Math.ceil((nextFree - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(checkTimer);
  }, [isOpen, lastFreeSpin]);

  if (!isOpen) return null;

  const handleSpinClick = async (mode) => {
    if (isSpinning) return;
    setResultMsg(null);
    setIsSpinning(true);

    // 1. Putar roda cepat (Visual Loading)
    // Kita set rotasi random dulu biar terlihat muter
    const tempRotation = rotation + 1000 + Math.random() * 360;
    setRotation(tempRotation);

    try {
      // 2. Panggil API (Tunggu hasil dari server)
      // Server akan memberitahu kita dapat apa
      const data = await onSpin(mode);
      
      // 3. Stop di posisi yang benar (Visual Mapping)
      // Ini trik visual: Harusnya kita map ID hadiah ke sudut derajat.
      // Untuk simplifikasi sekarang: Kita biarkan berhenti random visualnya,
      // tapi tampilkan teks hasil yang AKURAT dari server.
      
      const finalRotate = tempRotation + 720; // Tambah putaran biar dramatis
      setRotation(finalRotate);

      // Tunggu animasi selesai (CSS transition 3s)
      setTimeout(() => {
        setIsSpinning(false);
        const name = data.reward.type === 'COIN' ? `${data.reward.val} PTS` : data.reward.itemName;
        setResultMsg(`SELAMAT! Anda dapat ${name}`);
      }, 3000);

    } catch (err) {
      setIsSpinning(false);
      alert(err.response?.data?.message || "Gagal Spin");
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0'+sec : sec}`;
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{position:'relative', width: 250, height: 250, marginBottom: 30}}>
        {/* POINTER (Panah Penunjuk) */}
        <div style={{
          position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
          borderTop: '25px solid white', zIndex: 10
        }}/>

        {/* RODA BERPUTAR */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          border: '5px solid #FFC107',
          background: 'conic-gradient(#F44336 0deg 45deg, #FF9800 45deg 90deg, #FFEB3B 90deg 135deg, #4CAF50 135deg 180deg, #2196F3 180deg 225deg, #3F51B5 225deg 270deg, #9C27B0 270deg 315deg, #E91E63 315deg 360deg)',
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          boxShadow: '0 0 20px rgba(255, 193, 7, 0.5)'
        }}>
           {/* Hiasan titik tengah */}
           <div style={{
             position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
             width: 50, height: 50, background:'white', borderRadius:'50%',
             display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#333'
           }}>
             SPIN
           </div>
        </div>
      </div>

      {/* HASIL MENANG */}
      {resultMsg && (
        <div style={{
          marginBottom: 20, padding: '10px 20px', background: '#4CAF50', 
          color: 'white', fontWeight: 'bold', borderRadius: 20, animation: 'pop 0.5s'
        }}>
          {resultMsg}
        </div>
      )}

      {/* TOMBOL KONTROL */}
      <div style={{display:'flex', gap:15}}>
        {/* FREE SPIN */}
        <button 
          onClick={() => handleSpinClick('FREE')}
          disabled={isSpinning || timeLeft > 0}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: timeLeft > 0 ? '#555' : '#2196F3',
            color: 'white', fontWeight: 'bold', cursor: timeLeft > 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {timeLeft > 0 ? formatTime(timeLeft) : 'FREE SPIN'}
        </button>

        {/* PAID SPIN */}
        <button 
          onClick={() => handleSpinClick('PAID')}
          disabled={isSpinning || userBalance < 150}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: userBalance < 150 ? '#555' : '#FFC107',
            color: 'black', fontWeight: 'bold', cursor: userBalance < 150 ? 'not-allowed' : 'pointer'
          }}
        >
          BAYAR 150 PTS
        </button>
      </div>

      <button onClick={onClose} style={{marginTop: 30, background:'transparent', border:'1px solid #aaa', color:'#aaa', padding:'5px 15px', borderRadius:20}}>
        Tutup
      </button>

      <style>{`@keyframes pop { 0% {transform: scale(0.5)} 100% {transform: scale(1)} }`}</style>
    </div>
  );
};

export default SpinModal;