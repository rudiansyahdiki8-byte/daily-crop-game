const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],

    navigate(pageId) {
        this.pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.remove('animate-in');
            void target.offsetWidth; 
            target.classList.add('animate-in');
        }

        this.updateNavbar(pageId);
        this.updateHeader();

        if (pageId === 'Shop' && window.MarketSystem) {
            MarketSystem.init();
        }
        if (pageId === 'FarmingHouse' && window.FarmSystem) {
            FarmSystem.render();
        }
        if (pageId === 'SubscibePlan' && window.PlanSystem) {
            PlanSystem.init();
        }
        if (pageId === 'Affiliate' && window.AffiliateSystem) {
            AffiliateSystem.init();
        }
    },

    updateNavbar(activePageId) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('text-cyan-500', 'scale-110');
            btn.classList.add('text-gray-600');
        });

        const navBtns = document.querySelectorAll('.nav-item');
        navBtns.forEach(btn => {
            const onClickText = btn.getAttribute('onclick');
            if (onClickText && onClickText.includes(activePageId)) {
                btn.classList.remove('text-gray-600');
                btn.classList.add('text-cyan-500', 'scale-110');
            }
        });
    },

    updateHeader() {
        if (!window.GameState) return;
        const coinEl = document.getElementById('header-coins');
        const nameEl = document.getElementById('display-username');
        const welcomeNameEl = document.getElementById('display-username-welcome');
        
        if (coinEl) coinEl.innerText = `${GameState.user.coins.toLocaleString()} CRD`;
        if (nameEl) nameEl.innerText = GameState.user.username.toUpperCase();
        if (welcomeNameEl) welcomeNameEl.innerText = GameState.user.username.toUpperCase();
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

    // Popup Cyberpunk Notification
    showRewardPopup(title, message, onConfirm = null, buttonText = "ACKNOWLEDGE") {
        const old = document.getElementById('system-popup');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = "system-popup";
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-md z-[2000] flex items-center justify-center p-6 animate-in";
        
        overlay.innerHTML = `
            <div class="glass w-full max-w-xs p-6 border border-[#ff0055]/30 text-center shadow-[0_0_30px_rgba(255,0,85,0.2)] relative overflow-hidden">
                <div class="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                    <i class="fas fa-broadcast-tower text-cyan-400 text-3xl animate-pulse"></i>
                </div>
                <h3 class="text-xl font-black text-white mb-2 uppercase italic tracking-widest">${title}</h3>
                <p class="text-[9px] text-cyan-500/70 mb-6 leading-relaxed font-bold uppercase tracking-tight italic">${message}</p>
                <button id="popup-confirm-btn" class="w-full py-4 bg-[#ff0055] text-white font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-lg">
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

    showPrivacy() { alert("Bio-Metric Privacy Protocol v1.0: Active."); },
    showTermsModal() { alert("Syndicate Contract: You hack, you earn. No questions."); }
};
window.UIEngine = UIEngine;