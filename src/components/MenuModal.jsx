const MenuModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const openLink = (url) => {
    // Simulasi buka link
    window.open(url, '_blank');
  };

  return (
    <div style={{
      position: 'absolute', bottom: 70, right: 10, width: 200, // Muncul di pojok kanan bawah
      background: '#222', border: '1px solid #FFC107', borderRadius: 10,
      zIndex: 100, overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
    }}>
      <div style={{display:'flex', flexDirection:'column'}}>
        <MenuItem label="📜 Terms of Use" onClick={() => alert("Halaman Terms of Use")} />
        <MenuItem label="🔒 Privacy Policy" onClick={() => alert("Halaman Privacy Policy")} />
        <MenuItem 
          label="📢 Telegram Channel" 
          onClick={() => openLink('https://t.me/username_channel_anda')} 
          color="#2196F3"
        />
        <div style={{borderTop:'1px solid #444'}}>
          <MenuItem label="Tutup Menu" onClick={onClose} color="#F44336" center />
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ label, onClick, color = '#fff', center }) => (
  <button 
    onClick={onClick}
    style={{
      background: 'transparent', border: 'none', color: color,
      padding: '15px 15px', textAlign: center ? 'center' : 'left',
      fontSize: '0.85rem', cursor: 'pointer',
      borderBottom: '1px solid #333'
    }}
  >
    {label}
  </button>
);

export default MenuModal;