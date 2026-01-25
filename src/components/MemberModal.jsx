import { PLANS } from '../config/gameConstants';

const MemberModal = ({ isOpen, onClose, currentPlan, onUpgrade, loading }) => {
  if (!isOpen) return null; // Jangan render apa-apa jika tidak aktif

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '85%', background: '#222', border: '1px solid #FFC107', borderRadius: 15,
        padding: 20, maxHeight: '80%', overflowY: 'auto'
      }}>
        {/* Header Modal */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
          <h2 style={{margin:0, color:'#FFC107'}}>Membership</h2>
          <button 
            onClick={onClose} 
            style={{background:'red', border:'none', color:'white', borderRadius:5, cursor:'pointer', padding:'5px 10px'}}
          >
            X
          </button>
        </div>
        
        {/* List Plan Loop */}
        {Object.values(PLANS).map((plan) => {
          const isCurrent = currentPlan === plan.id;
          // Jangan tampilkan tombol upgrade untuk Plan Free atau Plan yang sudah lewat
          // Logika sederhana: Tampilkan tombol jika user BUKAN plan ini
          // (Validasi urutan ada di backend, di sini kita UX simpel saja)
          
          return (
            <div key={plan.id} style={{
              background: isCurrent ? '#1a3a1a' : '#333',
              border: isCurrent ? '2px solid #4CAF50' : '1px solid #555',
              padding: 10, marginBottom: 10, borderRadius: 8,
              opacity: plan.id === 'FREE' ? 0.6 : 1
            }}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <strong style={{color:'white'}}>{plan.id}</strong>
                <span style={{color:'#FFC107'}}>${plan.priceUsdt || 0}</span>
              </div>
              
              <ul style={{fontSize:'0.75rem', color:'#ccc', paddingLeft:20, marginTop:5, marginBottom:10}}>
                <li>Lahan: {plan.plots} Plot</li>
                <li>Gudang: {plan.storage === Infinity ? 'Unlimited' : plan.storage}</li>
                <li>Bonus Jual: +{plan.bonusSell * 100}%</li>
              </ul>
              
              {/* Tombol Action */}
              {!isCurrent && plan.id !== 'FREE' && (
                <button 
                  onClick={() => onUpgrade(plan.id)}
                  disabled={loading}
                  style={{
                    width:'100%', padding:8, 
                    background: loading ? '#555' : '#FFC107', 
                    color: loading ? '#aaa' : '#000',
                    border:'none', fontWeight:'bold', cursor: loading ? 'wait' : 'pointer',
                    borderRadius: 5
                  }}
                >
                  {loading ? 'Processing...' : `UPGRADE ($${plan.priceUsdt})`}
                </button>
              )}

              {isCurrent && (
                <div style={{
                    textAlign:'center', color:'#4CAF50', fontSize:'0.8rem', fontWeight:'bold',
                    background: 'rgba(76, 175, 80, 0.1)', padding: 5, borderRadius: 5
                }}>
                    PLAN AKTIF
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberModal;