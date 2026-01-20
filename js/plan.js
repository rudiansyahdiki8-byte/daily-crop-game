// js/plan.js
const PlanSystem = {
    // MENGAMBIL HARGA DARI CONFIG.JS
    // Menggunakan "getter" agar otomatis membaca perubahan di config
    get prices() {
        return window.GameConfig.Plans; 
    },

    init() {
        const container = document.getElementById('SubscibePlan');
        if (container) {
            this.render(container);
        }
    },

    render(container) {
        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 overflow-y-auto no-scrollbar pb-32 bg-black/20";

        // INJECT STYLE (Tetap di sini karena ini spesifik UI Plan)
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            .card-anim { animation: slideInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
            .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 3s infinite linear; position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
        `;
        container.appendChild(style);

        const header = document.createElement('div');
        header.className = "flex justify-between items-center mb-6 px-1";
        header.innerHTML = `<div><h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Membership</h2><p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Unlock Premium Features</p></div>`;
        container.appendChild(header);

        // DATA VISUAL & BENEFIT (Tetap di sini karena ini aset Tampilan, bukan Konfigurasi Angka)
        const tierData = {
            'FREE': { 
                title: "FREE FARMER", sub: "STARTER", 
                desc: [
                    { i: 'fa-seedling', t: '1 Active Plot', c: 'text-emerald-400' }, 
                    { i: 'fa-warehouse', t: 'Max 50 Items', c: 'text-blue-400' }, 
                    { i: 'fa-ban', t: 'Base Sell Price', c: 'text-gray-400' }, 
                    { i: 'fa-tv', t: 'Standard Ads', c: 'text-gray-400' }
                ], 
                bg: "bg-slate-800", border: "border-slate-950" 
            },
            'MORTGAGE': { 
                title: "MORTGAGE", sub: "TIER 2", 
                desc: [
                    { i: 'fa-th-large', t: '4 Active Plots', c: 'text-emerald-400' }, 
                    { i: 'fa-warehouse', t: 'Max 240 Items', c: 'text-blue-400' }, 
                    { i: 'fa-chart-line', t: '+5% Sell Bonus', c: 'text-yellow-400' }, 
                    { i: 'fa-star', t: 'Bronze Badge', c: 'text-amber-600' }
                ], 
                bg: "bg-blue-900", border: "border-blue-950" 
            },
            'TENANT': { 
                title: "TENANT", sub: "TIER 3", 
                desc: [
                    { i: 'fa-th', t: '6 Active Plots', c: 'text-emerald-400' }, 
                    { i: 'fa-warehouse', t: 'Max 500 Items', c: 'text-blue-400' }, 
                    { i: 'fa-chart-line', t: '+15% Sell Bonus', c: 'text-yellow-400' }, 
                    { i: 'fa-crown', t: 'Silver Badge', c: 'text-gray-300' }
                ], 
                bg: "bg-purple-900", border: "border-purple-950" 
            },
            'OWNER': { 
                title: "LANDLORD", sub: "TYCOON", 
                desc: [
                    { i: 'fa-border-all', t: '8 Active Plots', c: 'text-emerald-400' }, 
                    { i: 'fa-infinity', t: 'UNLIMITED Storage', c: 'text-blue-400' }, 
                    { i: 'fa-rocket', t: '+30% Sell Bonus', c: 'text-yellow-400' }, 
                    { i: 'fa-gem', t: 'VIP Status', c: 'text-amber-400 font-black' }
                ], 
                bg: "bg-gradient-to-r from-amber-700 to-red-900", border: "border-red-950" 
            }
        };

        const grid = document.createElement('div');
        grid.className = "flex flex-col gap-6";
        const plans = ['FREE', 'MORTGAGE', 'TENANT', 'OWNER'];
        
        plans.forEach((planKey, index) => {
            const data = tierData[planKey];
            const price = this.prices[planKey]; // Mengambil harga dari config
            const isCurrent = GameState.user.plan === planKey;
            
            // Logic Cek Plan
            const tiers = { 'FREE': 1, 'MORTGAGE': 2, 'TENANT': 3, 'OWNER': 4 };
            const currentTier = tiers[GameState.user.plan];
            const thisTier = tiers[planKey];
            const isOwned = thisTier < currentTier;

            let cardBaseClass = `relative flex w-full h-36 rounded-2xl overflow-hidden shadow-xl transition-transform duration-300 card-anim border-b-[6px] active:border-b-0 active:translate-y-[6px]`;
            let rightHTML = "";
            let overlayHTML = "";
            const animDelay = `animation-delay: ${index * 150}ms`;

            if (isCurrent) {
                cardBaseClass += ` bg-emerald-700 border-emerald-900`;
                rightHTML = `<div class="h-full w-full flex flex-col items-center justify-center bg-black/20 text-white gap-2"><div class="p-2 bg-white/20 rounded-full animate-pulse"><i class="fas fa-check text-xl"></i></div><span class="text-[9px] font-black uppercase tracking-widest">Active</span></div>`;
                overlayHTML = `<div class="shimmer-effect opacity-30"></div>`;
            } else if (isOwned) {
                cardBaseClass += ` bg-gray-700 border-gray-900 opacity-60 grayscale`;
                rightHTML = `<div class="h-full w-full flex flex-col items-center justify-center bg-black/40 text-gray-400 gap-1"><i class="fas fa-lock-open text-xl"></i><span class="text-[9px] font-bold uppercase">Unlocked</span></div>`;
            } else {
                if(planKey === 'OWNER') {
                    cardBaseClass += ` bg-gradient-to-r from-amber-600 to-red-700 border-red-900`;
                    overlayHTML = `<div class="shimmer-effect opacity-50"></div>`;
                } else {
                    cardBaseClass += ` ${data.bg} ${data.border}`;
                }
                
                // TOMBOL UPGRADE
                rightHTML = `
                <button onclick="PlanSystem.redirectToDeposit('${planKey}', ${price})" class="w-full h-full flex flex-col items-center justify-center bg-black/20 hover:bg-black/10 transition-colors gap-1 text-white relative overflow-hidden group">
                    <span class="text-[9px] font-bold opacity-80 group-hover:scale-110 transition-transform">UPGRADE</span>
                    <div class="font-black text-xs bg-black/40 px-2 py-1 rounded shadow-lg whitespace-nowrap group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        ${price} USDT
                    </div>
                    <i class="fas fa-chevron-right mt-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
                </button>`;
            }

            const featuresHTML = data.desc.map(d => `<div class="flex items-center gap-2 text-white/90"><div class="w-4 flex justify-center"><i class="fas ${d.i} text-[10px] ${d.c}"></i></div><span class="text-[9px] font-bold uppercase tracking-wide text-gray-200 shadow-black drop-shadow-sm truncate">${d.t}</span></div>`).join('');
            const card = document.createElement('div');
            card.className = cardBaseClass;
            card.style = animDelay;
            card.innerHTML = `${overlayHTML}<div class="flex-1 p-3 flex flex-col justify-between relative z-10 pl-4"><div class="border-b border-white/10 pb-2 mb-1"><div class="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0.5">${data.sub}</div><h3 class="text-xl font-black text-white italic uppercase tracking-wider leading-none drop-shadow-md">${data.title}</h3></div><div class="grid grid-cols-1 gap-1">${featuresHTML}</div></div><div class="w-20 border-l border-black/20 relative z-20 flex-shrink-0 backdrop-blur-sm">${rightHTML}</div><div class="absolute -bottom-2 right-20 text-7xl text-white opacity-5 pointer-events-none z-0 rotate-12"><i class="fas ${data.desc[0].i.replace('fa-', 'fa-')}"></i></div>`;
            grid.appendChild(card);
        });
        container.appendChild(grid);
    },

    redirectToDeposit(planKey, price) {
        const tiers = { 'FREE': 1, 'MORTGAGE': 2, 'TENANT': 3, 'OWNER': 4 };
        const currentTier = tiers[GameState.user.plan];
        const targetTier = tiers[planKey];

        if (targetTier > currentTier + 1) {
            UIEngine.showRewardPopup("LOCKED", "Please upgrade to the previous level first.", null, "OK");
            return;
        }

        UIEngine.showRewardPopup(
            "PREMIUM PLAN", 
            `Upgrade to ${planKey} requires ${price} USDT. Go to Deposit?`, 
            () => {
                UIEngine.openWithdraw();
                if(window.WithdrawSystem) {
                    WithdrawSystem.switchTab('deposit');
                }
            }, 
            "GO TO DEPOSIT"
        );
    }
};

window.PlanSystem = PlanSystem;