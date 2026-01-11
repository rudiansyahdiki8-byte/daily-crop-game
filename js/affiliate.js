const AffiliateSystem = {
    
    init() {
        // Intercepting Neural Uplink Param (Referral)
        this.checkReferralParam();
        this.render();
    },

    checkReferralParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('startapp') || urlParams.get('ref');
        
        // Bind only if new node & not self-linking
        if (refCode && !GameState.user.upline && refCode !== GameState.user.userId) {
            GameState.user.upline = refCode;
            GameState.save();
            console.log(`[SYNDICATE] Uplink Established with Handler: ${refCode}`);
        }
    },

    render() {
        const container = document.getElementById('Affiliate');
        if (!container) return;

        // Data Retrieval
        const myLink = `https://t.me/DailyCropBot/start?startapp=${GameState.user.userId}`;
        const totalFriends = GameState.user.affiliate.total_friends;
        const totalEarnings = GameState.user.affiliate.total_earnings;
        const friendList = GameState.user.affiliate.friends_list || [];

        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-24 overflow-y-auto no-scrollbar bg-black/40";

        // 1. NETWORK DIVIDENDS (HEADER)
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="glass p-6 rounded-sm border border-indigo-500/30 relative overflow-hidden mb-6 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                
                <div class="relative z-10 text-center">
                    <p class="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-1 italic">Network Dividends</p>
                    <h1 class="text-4xl font-black text-white mb-4 tracking-tighter shadow-indigo-500/50">
                        ${totalEarnings.toLocaleString()} <span class="text-lg text-cyan-400">CRD</span>
                    </h1>
                    
                    <div class="flex gap-3 justify-center">
                        <div class="bg-black/60 px-4 py-2 rounded-sm border border-white/5 flex items-center gap-2">
                            <i class="fas fa-network-wired text-indigo-400"></i>
                            <div class="text-left">
                                <p class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Nodes</p>
                                <p class="text-[10px] font-black text-white">${totalFriends}</p>
                            </div>
                        </div>
                        <div class="bg-black/60 px-4 py-2 rounded-sm border border-white/5 flex items-center gap-2">
                            <i class="fas fa-microchip text-amber-400"></i>
                            <div class="text-left">
                                <p class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Cut</p>
                                <p class="text-[10px] font-black text-white">10%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(header);

        // 2. AGENT RECRUITMENT (INVITE)
        const inviteSec = document.createElement('div');
        inviteSec.className = "mb-6";
        inviteSec.innerHTML = `
            <div class="flex justify-between items-end mb-2 px-1">
                <h3 class="text-xs font-black text-white uppercase italic tracking-[0.1em]">Recruit Agents</h3>
                <span class="text-[8px] text-cyan-400 font-black bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 uppercase">10% Passive Yield</span>
            </div>
            
            <div class="bg-black p-1.5 border border-white/10 flex items-center gap-2">
                <div class="bg-indigo-950/20 h-10 flex-1 flex items-center px-4 overflow-hidden border border-indigo-500/20">
                    <p class="text-[8px] text-indigo-300 truncate font-mono tracking-tighter">${myLink}</p>
                </div>
                <button onclick="AffiliateSystem.copyLink('${myLink}')" class="h-10 w-12 bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_10px_#4f46e5] active:scale-90 transition-all">
                    <i class="fas fa-link text-sm"></i>
                </button>
            </div>
            <p class="text-[7px] text-gray-500 mt-2 px-1 leading-relaxed uppercase tracking-tighter italic">
                <i class="fas fa-shield-alt mr-1 text-indigo-500"></i> 
                Credits route to your buffer only after agent's 
                <strong class="text-indigo-300 underline">First Successful Liquidation</strong>.
            </p>
        `;
        container.appendChild(inviteSec);

        // 3. AGENT REGISTRY (FRIENDS LIST)
        const listSec = document.createElement('div');
        listSec.className = "flex-1 flex flex-col min-h-0";
        
        let listHTML = "";
        if (friendList.length === 0) {
            listHTML = `
                <div class="flex flex-col items-center justify-center py-12 opacity-30">
                    <i class="fas fa-satellite-dish text-4xl text-indigo-900 mb-3 animate-pulse"></i>
                    <p class="text-[9px] font-black text-indigo-700 uppercase tracking-widest">No Agents in Range</p>
                </div>
            `;
        } else {
            listHTML = friendList.map(f => `
                <div class="glass p-3 rounded-sm flex items-center justify-between border border-white/5 mb-2 hover:bg-white/5 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-sm bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center font-black text-[9px] text-white shadow-lg border border-white/10">
                            ${f.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase tracking-tight">${f.name}</p>
                            <p class="text-[7px] font-bold text-cyan-400 italic">Agent Verified</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black text-white">+${f.earnings} <span class="text-[7px] text-cyan-500">CRD</span></p>
                        <p class="text-[7px] text-gray-600 uppercase italic">Commission</p>
                    </div>
                </div>
            `).join('');
        }

        listSec.innerHTML = `
            <h3 class="text-xs font-black text-white uppercase italic tracking-[0.1em] mb-3 px-1">Agent Registry</h3>
            <div class="overflow-y-auto no-scrollbar pb-10">
                ${listHTML}
            </div>
        `;
        container.appendChild(listSec);
    },

    copyLink(text) {
        navigator.clipboard.writeText(text).then(() => {
            UIEngine.showRewardPopup("UPLINK COPIED", "Recruitment link encrypted and copied to clipboard.", null, "PROCEED");
        });
    }
};

window.AffiliateSystem = AffiliateSystem;