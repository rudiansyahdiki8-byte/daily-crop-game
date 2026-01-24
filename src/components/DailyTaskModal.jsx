import { useState } from 'react';
import { claimDailyTask } from '../services/api'; // Import API

const TASKS = [
  { id: 1, label: 'Login Harian', reward: 50, icon: '📅' },
  { id: 2, label: 'Tanam Pohon', reward: 100, icon: '🌱' },
  { id: 3, label: 'Panen Hasil', reward: 100, icon: '🌾' },
  { id: 4, label: 'Tonton Iklan', reward: 150, icon: '📺' },
  { id: 5, label: 'Undang Teman', reward: 200, icon: '🤝' },
];

const DailyTaskModal = ({ isOpen, onClose, user, onRefresh }) => {
  const [loadingId, setLoadingId] = useState(null);

  if (!isOpen) return null;

  // Cek Tanggal Hari Ini
  const todayStr = new Date().toISOString().split('T')[0];
  const userTasks = user?.dailyTasks || {};

  const handleClaim = async (taskId) => {
    try {
      setLoadingId(taskId);
      
      // Simulasi Iklan untuk Task 4
      if (taskId === 4) {
        if(!confirm("Tonton iklan untuk claim reward?")) {
           setLoadingId(null); return;
        }
        // await showAd(); // Future implementation
      }

      const res = await claimDailyTask(user.id, taskId);
      alert(`Sukses! +${res.reward} PTS`);
      onRefresh(); // Refresh data user agar tombol jadi "SELESAI"
    } catch (err) {
      alert(err.response?.data?.message || "Gagal Claim");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.9)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '90%', maxHeight: '80%', background: '#fff', 
        borderRadius: 15, overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{padding: 15, background: '#2196F3', color: 'white', textAlign: 'center'}}>
           <h2 style={{margin:0}}>📅 Tugas Harian</h2>
           <p style={{fontSize:'0.8rem', margin:0}}>Reset: {todayStr}</p>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:15, background:'#f5f5f5'}}>
           {TASKS.map(task => {
             // Cek apakah di database sudah tercatat tanggal hari ini untuk task ini
             const isDone = userTasks[task.id] === todayStr;
             const isLoading = loadingId === task.id;

             return (
               <div key={task.id} style={{
                 background:'white', padding:10, marginBottom:10, borderRadius:10,
                 display:'flex', alignItems:'center', justifyContent:'space-between',
                 boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
               }}>
                 <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{fontSize:'1.5rem'}}>{task.icon}</span>
                    <div>
                      <div style={{fontWeight:'bold', color:'#333'}}>{task.label}</div>
                      <div style={{fontSize:'0.7rem', color:'#FF9800', fontWeight:'bold'}}>+{task.reward} PTS</div>
                    </div>
                 </div>
                 <button 
                   onClick={() => !isDone && handleClaim(task.id)}
                   disabled={isDone || isLoading}
                   style={{
                     background: isDone ? '#ccc' : '#4CAF50',
                     color: 'white', border: 'none', padding: '8px 15px', borderRadius: 20,
                     fontWeight: 'bold', cursor: isDone ? 'default' : 'pointer', minWidth: 80
                   }}
                 >
                   {isLoading ? '...' : isDone ? 'SELESAI' : 'CLAIM'}
                 </button>
               </div>
             );
           })}
        </div>

        <button onClick={onClose} style={{padding: 15, border:'none', background:'#ddd', color:'#333', fontWeight:'bold'}}>
          Tutup
        </button>
      </div>
    </div>
  );
};

export default DailyTaskModal;