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
        // Update statistik di Dashboard dari Cloud
        const user = GameState.user;
        const dashboardName = document.querySelector('#Dashboard h1');
        const dashboardId = document.querySelector('#Dashboard .bg-blue-500\\/10 span');
        const dashboardHarvest = document.querySelectorAll('#Dashboard .glass .text-2xl')[0];
        const dashboardSold = document.querySelectorAll('#Dashboard .glass .text-2xl')[1];

        if (dashboardName) dashboardName.innerText = user.username;
        if (dashboardId) dashboardId.innerText = `ID: ${user.userId.split('-')[1] || user.userId}`;
        if (dashboardHarvest) dashboardHarvest.innerText = (user.totalHarvest || 0).toLocaleString();
        if (dashboardSold) dashboardSold.innerText = (user.totalSold || 0).toLocaleString();
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