// js/affiliate.js
const AffiliateSystem = {
    
// public/js/affiliate.js

    init() {
        const container = document.getElementById('affiliate-container');
        if (!container) return;

        // Ambil data dari GameState (Data ini diupdate server saat ada penjualan)
        const affData = GameState.user.affiliate || {};
        const totalFriends = affData.total_friends || 0;
        const totalEarnings = (affData.total_earnings || 0).toLocaleString();
        const refLink = `https://t.me/DailyCropBot/game?startapp=${GameState.user.userId}`;

        container.innerHTML = `
            <div class="space-y-4 animate-fadeIn">
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-black/40 p-3 rounded-xl border border-white/10 text-center">
                        <div class="text-[10px] text-gray-400 uppercase">Total Friends</div>
                        <div class="text-xl font-black text-amber-400">${totalFriends}</div>
                    </div>
                    <div class="bg-black/40 p-3 rounded-xl border border-white/10 text-center">
                        <div class="text-[10px] text-gray-400 uppercase">Earnings (PTS)</div>
                        <div class="text-xl font-black text-green-400">${totalEarnings}</div>
                    </div>
                </div>

                <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div class="text-xs text-gray-300 mb-2">Your Referral Link:</div>
                    <div class="flex gap-2">
                        <input type="text" readonly value="${refLink}" 
                            class="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-[10px] flex-1 text-amber-200">
                        <button onclick="AffiliateSystem.copyLink('${refLink}')" 
                            class="bg-amber-500 text-black px-4 rounded-lg font-bold text-xs active:scale-95 transition-transform">
                            COPY
                        </button>
                    </div>
                </div>

                <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-amber-500 mt-1"></i>
                        <p class="text-[10px] text-amber-200/80 leading-relaxed">
                            Dapatkan komisi <span class="text-amber-400 font-bold">10% PTS</span> setiap kali teman Anda menjual hasil panen mereka ke Market. Saldo akan otomatis ditambahkan ke akun Anda.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },
    // Menangkap "startapp=USERID" dari Telegram/URL dan simpan ke Cloud
    // public/js/affiliate.js

    async checkReferralParam() {
        const urlParams = new URLSearchParams(window.location.search);
        // Telegram startapp param
        const refCode = urlParams.get('startapp');
        
        // JANGAN bind jika: 1. Tidak ada kode, 2. Sudah punya upline, 3. Kode itu ID sendiri
        if (refCode && !GameState.user.upline && refCode !== GameState.user.userId) {
            
            console.log(`[AFFILIATE] Mengirim data Upline ke Server: ${refCode}`);
            
            try {
                // PANGGIL BACKEND
                const response = await fetch('/api/affiliate/bind', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        refCode: refCode
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update Lokal agar sinkron
                    GameState.user.upline = refCode;
                    await GameState.save();
                    console.log("Upline successfully bound!");
                }
            } catch (e) {
                console.error("Gagal menghubungi server affiliate:", e);
            }
        }
    },

    render() {
        const container = document.getElementById('Affiliate');
        if (!container) return;

        // Ambil Data dari State (Data yang sudah dimuat dari Firebase)
        const myLink = `https://t.me/Daily_CropBot/start?startapp=${GameState.user.userId}`;
        const totalFriends = GameState.user.affiliate?.total_friends || 0;
        const totalEarnings = GameState.user.affiliate?.total_earnings || 0;
        const friendList = GameState.user.affiliate?.friends_list || [];

        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-24 overflow-y-auto no-scrollbar";

        // 1. HEADER CARD (Visual Tetap Asli)
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="glass p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden mb-6 shadow-2xl">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div class="relative z-10 text-center">
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Earnings</p>
                    <h1 class="text-4xl font-black text-white mb-4 drop-shadow-md">
                        ${totalEarnings.toLocaleString()} <span class="text-lg text-emerald-400">PTS</span>
                    </h1>
                    <div class="flex gap-3 justify-center">
                        <div class="bg-black/30 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <i class="fas fa-users text-indigo-400"></i>
                            <div class="text-left">
                                <p class="text-[7px] text-gray-500 font-bold uppercase">Friends</p>
                                <p class="text-[10px] font-black text-white">${totalFriends}</p>
                            </div>
                        </div>
                        <div class="bg-black/30 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <i class="fas fa-percent text-amber-400"></i>
                            <div class="text-left">
                                <p class="text-[7px] text-gray-500 font-bold uppercase">Rate</p>
                                <p class="text-[10px] font-black text-white">10%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(header);

        // 2. INVITE SECTION
        const inviteSec = document.createElement('div');
        inviteSec.className = "mb-6";
        inviteSec.innerHTML = `
            <div class="glass p-5 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                <h3 class="text-sm font-black text-white uppercase italic tracking-wider">Invite Friends</h3>
                <span class="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Earn 10% Passive</span>
            </div>
            <div class="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                <div class="bg-black/80 h-10 flex-1 rounded-xl flex items-center px-4 overflow-hidden">
                    <p class="text-[9px] text-gray-400 truncate font-mono">${myLink}</p>
                </div>
                <button onclick="AffiliateSystem.copyLink('${myLink}')" class="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <p class="text-[8px] text-gray-500 mt-2 px-2 leading-relaxed italic opacity-80">
                <i class="fas fa-info-circle mr-1"></i> Commission starts after friend's First Market Sell.
            </p>
        `;
        container.appendChild(inviteSec);

        // 3. FRIENDS LIST
        const listSec = document.createElement('div');
        listSec.className = "flex-1 flex flex-col min-h-0";
        
        let listHTML = "";
        if (friendList.length === 0) {
            listHTML = `
                <div class="flex flex-col items-center justify-center py-10 opacity-40">
                    <i class="fas fa-user-plus text-4xl text-gray-500 mb-3"></i>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">No friends yet</p>
                </div>`;
        } else {
            listHTML = friendList.map(f => `
                <div class="glass p-3 rounded-2xl flex items-center justify-between border border-white/5 mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-[10px] text-white">
                            ${f.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase">${f.name}</p>
                            <p class="text-[7px] font-bold text-emerald-400">Active Member</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black text-white">+${f.earnings.toLocaleString()} PTS</p>
                        <p class="text-[7px] text-gray-500 uppercase tracking-tighter">Earnings</p>
                    </div>
                </div>`).join('');
        }

        listSec.innerHTML = `<h3 class="text-sm font-black text-white uppercase italic tracking-wider mb-3 px-2">Referral List</h3><div class="overflow-y-auto no-scrollbar pb-10">${listHTML}</div>`;
        container.appendChild(listSec);
    },

    copyLink(text) {
        navigator.clipboard.writeText(text).then(() => {
            if (window.UIEngine) UIEngine.showRewardPopup("COPIED", "Referral link copied!", null, "OK");
        });
    }
};


window.AffiliateSystem = AffiliateSystem;