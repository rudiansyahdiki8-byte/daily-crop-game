const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],

    // Tambahkan ini di dalam objek UIEngine = { ... }
        showNeuralDatabase(defaultTab = 'encyclopedia') {
            const items = window.HerbData; // [cite: 85]
            
            let listHTML = `<div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">`;
            for (const key in items) {
                const data = items[key];
                listHTML += `
                    <div class="flex items-center gap-3 p-2 bg-black/40 border border-white/5 rounded-sm">
                        <img src="${data.img}" class="w-8 h-8 object-contain">
                        <div class="flex-1 text-left">
                            <p class="text-[9px] font-black text-white uppercase">${data.name}</p>
                            <p class="text-[7px] text-cyan-500 font-bold uppercase italic">${data.rarity}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[9px] font-black text-amber-500">${data.minPrice}-${data.maxPrice}</p>
                            <p class="text-[6px] text-gray-500 uppercase italic leading-none">Credits</p>
                        </div>
                    </div>`;
            }
            listHTML += `</div>`;

            // Menggunakan showRewardPopup sebagai container [cite: 102, 103]
            this.showRewardPopup(
                `<i class="fas fa-terminal mr-2"></i> Neural Encyclopedia`, 
                listHTML, 
                null, 
                "CLOSE DATABASE"
            );
        },
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
        this.updateUserDashboardInfo();
        this.updateDashboardVault();
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

    // Fungsi untuk Update Kotak Warehouse di Dashboard secara Real-time
updateDashboardVault() {
    const vaultContent = document.getElementById('dashboard-warehouse-content');
    if (!vaultContent || !window.GameState) return;

    const current = window.WarehouseSystem.getTotalItems();
    const max = window.WarehouseSystem.getMaxLimit();
    
    // Tampilan jika Gudang Kosong
    if (current === 0) {
        vaultContent.innerHTML = `
            <i class="fas fa-box-open text-gray-700 text-4xl mb-3"></i>
            <p class="text-[9px] text-gray-500 uppercase font-black leading-relaxed px-6 italic">
                Vault is empty. Fill the buffer in Matrix.
            </p>`;
        return;
    }

    // Generate Animasi Kecil Item (Max 5 jenis untuk pratinjau) [cite: 291]
    let itemPreviewHTML = '';
    let count = 0;
    for (const key in GameState.warehouse) {
        if (GameState.warehouse[key] > 0 && count < 5) {
            const item = window.HerbData[key];
            if (item) {
                itemPreviewHTML += `
                    <div class="relative group animate-pulse">
                        <img src="${item.img}" class="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">
                        <span class="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[7px] font-black px-1.5 rounded-sm border border-black/50">
                            ${GameState.warehouse[key]}
                        </span>
                    </div>`;
                count++;
            }
        }
    }

    // Tentukan warna teks kapasitas berdasarkan batas Tier FREE (50 item) [cite: 320, 482]
    const isCritical = current >= max;
    const capColor = isCritical ? 'text-[#ff0055] animate-pulse' : 'text-white';

    vaultContent.className = "p-5 bg-black/60 border border-cyan-500/20 rounded-sm w-full animate-in";
    vaultContent.innerHTML = `
        <div class="flex flex-col gap-6">
            <div class="flex justify-between items-center">
                <div class="flex gap-3">
                    ${itemPreviewHTML}
                </div>
                <div class="text-right">
                    <p class="text-[8px] text-cyan-500 font-black uppercase tracking-widest mb-1">Total Capacity</p>
                    <p class="text-base font-black ${capColor} italic leading-none">${current} / ${max >= 9999 ? 'UNLIMITED' : max}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                <button onclick="WarehouseSystem.show()" class="py-3 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 italic">
                    <i class="fas fa-expand-arrows-alt text-[8px]"></i> Manage Vault
                </button>

                <button onclick="MarketSystem.sellAll()" class="py-3 bg-[#ff0055]/20 border border-[#ff0055]/50 text-[#ff0055] text-[9px] font-black uppercase tracking-widest hover:bg-[#ff0055] hover:text-white transition-all flex items-center justify-center gap-2 italic shadow-[0_0_15px_rgba(255,0,85,0.1)]">
                    <i class="fas fa-skull-crossbones text-[8px]"></i> Liquidate All
                </button>
            </div>
        </div>
    `;
},

updateUserDashboardInfo() {
    if (!window.GameState || !GameState.user) return;

    // 1. Username & ID
    const nameWelcome = document.getElementById('display-username-welcome');
    const userIdEl = document.getElementById('stat-user-id');
    
    if (nameWelcome) nameWelcome.innerText = GameState.user.username.toUpperCase();
    if (userIdEl) userIdEl.innerText = `#${GameState.user.id || 'N/A'}`;

    // 2. Credits (Koin Utama)
    const dashCoins = document.getElementById('dash-credit-display'); // Pastikan ID ini ada
    if (dashCoins) dashCoins.innerText = Math.floor(GameState.user.coins).toLocaleString();

    // 3. Statistik (Basis Data Harvest & Sold)
    const statHarvest = document.getElementById('stat-total-harvest');
    const statSold = document.getElementById('stat-total-sold');

    if (statHarvest) statHarvest.innerText = (GameState.user.totalHarvest || 0).toLocaleString();
    if (statSold) statSold.innerText = (GameState.user.totalSold || 0).toLocaleString();
},

    showPrivacy() { alert("Bio-Metric Privacy Protocol v1.0: Active."); },
    showTermsModal() { alert("Syndicate Contract: You hack, you earn. No questions."); }

    
};



window.UIEngine = UIEngine;