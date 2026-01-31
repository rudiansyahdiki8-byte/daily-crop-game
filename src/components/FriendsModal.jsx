import React from 'react';
import { showRewardPopup } from '../services/adManager';

const FriendsModal = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;

    // GANTI INI DENGAN USERNAME BOT ANDA (Tanpa @)
    const BOT_USERNAME = "Daily_Cropbot/play";

    // Link Referral Otomatis
    const referralLink = `https://t.me/${BOT_USERNAME}?startapp=${user?.telegramId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        showRewardPopup("COPIED!", "Link copied to clipboard", "fa-copy");
    };

    // --- LOGIKA LIST TEMAN ---
    // Mengubah data 'referrals' (Object) menjadi Array agar bisa di-looping
    // Format Data dari Backend: { "ID123": { username: "Budi", totalBonusGiven: 500 }, ... }
    const friendsList = user?.referrals ? Object.values(user.referrals) : [];

    // Urutkan teman berdasarkan siapa yang paling banyak kasih duit (High to Low)
    friendsList.sort((a, b) => (b.totalBonusGiven || 0) - (a.totalBonusGiven || 0));

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
        }}>
            <div style={{
                width: '90%', maxHeight: '85%', maxWidth: '400px',
                background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: 25, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 0 40px rgba(0,0,0,0.6)'
            }}>

                {/* HEADER */}
                <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.5rem' }}>🤝</span>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', letterSpacing: 1 }}>PARTNERS</div>
                            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Invite friends, earn passive income</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                {/* STATS CARD */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 15 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 5 }}>👥</div>
                        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>TOTAL FRIENDS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{user?.friendsCount || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 15 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 5 }}>💸</div>
                        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>TOTAL EARNINGS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFD700' }}>{(user?.affiliateEarnings || 0).toLocaleString()}</div>
                    </div>
                </div>

                {/* LINK COPY SECTION */}
                <div style={{ padding: '0 20px', marginTop: 20 }}>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 8, marginLeft: 5 }}>YOUR INVITE LINK</div>
                    <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#00E5FF', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {referralLink}
                        </div>
                        <button onClick={handleCopy} style={{ background: '#2196F3', border: 'none', borderRadius: 8, width: 35, height: 35, color: 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-copy"></i>
                        </button>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
                        *Friends are automatically linked when they open the game via your link.
                    </div>
                </div>

                {/* LIST DAFTAR TEMAN */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa', marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>ACTIVE FARMERS ({friendsList.length})</span>
                        <span style={{ fontSize: '0.6rem', color: '#4CAF50' }}>Top Contributors</span>
                    </div>

                    {friendsList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', border: '1px dashed #444', borderRadius: 15 }}>
                            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
                            <div>No friends yet.</div>
                            <div style={{ fontSize: '0.8rem' }}>Share your link to start earning!</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {friendsList.map((friend, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: 12,
                                    border: idx < 3 ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid transparent' // Top 3 dapet border emas tipis
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Avatar Inisial */}
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%',
                                            background: `hsl(${(friend.username.length * 20) % 360}, 70%, 40%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', color: 'white', fontSize: '1rem',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                        }}>
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>
                                                {friend.username}
                                                {idx < 3 && <span style={{ marginLeft: 5 }}>👑</span>}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>
                                                Joined: {new Date(friend.joinDate || new Date().getTime()).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#4CAF50' }}>Profit Share</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFD700' }}>
                                            +{(friend.totalBonusGiven || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            <style>{`@keyframes fadeIn { from {opacity:0; transform:translateY(10px)} to {opacity:1; transform:translateY(0)} }`}</style>
        </div>
    );
};

export default FriendsModal;