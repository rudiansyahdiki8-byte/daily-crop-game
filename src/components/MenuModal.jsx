import React, { useState, useEffect } from 'react';

const MenuModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState('MENU'); // 'MENU', 'PRIVACY', 'TERMS'

  // --- FIX: RESET TO MAIN MENU EVERY TIME OPENED ---
  useEffect(() => {
    if (isOpen) {
      setView('MENU');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // OFFICIAL LINK
  const CHANNEL_LINK = "https://t.me/Daily_Crop_News";

  const openLink = (url) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // --- LEGAL TEXT CONTENT ---
  const PRIVACY_TEXT = (
    <div style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: '1.5' }}>
      <p><strong>Last Updated: January 2025</strong></p>

      <p><strong>1. Data Collection</strong><br />
        We collect minimal data to function:
        <ul style={{ paddingLeft: 20, margin: '5px 0' }}>
          <li>Telegram ID & Username (for authentication).</li>
          <li>Wallet Addresses & FaucetPay Email (for withdrawals).</li>
          <li>In-game activity (transactions, harvest logs).</li>
        </ul>
      </p>

      <p><strong>2. Data Usage</strong><br />
        We use your data strictly to:
        <ul style={{ paddingLeft: 20, margin: '5px 0' }}>
          <li>Process deposit and withdrawal requests.</li>
          <li>Detect fraud and multiple account usage (Anti-Cheat).</li>
          <li>Calculate affiliate commissions.</li>
        </ul>
      </p>

      <p><strong>3. Third Parties</strong><br />
        We do not sell your personal data. Your wallet address is shared only with blockchain networks or FaucetPay API solely for executing transactions.
      </p>
    </div>
  );

  const TERMS_TEXT = (
    <div style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: '1.5' }}>
      <p><strong>1. Acceptance of Terms</strong><br />
        By playing <em>Cyber Farmer</em>, you agree to these terms. If you do not agree, please close the app immediately.
      </p>

      <p><strong>2. Prohibited Activities (Banned)</strong><br />
        <span style={{ color: '#F44336' }}>Warning: We have a zero-tolerance policy for cheating.</span>
        <ul style={{ paddingLeft: 20, margin: '5px 0' }}>
          <li>Creating multiple accounts (Multi-accounting/Tuyul).</li>
          <li>Using bots, scripts, or auto-clickers.</li>
          <li>Using VPN/Proxy to bypass restrictions.</li>
          <li>Referral abuse (fake invites).</li>
        </ul>
        Violation will result in a <strong>Permanent Ban</strong> and confiscation of all balance.
      </p>

      <p><strong>3. Virtual Currency (PTS)</strong><br />
        "PTS" is a virtual game currency. It has no real-world value until withdrawn. We reserve the right to adjust exchange rates (PTS to USDT) or fee structures at any time to ensure game economy stability.
      </p>

      <p><strong>4. Payments & Refunds</strong><br />
        All Deposits and Membership purchases are <strong>FINAL</strong> and non-refundable. Withdrawals are processed manually or automatically depending on system status. We are not responsible for funds sent to wrong addresses input by users.
      </p>

      <p><strong>5. Disclaimer</strong><br />
        This service is provided "as is". We do not guarantee profits. Play responsibly.
      </p>
    </div>
  );

  // --- RENDER CONTENT ---
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1300,
      display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
    }}>
      <div style={{
        width: '85%', maxWidth: '380px', maxHeight: '80vh',
        background: 'linear-gradient(160deg, #20202a 0%, #15151a 100%)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.7)'
      }}>

        {/* HEADER */}
        <div style={{
          padding: 20, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
        }}>
          {view !== 'MENU' && (
            <button onClick={() => setView('MENU')} style={{
              position: 'absolute', left: 15, background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer'
            }}><i className="fa-solid fa-arrow-left"></i></button>
          )}
          <h2 style={{ margin: 0, color: 'white', letterSpacing: 1, fontSize: '1rem' }}>
            {view === 'MENU' ? 'SETTINGS' : view === 'PRIVACY' ? 'PRIVACY POLICY' : 'TERMS OF USE'}
          </h2>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {view === 'MENU' ? (
            <>
              {/* 1. COMMUNITY & NEWS */}
              <div style={sectionTitleStyle}>COMMUNITY</div>
              <MenuButton
                icon="fa-bullhorn" label="Official Channel"
                sub="Info Withdraw, Deposit & Legend Drops"
                onClick={() => openLink(CHANNEL_LINK)}
                color="#0088cc"
              />

              {/* 2. LEGAL & INFO */}
              <div style={sectionTitleStyle}>LEGAL & INFO</div>
              <MenuButton icon="fa-file-shield" label="Privacy Policy" onClick={() => setView('PRIVACY')} />
              <MenuButton icon="fa-file-contract" label="Terms of Use" onClick={() => setView('TERMS')} />

              {/* 3. SETTINGS */}
              <div style={sectionTitleStyle}>GAME SETTINGS</div>
              <div style={toggleRowStyle}>
                <span><i className="fa-solid fa-music" style={{ width: 20, textAlign: 'center' }}></i> Music</span>
                <div style={fakeToggleStyle(true)}></div>
              </div>
              <div style={toggleRowStyle}>
                <span><i className="fa-solid fa-volume-high" style={{ width: 20, textAlign: 'center' }}></i> SFX</span>
                <div style={fakeToggleStyle(true)}></div>
              </div>
            </>
          ) : view === 'PRIVACY' ? (
            PRIVACY_TEXT
          ) : (
            TERMS_TEXT
          )}

        </div>

        {/* FOOTER */}
        <div style={{ padding: 20 }}>
          <button onClick={onClose} style={{
            width: '100%', padding: 12, borderRadius: 10,
            background: '#B71C1C', color: 'white', border: 'none',
            cursor: 'pointer', fontWeight: 'bold'
          }}>
            CLOSE
          </button>
        </div>

      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:scale(0.95)} to {opacity:1; transform:scale(1)} }`}</style>
    </div>
  );
};

// --- STYLES & SUB COMPONENTS ---

const sectionTitleStyle = {
  fontSize: '0.7rem', color: '#666', fontWeight: 'bold', marginTop: 10, marginBottom: 5, letterSpacing: 1
};

const toggleRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: 10,
  color: 'white', fontSize: '0.9rem'
};

const fakeToggleStyle = (active) => ({
  width: 40, height: 20, background: active ? '#4CAF50' : '#555',
  borderRadius: 20, position: 'relative',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
});

const MenuButton = ({ icon, label, sub, onClick, color }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 15,
    padding: '12px 15px', background: 'rgba(255,255,255,0.05)',
    border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.2s'
  }}>
    <div style={{
      width: 35, height: 35, borderRadius: 8, background: 'rgba(0,0,0,0.3)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      color: color || '#aaa'
    }}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
      <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>{label}</div>
      {sub && <div style={{ color: '#666', fontSize: '0.7rem' }}>{sub}</div>}
    </div>
    <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', color: '#444', fontSize: '0.8rem' }}></i>
  </button>
);

export default MenuModal;