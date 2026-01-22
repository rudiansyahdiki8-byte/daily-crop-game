// js/plan.js
// ==========================================
// MEMBERSHIP UI SYSTEM
// Menangani tampilan dan pembelian Plan (Free, Mortgage, Tenant, Landlord)
// ==========================================

const PlanSystem = {
    init() {
        const container = document.getElementById('SubscibePlan');
        if (container) this.render(container);
    },

    render(container) {
        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 overflow-y-auto no-scrollbar pb-32 bg-black/20";
        
        // Header Visual
        container.innerHTML += `
            <div class="mb-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div class="inline-block p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-2 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <i class="fas fa-crown text-3xl text-emerald-400 drop-shadow-md"></i>
                </div>
                <h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-lg">Membership</h2>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Upgrade for more Profits & Perks</p>
            </div>
        `;

        const plans = window.GameConfig.Plans; // Ambil data dari Config
        const currentPlanId = (GameState.user && GameState.user.plan) ? GameState.user.plan : 'FREE';

        // Loop Render Kartu untuk setiap Plan
        // Kita urutkan manual agar rapi: FREE -> MORTGAGE -> TENANT -> LANDLORD
        const order = ['FREE', 'MORTGAGE', 'TENANT', 'LANDLORD'];

        order.forEach(key => {
            const p = plans[key];
            if(!p) return;

            const isCurrent = currentPlanId === key;
            
            // Tentukan Warna & Style Berdasarkan Tier
            let theme = { bg: "bg-slate-800", text: "text-gray-400", border: "border-gray-700", shadow: "" };
            if (key === 'MORTGAGE') theme = { bg: "bg-gradient-to-br from-emerald-900 to-emerald-950", text: "text-emerald-400", border: "border-emerald-500/30", shadow: "shadow-emerald-500/10" };
            if (key === 'TENANT') theme = { bg: "bg-gradient-to-br from-purple-900 to-purple-950", text: "text-purple-400", border: "border-purple-500/30", shadow: "shadow-purple-500/10" };
            if (key === 'LANDLORD') theme = { bg: "bg-gradient-to-br from-amber-700 to-red-900", text: "text-yellow-400", border: "border-yellow-500/50", shadow: "shadow-yellow-500/20" };

            // Text Helper
            const storageText = p.storage === Infinity ? "UNLIMITED" : p.storage;
            const sellBonusText = p.sellBonus > 0 ? `+${Math.round(p.sellBonus * 100)}%` : "Standard";
            
            let adsText = "Standard Ads";
            if (p.adsLevel === 'NoHarvest') adsText = "No Ads (Harvest)";
            if (p.adsLevel === 'NoHarvestSpin') adsText = "No Ads (Harvest+Spin)";
            if (p.adsLevel === 'FreeAds') adsText = "100% Ad Free";

            // Tombol Logic
            let btnHTML = '';
            if (isCurrent) {
                // Tampilkan sisa waktu jika bukan FREE
                let durationText = "Active Forever";
                if (key !== 'FREE' && GameState.user.planExpiresAt > 0) {
                    const daysLeft = Math.ceil((GameState.user.planExpiresAt - Date.now()) / (1000 * 60 * 60 * 24));
                    durationText = `Expires in ${daysLeft} Days`;
                }

                btnHTML = `
                <div class="w-full py-3 rounded-xl bg-gray-700/50 border border-white/5 text-center">
                    <span class="text-[9px] font-black uppercase text-gray-300"><i class="fas fa-check-circle text-emerald-500"></i> Current Plan</span>
                    <div class="text-[8px] text-gray-500 font-bold uppercase mt-1">${durationText}</div>
                </div>`;
            } else {
                // Tombol Beli
                // Cek apakah ini Upgrade atau Downgrade (Opsional, di sini kita allow switch apa saja kecuali current)
                btnHTML = `
                <button onclick="PlanSystem.buyPlan('${key}')" class="w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center gap-2 group active:scale-95">
                    <span>UPGRADE</span>
                    <span class="${theme.text}">${p.price === 0 ? 'FREE' : p.price.toLocaleString() + ' PTS'}</span>
                </button>`;
            }

            // Render Card HTML
            const card = document.createElement('div');
            card.className = `relative mb-4 rounded-3xl p-[1px] overflow-hidden transition-transform duration-300 hover:scale-[1.02] ${theme.shadow} shadow-lg`;
            
            // Border Gradient effect
            card.innerHTML = `
                <div class="absolute inset-0 ${theme.bg} opacity-80"></div>
                <div class="relative z-10 glass h-full w-full rounded-[23px] p-5 border ${theme.border} flex flex-col gap-4 bg-black/40 backdrop-blur-md">
                    
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-black text-white uppercase italic tracking-wider drop-shadow-sm">${p.name}</h3>
                            <p class="text-[9px] text-white/60 font-bold uppercase tracking-widest mt-0.5">${p.duration === Infinity ? 'Lifetime Access' : p.duration + ' Days Duration'}</p>
                        </div>
                        ${key === 'LANDLORD' ? '<div class="animate-bounce"><i class="fas fa-crown text-yellow-400 text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"></i></div>' : ''}
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div class="bg-white/5 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                            <div class="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-emerald-400"><i class="fas fa-th-large text-xs"></i></div>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-black text-white">${p.displayPlots} Plots</span>
                                <span class="text-[7px] text-gray-400 uppercase">Farm Land</span>
                            </div>
                        </div>
                        
                        <div class="bg-white/5 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                            <div class="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-blue-400"><i class="fas fa-warehouse text-xs"></i></div>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-black text-white">${storageText}</span>
                                <span class="text-[7px] text-gray-400 uppercase">Storage</span>
                            </div>
                        </div>

                        <div class="bg-white/5 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                            <div class="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-amber-400"><i class="fas fa-sack-dollar text-xs"></i></div>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-black text-white">${sellBonusText}</span>
                                <span class="text-[7px] text-gray-400 uppercase">Sales Profit</span>
                            </div>
                        </div>

                        <div class="bg-white/5 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                            <div class="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-red-400"><i class="fas fa-ad text-xs"></i></div>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-black text-white leading-tight">${adsText}</span>
                                <span class="text-[7px] text-gray-400 uppercase">Privilege</span>
                            </div>
                        </div>
                    </div>

                    <div class="mt-1">
                        ${btnHTML}
                    </div>

                </div>
            `;
            container.appendChild(card);
        });
        
        // Footer Note
        container.innerHTML += `<div class="text-center mt-4 mb-8 text-[8px] text-gray-500 font-bold uppercase max-w-xs mx-auto">Higher plans automatically unlock lower plan benefits. Plan expires after 30 days unless renewed.</div>`;
    },

    buyPlan(planId) {
        const targetPlan = window.GameConfig.Plans[planId];
        const user = GameState.user;

        // 1. Validasi Saldo
        if (targetPlan.price > 0 && user.coins < targetPlan.price) {
            UIEngine.showRewardPopup("INSUFFICIENT FUNDS", `You need ${targetPlan.price.toLocaleString()} PTS to upgrade to ${targetPlan.name}.`, null, "CLOSE");
            return;
        }

        // 2. Konfirmasi Pembelian
        UIEngine.showRewardPopup("CONFIRM UPGRADE", `
            <div class="text-center">
                <p class="text-gray-300 text-[10px] mb-2">Upgrade Membership to:</p>
                <h3 class="text-xl font-black text-white uppercase mb-4">${targetPlan.name}</h3>
                <div class="bg-black/40 p-3 rounded-xl border border-white/10">
                    <span class="text-emerald-400 font-black text-lg">${targetPlan.price === 0 ? 'FREE' : targetPlan.price.toLocaleString() + ' PTS'}</span>
                    <p class="text-[8px] text-gray-500 uppercase mt-1">Valid for 30 Days</p>
                </div>
            </div>
        `, async () => {
            
            // 3. Proses Transaksi
            if (targetPlan.price > 0) {
                user.coins -= targetPlan.price;
                user.totalSpent = (user.totalSpent || 0) + targetPlan.price;
            }

            // Update User State
            user.plan = planId;
            
            // Set Waktu Expired
            if (targetPlan.duration === Infinity) {
                user.planExpiresAt = 0;
            } else {
                // Set Expired: Sekarang + 30 Hari
                user.planExpiresAt = Date.now() + (targetPlan.duration * 24 * 60 * 60 * 1000);
            }

            // Catat History Pembelian
            if (!user.buy_history) user.buy_history = [];
            user.buy_history.unshift({
                item: `Membership: ${targetPlan.name}`,
                price: targetPlan.price,
                date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
            });

            // Simpan ke Firebase
            await GameState.save();
            
            // 4. Update Game Logic Seketika
            if (window.FarmSystem) {
                FarmSystem.updateSlotStatus(); // Buka slot tanah
                FarmSystem.renderFarmGrid();   // Render ulang visual tanah
            }
            if (window.UIEngine) UIEngine.updateHeader(); // Update koin di header
            
            // Refresh halaman ini
            this.init(); 

            // Notifikasi Sukses
            UIEngine.showRewardPopup("UPGRADE SUCCESS", `Welcome, ${targetPlan.name}! Enjoy your new benefits.`, null, "LET'S FARM");

        }, "CONFIRM & PAY");
    }
};

window.PlanSystem = PlanSystem;