const PlanSystem = {
    // Harga Upgrade tetap sama (Logic)
    prices: {
        FREE: 0,
        MORTGAGE: 5000,
        TENANT: 15000,
        OWNER: 50000 
    },

    init() {
        const container = document.getElementById('SubscibePlan');
        if (container) {
            // Pastikan kontainer terlihat sebelum merender isi
            container.classList.remove('hidden');
            this.render(container);
        }
    },

    render(container) {
        container.innerHTML = '';
        // Set styling dasar kontainer agar scrollable
        container.className = "h-full flex flex-col p-5 overflow-y-auto no-scrollbar pb-32 bg-black/40";

        // --- CYBERPUNK STYLES (REVISI ANIMASI AGAR PASTI MUNCUL) ---
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            /* Pastikan opacity awal 1 jika animasi gagal, atau gunakan forwards */
            .cyber-card { 
                animation: slideInUp 0.4s ease-out forwards; 
                opacity: 0; 
                position: relative;
                display: flex; /* Memastikan layout kartu terlihat */
                min-height: 140px;
            }
            .scan-effect {
                position: absolute; top: 0; left: 0; width: 100%; height: 2px;
                background: rgba(0, 242, 255, 0.2);
                animation: scanline 2s linear infinite;
                pointer-events: none;
            }
        `;
        container.appendChild(style);

        // --- HEADER ---
        const header = document.createElement('div');
        header.className = "flex justify-between items-center mb-8 px-1 shrink-0";
        header.innerHTML = `
            <div>
                <h2 class="text-3xl font-black text-white italic uppercase tracking-[0.1em] drop-shadow-[0_0_10px_#ff0055]">
                    Uplink Tiers
                </h2>
                <p class="text-[9px] text-cyan-500 font-bold uppercase tracking-[0.3em] mt-1 italic">
                    Upgrade Neural Bandwidth
                </p>
            </div>
            <i class="fas fa-satellite-dish text-[#ff0055] animate-pulse"></i>
        `;
        container.appendChild(header);

        // --- TIER DATA MAPPING ---
        const tierData = {
            'FREE': {
                title: "BASIC DECK",
                sub: "TIER 01",
                desc: [
                    { i: 'fa-microchip', t: '1 Active / 4 Visual Nodes', c: 'text-cyan-400' },
                    { i: 'fa-database', t: 'Buffer: 50 Packets', c: 'text-blue-400' },
                    { i: 'fa-shield-alt', t: 'Standard Firewall', c: 'text-gray-500' },
                    { i: 'fa-broadcast-tower', t: 'High Security Pings', c: 'text-red-500' }
                ],
                bg: "bg-[#1a1a2e]",
                border: "border-cyan-900"
            },
            'MORTGAGE': {
                title: "CYBER-LINK",
                sub: "TIER 02",
                desc: [
                    { i: 'fa-project-diagram', t: '4 Active / 6 Visual Nodes', c: 'text-cyan-400' },
                    { i: 'fa-database', t: 'Buffer: 240 Packets', c: 'text-blue-400' },
                    { i: 'fa-file-upload', t: '+20% Upload Bonus', c: 'text-yellow-400' },
                    { i: 'fa-user-secret', t: 'Reduced Pings (50%)', c: 'text-purple-400' }
                ],
                bg: "bg-[#0f3460]",
                border: "border-blue-800"
            },
            'TENANT': {
                title: "DATA STREAM",
                sub: "TIER 03",
                desc: [
                    { i: 'fa-network-wired', t: '6 Active / 8 Visual Nodes', c: 'text-cyan-400' },
                    { i: 'fa-database', t: 'Buffer: 500 Packets', c: 'text-blue-400' },
                    { i: 'fa-bolt', t: '+50% Upload Bonus', c: 'text-yellow-400' },
                    { i: 'fa-eye-slash', t: 'NO SECURITY PINGS', c: 'text-pink-500 font-black' }
                ],
                bg: "bg-[#533483]",
                border: "border-purple-700"
            },
            'OWNER': { 
                title: "SYSTEM ROOT",
                sub: "TIER 04 (TYCOON)",
                desc: [
                    { i: 'fa-terminal', t: '8 Active / 12 Visual Nodes', c: 'text-cyan-400' },
                    { i: 'fa-infinity', t: 'UNLIMITED BUFFER', c: 'text-blue-400' },
                    { i: 'fa-rocket', t: '+100% Upload Bonus', c: 'text-yellow-400' },
                    { i: 'fa-crown', t: 'VIP ROOT ACCESS', c: 'text-amber-500 font-black' }
                ],
                bg: "bg-gradient-to-br from-[#1b1b1b] to-[#ff0055]",
                border: "border-[#ff0055]"
            }
        };

        const grid = document.createElement('div');
        grid.className = "flex flex-col gap-6 shrink-0";

        ['FREE', 'MORTGAGE', 'TENANT', 'OWNER'].forEach((planKey, index) => {
            const data = tierData[planKey];
            const price = this.prices[planKey];
            const isCurrent = GameState.user.plan === planKey;
            
            const tiers = { 'FREE': 1, 'MORTGAGE': 2, 'TENANT': 3, 'OWNER': 4 };
            const currentTier = tiers[GameState.user.plan];
            const thisTier = tiers[planKey];
            const isOwned = thisTier < currentTier;

            let cardBaseClass = `relative flex w-full h-40 rounded-sm overflow-hidden shadow-2xl transition-all duration-300 cyber-card border-l-4`;
            let rightHTML = "";
            let scanlineHTML = `<div class="scan-effect"></div>`;

            const animDelay = `animation-delay: ${index * 150}ms`;

            if (isCurrent) {
                cardBaseClass += ` bg-cyan-950 border-cyan-400`;
                rightHTML = `<div class="h-full w-full flex flex-col items-center justify-center bg-black/40 text-cyan-400 gap-2"><i class="fas fa-satellite text-xl"></i><span class="text-[8px] font-black uppercase tracking-[0.2em]">Connected</span></div>`;
            } else if (isOwned) {
                cardBaseClass += ` bg-gray-900 border-gray-700 opacity-40 grayscale`;
                rightHTML = `<div class="h-full w-full flex flex-col items-center justify-center bg-black/60 text-gray-500"><i class="fas fa-history text-lg"></i><span class="text-[8px] font-bold uppercase mt-1">Legacy</span></div>`;
            } else {
                cardBaseClass += ` ${data.bg} ${data.border} hover:translate-x-1`;
                rightHTML = `
                    <button onclick="PlanSystem.buyUpgrade('${planKey}', ${price})" class="w-full h-full flex flex-col items-center justify-center bg-black/40 hover:bg-cyan-500/20 transition-all gap-1 text-white group">
                        <span class="text-[8px] font-bold text-cyan-500 uppercase tracking-widest">Install</span>
                        <div class="font-black text-xs px-2 py-1 rounded border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                            ${price >= 1000 ? (price/1000) + 'K' : price} CRD
                        </div>
                    </button>
                `;
            }

            const featuresHTML = data.desc.map(d => `
                <div class="flex items-center gap-3">
                    <i class="fas ${d.i} text-[10px] ${d.c}"></i>
                    <span class="text-[9px] font-bold uppercase tracking-widest text-white/80">${d.t}</span>
                </div>
            `).join('');

            const card = document.createElement('div');
            card.className = cardBaseClass;
            card.style = animDelay;
            card.innerHTML = `
                ${scanlineHTML}
                <div class="flex-1 p-4 flex flex-col justify-between relative z-10">
                    <div>
                        <div class="text-[8px] font-black text-[#ff0055] uppercase tracking-[0.4em] mb-1">${data.sub}</div>
                        <h3 class="text-xl font-black text-white italic uppercase tracking-tighter leading-none">${data.title}</h3>
                    </div>
                    <div class="space-y-1.5 mt-2">${featuresHTML}</div>
                </div>
                <div class="w-24 border-l border-white/5 relative z-20 flex-shrink-0 bg-black/20">${rightHTML}</div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    },

    buyUpgrade(planKey, price) {
        if (GameState.user.coins < price) {
            UIEngine.showRewardPopup("ACCESS DENIED", "Insufficient Credits.", null, "RETRY");
            return;
        }

        const displayNames = { 'FREE': 'BASIC DECK', 'MORTGAGE': 'CYBER-LINK', 'TENANT': 'DATA STREAM', 'OWNER': 'SYSTEM ROOT' };
        const displayName = displayNames[planKey] || planKey;

        UIEngine.showRewardPopup("INITIALIZE INSTALL?", `Sync ${displayName} protocol for ${price} Credits?`, () => {
            GameState.user.coins -= price;
            GameState.user.plan = planKey;
            GameState.save();
            if(window.FarmSystem) { FarmSystem.applyPlanLimits(); FarmSystem.render(); }
            this.init();
            UIEngine.showRewardPopup("INSTALL COMPLETE", `Uplink ${displayName} active.`, () => { UIEngine.navigate('FarmingHouse'); }, "ENTER MATRIX");
        }, "START UPLOAD");
    }
};

window.PlanSystem = PlanSystem;