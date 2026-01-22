// js/affiliate.js
const AffiliateSystem = {
    
    init() {
        // Cek URL Param saat start (Simulasi menangkap referral code)
        this.checkReferralParam();
        this.render();
    },

    // Menangkap "startapp=USERID" dari Telegram/URL dan simpan ke Cloud
    async checkReferralParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('startapp') || urlParams.get('ref');
        
        // Aturan: Ada kode ref, belum punya upline, dan bukan diri sendiri
        if (refCode && !GameState.user.upline && refCode !== GameState.user.userId) {
            GameState.user.upline = refCode;
            
            // Simpan ke Cloud agar hubungan pengundang terkunci permanen
            if (typeof GameState.save === 'function') {
                await GameState.save();
            }
            console.log(`[AFFILIATE] Cloud Bound to Upline: ${refCode}`);
        }
    },

// js/affiliate.js

    render() {
        const container = document.getElementById('Affiliate');
        if (!container) return;

        const myLink = `https://t.me/Daily_CropBot/start?startapp=${GameState.user.userId}`;
        const totalFriends = GameState.user.affiliate?.total_friends || 0;
        const totalEarnings = GameState.user.affiliate?.total_earnings || 0;
        const friendList = GameState.user.affiliate?.friends_list || [];

        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-24 overflow-y-auto no-scrollbar";

        // 1. HEADER CARD (Tetap Sama)
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

        // 2. INVITE SECTION (DENGAN MARKETING TEXT)
        const inviteSec = document.createElement('div');
        inviteSec.className = "mb-6";
        
        // Template Pesan Iklan (Jujur & Menarik)
        // Fokus: Simulasi Tani, Market Real-time, Gratis Main
        const promoText = `🚜 Join me in Daily Crop! Create your digital farm, plant exotic herbs, and trade them on the Global Market. Simple, relaxing, and fun! Start with my link:`;

        inviteSec.innerHTML = `
            <div class="glass p-5 rounded-[2rem] border border-white/10 relative overflow-hidden group mb-4">
                <h3 class="text-sm font-black text-white uppercase italic tracking-wider mb-2">Invite Link</h3>
                
                <div class="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 mb-4">
                    <div class="bg-black/80 h-10 flex-1 rounded-xl flex items-center px-4 overflow-hidden">
                        <p class="text-[9px] text-gray-400 truncate font-mono">${myLink}</p>
                    </div>
                    <button onclick="AffiliateSystem.copyLink('${myLink}')" class="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
                        <i class="fas fa-link"></i>
                    </button>
                </div>

                <div class="border-t border-white/5 pt-3">
                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-2"><i class="fas fa-bullhorn text-yellow-400 mr-1"></i> Quick Share Message</p>
                    <div class="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 relative">
                        <p class="text-[9px] text-gray-300 italic leading-relaxed pr-8">
                            "${promoText} <span class="text-indigo-400 font-bold">...</span>"
                        </p>
                        <button onclick="AffiliateSystem.copyPromo('${promoText}', '${myLink}')" class="absolute top-2 right-2 w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
                            <i class="fas fa-copy text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <p class="text-[8px] text-gray-500 px-2 leading-relaxed italic text-center">
                Get <span class="text-emerald-400 font-bold">+500 PTS Bonus</span> when your friend sells 1000 PTS worth of crops!
            </p>
        `;
        container.appendChild(inviteSec);

        // 3. FRIENDS LIST (Tetap Sama dengan Logic Status Baru)
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
            listHTML = friendList.map(f => {
                // Logic Status Visual
                let statusBadge = `<span class="text-[7px] font-bold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">PENDING</span>`;
                let iconColor = "from-gray-700 to-gray-900 grayscale";
                
                if (f.earnings >= 100) { 
                     statusBadge = `<span class="text-[7px] font-bold text-emerald-900 bg-emerald-400 px-1.5 py-0.5 rounded shadow-sm shadow-emerald-500/50">QUALIFIED ✅</span>`;
                     iconColor = "from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30";
                } else if (f.earnings > 0) {
                     statusBadge = `<span class="text-[7px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">FARMING...</span>`;
                     iconColor = "from-indigo-500 to-purple-600";
                }

                return `
                <div class="glass p-3 rounded-2xl flex items-center justify-between border border-white/5 mb-2 group hover:bg-white/5 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br ${iconColor} flex items-center justify-center font-black text-[10px] text-white transition-all">
                            ${f.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase mb-0.5">${f.name}</p>
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black text-emerald-400">+${f.earnings.toLocaleString()} PTS</p>
                        <p class="text-[7px] text-gray-500 uppercase tracking-tighter">Commission</p>
                    </div>
                </div>`;
            }).join('');
        }

        listSec.innerHTML = `<h3 class="text-sm font-black text-white uppercase italic tracking-wider mb-3 px-2">Referral List</h3><div class="overflow-y-auto no-scrollbar pb-10">${listHTML}</div>`;
        container.appendChild(listSec);
    },

    // FUNGSI COPY LINK BIASA
    copyLink(text) {
        navigator.clipboard.writeText(text).then(() => {
            if (window.UIEngine) UIEngine.showRewardPopup("COPIED", "Referral link copied!", null, "OK");
        });
    },

    // FUNGSI COPY MESSAGE + LINK
    copyPromo(text, link) {
        const fullMessage = `${text} ${link}`;
        navigator.clipboard.writeText(fullMessage).then(() => {
            if (window.UIEngine) UIEngine.showRewardPopup("COPIED", "Promo message copied to clipboard!", null, "GREAT");
        });
    }
};


window.AffiliateSystem = AffiliateSystem;
