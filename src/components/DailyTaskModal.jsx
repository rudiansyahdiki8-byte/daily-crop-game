import React from 'react';
import { DAILY_TASKS_LIST } from '../config/gameConstants';

const DailyTaskModal = ({ isOpen, onClose, user, onClaimTask }) => {
  if (!isOpen) return null;

  // User progress data
  const userTasks = user?.dailyTasks || {};
  // Use same date logic as backend (UTC YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '90%', maxHeight: '85%',
        background: 'linear-gradient(160deg, rgba(13, 71, 161, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
        border: '1px solid rgba(33, 150, 243, 0.3)',
        borderRadius: 20,
        boxShadow: '0 0 30px rgba(33, 150, 243, 0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white'
      }}>

        {/* HEADER */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(33, 150, 243, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.8rem' }}>📝</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', color: '#4FC3F7', letterSpacing: '1px' }}>DAILY MISSIONS</h2>
              <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Reset: {todayStr}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* TASK LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAILY_TASKS_LIST.map((task) => {
            const isDone = userTasks[task.id] === todayStr;

            return (
              <div key={task.id} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 15px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: isDone ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.1s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{
                    width: 45, height: 45, borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem'
                  }}>
                    {task.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: isDone ? '#aaa' : 'white' }}>
                      {task.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#FFD700', marginTop: 2 }}>
                      Reward: <span style={{ fontWeight: 'bold' }}>Random 💰</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isDone && onClaimTask(task.id)}
                  disabled={isDone}
                  style={{
                    background: isDone
                      ? 'transparent'
                      : 'linear-gradient(90deg, #FF9800, #F57C00)',
                    border: isDone ? '1px solid #4CAF50' : 'none',
                    color: isDone ? '#4CAF50' : 'white',
                    padding: '8px 16px', borderRadius: 25,
                    fontWeight: 'bold', fontSize: '0.8rem',
                    cursor: isDone ? 'default' : 'pointer',
                    minWidth: 90,
                    boxShadow: isDone ? 'none' : '0 4px 10px rgba(245, 124, 0, 0.3)'
                  }}
                >
                  {isDone ? 'COMPLETED' : 'CLAIM'}
                </button>
              </div>
            );
          })}
        </div>

        {/* INFO FOOTER (English) */}
        <div style={{ padding: 15, textAlign: 'center', fontSize: '0.7rem', color: '#666', background: 'rgba(0,0,0,0.2)' }}>
          Complete missions & watch ads to earn free points!
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default DailyTaskModal;