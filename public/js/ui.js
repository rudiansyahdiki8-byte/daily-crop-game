// js/ui.js
const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],

    navigate(pageId) {
        if (!window.GameState || !GameState.isLoaded) return;
        
        // 1. Sembunyikan Semua Halaman
        this.pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // 2. Tampilkan Halaman Target
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            // Efek animasi restart
            target.classList.remove('animate-in'); 
            void target.offsetWidth; 
            target.classList.add('animate-in');
        }

        // 3. Update Navigasi & Header
        this.updateNavbar(pageId);
        this.updateHeader();

        // 4. Inisialisasi Sistem Khusus per Halaman
        if (pageId === 'Shop' && window.MarketSystem) MarketSystem.init();
        if (pageId === 'FarmingHouse' && window.FarmSystem) FarmSystem.init();
        if (pageId === 'SubscibePlan' && window.PlanSystem) PlanSystem.init();
        if (pageId === 'Affiliate' && window.AffiliateSystem) AffiliateSystem.init();
        if (pageId === 'Dashboard') this.updateDashboard();
    },

    updateNavbar(activePageId) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('text-emerald-500', 'scale-110');
            btn.classList.add('text-gray-500');
        });
        const navBtns = document.querySelectorAll('.nav-item');
        navBtns.forEach(btn => {
            const onClickText = btn.getAttribute('onclick');
            if (onClickText && onClickText.includes(activePageId)) {
                btn.classList.remove('text-gray-500');
                btn.classList.add('text-emerald-500', 'scale-110');
            }
        });
    },

    updateHeader() {
        if (!window.GameState || !GameState.user) return;
        const user = GameState.user;
        
        const coinEl = document.getElementById('header-coins');
        const nameEl = document.getElementById('display-username');
        const planEl = document.getElementById('display-plan');
        const planName = window.PlanConfig && window.PlanConfig[user.plan] ? window.PlanConfig[user.plan].name : "Free Farmer";

        // Tambahkan fungsi klik pada Koin untuk buka Wallet
        if (coinEl) {
            coinEl.innerText = `${Math.floor(user.coins).toLocaleString()} PTS`;
            coinEl.onclick = () => this.openWithdraw(); // Klik koin -> Buka Wallet
            coinEl.style.cursor = "pointer";
        }
        if (nameEl) nameEl.innerText = user.username;
        if (planEl) planEl.innerText = planName;
    },

    updateDashboard() {
        if (!GameState.user) return;
        const user = GameState.user;

        const dName = document.getElementById('dash-username');
        const dId = document.getElementById('dash-id');
        const dPlan = document.getElementById('dash-plan');
        const dHarvest = document.getElementById('dash-harvest');
        const dSold = document.getElementById('dash-sold');

        if (dName) dName.innerText = user.username;
        if (dId) dId.innerText = `ID: ${user.userId ? user.userId.replace('TG-', '') : '...'}`;
        if (dPlan) dPlan.innerText = window.PlanConfig[user.plan]?.name || user.plan;
        if (dHarvest) dHarvest.innerText = (user.totalHarvest || 0).toLocaleString();
        if (dSold) dSold.innerText = (user.totalSold || 0).toLocaleString();

        this.renderMiniWarehouse();
        this.renderSalesHistory();
    },

    // --- PENGHUBUNG TOMBOL (CRITICAL FIX) ---
    
    // 1. Gudang (Warehouse)
    showWarehouse() {
        if(window.WarehouseSystem && WarehouseSystem.show) {
            WarehouseSystem.show();
        } else {
            console.error("WarehouseSystem belum siap!");
            // Fallback jika system belum load
            this.showRewardPopup("LOADING", "System is loading...", null, "WAIT");
        }
    },

    // 2. Dompet (Wallet/Withdraw)
    openWithdraw() {
        // PERBAIKAN: Langsung panggil WithdrawSystem, jangan cari ID manual
        if (window.WithdrawSystem && WithdrawSystem.show) {
            WithdrawSystem.show();
        } else {
            console.error("WithdrawSystem belum siap!");
        }
    },
    
    // Fungsi lama untuk menutup (opsional, karena system handle sendiri)
    closeWithdraw() {
        if (window.WithdrawSystem && WithdrawSystem.close) {
            WithdrawSystem.close();
        }
    },

    // --- MODAL & POPUP UTILITY ---

    showRewardPopup(title, message, onConfirm = null, buttonText = "CLAIM") {
        const old = document.getElementById('system-popup');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = "system-popup";
        overlay.className = "fixed inset-0 bg-black/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-6 animate-in";
        overlay.innerHTML = `
            <div class="glass w-full max-w-xs rounded-[2rem] p-6 border border-white/10 text-center shadow-2xl relative overflow-hidden">
                <div class="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <i class="fas fa-gift text-emerald-400 text-3xl animate-bounce"></i>
                </div>
                <h3 class="text-xl font-black text-white mb-2 uppercase italic tracking-wider">${title}</h3>
                <p class="text-[10px] text-gray-400 mb-6 leading-relaxed font-bold uppercase px-2">${message}</p>
                <button id="popup-confirm-btn" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg">
                    ${buttonText}
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('popup-confirm-btn').onclick = () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        };
    },

    // --- MINI WIDGETS (DASHBOARD) ---
    renderMiniWarehouse() {
        const container = document.getElementById('mini-warehouse-grid');
        if (!container || !GameState.warehouse) return;
        container.innerHTML = '';
        let hasItem = false;
        Object.keys(GameState.warehouse).forEach(key => {
            const count = GameState.warehouse[key];
            if (count > 0) {
                hasItem = true;
                const img = (window.HerbData && window.HerbData[key]) ? window.HerbData[key].img : '';
                container.innerHTML += `
                    <div class="shrink-0 w-12 h-12 bg-black/30 rounded-xl border border-white/5 flex flex-col items-center justify-center relative">
                        <img src="${img}" class="w-6 h-6 object-contain mb-1">
                        <span class="text-[8px] font-bold text-white absolute bottom-0.5 right-1">${count}</span>
                    </div>
                `;
            }
        });
        if (!hasItem) {
            container.innerHTML = `<span class="text-[9px] text-gray-600 w-full text-center py-2">Empty Storage</span>`;
        }
    },

    renderSalesHistory() {
        const container = document.getElementById('sales-history-list');
        if (!container) return;
        container.innerHTML = '';
        
        // Ambil data dari User History (jika ada)
        const transactions = GameState.user.history || [];
        
        if (transactions.length === 0) {
            container.innerHTML = `<div class="text-center py-4"><p class="text-[9px] text-gray-600 font-bold uppercase">No activity yet</p></div>`;
            return;
        }

        transactions.slice(0, 5).forEach(tx => {
            const isPlus = tx.type !== 'withdraw'; 
            const color = isPlus ? 'text-emerald-400' : 'text-red-400';
            
            container.innerHTML += `
                <div class="bg-white/5 p-2 rounded-xl flex justify-between items-center border border-white/5 mb-1.5">
                    <div class="flex items-center gap-2">
                        <i class="fas ${tx.method === 'FaucetPay Auto' ? 'fa-wallet' : 'fa-sack-dollar'} ${color} text-xs w-4 text-center"></i>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase truncate max-w-[120px]">${tx.method || 'Sale'}</p>
                            <p class="text-[7px] text-gray-400">${tx.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black ${color}">${isPlus ? '+' : '-'}${tx.amount}</p>
                    </div>
                </div>
            `;
        });
    }
};

window.UIEngine = UIEngine;
