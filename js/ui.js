// js/ui.js
const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],

    navigate(pageId) {
        // Jangan navigasi jika data belum siap dari Firebase
        if (!window.GameState || !GameState.isLoaded) return;

        // 1. Sembunyikan semua halaman
        this.pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // 2. Munculkan halaman yang dipilih
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.remove('animate-in'); 
            void target.offsetWidth; 
            target.classList.add('animate-in');
        }

        // 3. Update Navigasi & Header
        this.updateNavbar(pageId);
        this.updateHeader();

        // 4. TRIGGER SISTEM (The Chain)
        if (pageId === 'Shop' && window.MarketSystem) MarketSystem.init();
        if (pageId === 'FarmingHouse' && window.FarmSystem) FarmSystem.init();
        if (pageId === 'SubscibePlan' && window.PlanSystem) PlanSystem.init();
        if (pageId === 'Affiliate' && window.AffiliateSystem) AffiliateSystem.init();
        
        // Update Dashboard khusus
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
        const coinEl = document.getElementById('header-coins');
        const nameEl = document.getElementById('display-username');
        const planEl = document.getElementById('display-plan');
        
        // Ambil data dari Firebase
        const user = GameState.user;
        const planName = window.PlanConfig[user.plan]?.name || "Free Farmer";

        if (coinEl) coinEl.innerText = `${user.coins.toLocaleString()} PTS`;
        if (nameEl) nameEl.innerText = user.username;
        if (planEl) planEl.innerText = planName;
    },

updateDashboard() {
        if (!GameState.user) return;
        const user = GameState.user;

        // 1. UPDATE CARD 1 (User Info Split)
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

        // 2. UPDATE CARD 2 (Mini Warehouse)
        this.renderMiniWarehouse();

        // 3. UPDATE CARD 3 (Sales History)
        this.renderSalesHistory();
    },

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
                
                // Buat Kotak Kecil
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
        // Kita butuh data history. Nanti kita edit market.js untuk simpan history.
        // Untuk sementara kita ambil dari GameState.user.sales_history
        const history = GameState.user.sales_history || [];

        if (!container) return;
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = `<div class="text-center py-4"><p class="text-[9px] text-gray-600 font-bold uppercase">No sales record</p></div>`;
            return;
        }

        // Tampilkan 5 history terakhir
        history.slice(0, 5).forEach(tx => {
            container.innerHTML += `
                <div class="bg-white/5 p-2 rounded-xl flex justify-between items-center border border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-sack-dollar text-yellow-500 text-xs"></i>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase">SOLD ${tx.item}</p>
                            <p class="text-[7px] text-gray-400">${tx.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black text-emerald-400">+${tx.price}</p>
                    </div>
                </div>
            `;
        });
    },

    // Tambahkan helper ini untuk membuka warehouse dari klik card
    showWarehouse() {
        if(window.WarehouseSystem) WarehouseSystem.show();
    },
    openWithdraw() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (window.WithdrawSystem) WithdrawSystem.init();
        }
    },

    closeWithdraw() {
        document.getElementById('withdraw-modal')?.classList.add('hidden');
    },

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

    showPrivacy() { alert("Daily Crop Privacy: Your data is stored securely on Google Firebase."); },
    showTermsModal() { alert("Daily Crop Terms: One account per user. Fair play only!"); }
};
window.UIEngine = UIEngine;
