// js/ui.js
const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],


    init() {
        console.log("[UI] Initializing Navigation...");
        
        // Setup Event Listener otomatis untuk tombol navigasi
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.onclick = () => {
                const target = btn.getAttribute('data-target');
                if (target) this.navigate(target);
            };
        });
    },

    navigate(pageId) {
        if (!window.GameState || !GameState.isLoaded) return;
        
        // Hide All
        this.pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // Show Target
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.remove('animate-in'); 
            void target.offsetWidth; 
            target.classList.add('animate-in');
        }

        this.updateNavbar(pageId);
        this.updateHeader();

        // Trigger Sub-Systems
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

        if (coinEl) coinEl.innerText = `${Math.floor(user.coins).toLocaleString()} PTS`;
        if (nameEl) nameEl.innerText = user.username;
        if (planEl) planEl.innerText = planName;
    },

    // --- UPDATE DASHBOARD (POIN 6) ---
    updateDashboard() {
        if (!GameState.user) return;
        const user = GameState.user;

        // 1. Update Text Data Standar
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

        // 2. INJECT ENCYCLOPEDIA BUTTON (Jika belum ada)
        // Kita cari elemen parent Card User Info, lalu selipkan tombol di bawahnya
        const dashboard = document.getElementById('Dashboard');
        let encyBtn = document.getElementById('encyclopedia-trigger');
        
        if (!encyBtn && dashboard) {
            // Cari elemen card user info (asumsi elemen pertama di dashboard)
            const userInfoCard = dashboard.querySelector('.glass'); 
            if (userInfoCard) {
                const btnContainer = document.createElement('div');
                btnContainer.className = "w-full mt-2 mb-4";
                btnContainer.innerHTML = `
                    <button id="encyclopedia-trigger" onclick="UIEngine.showEncyclopedia()" class="w-full glass p-3 rounded-2xl border border-white/10 flex items-center justify-between active:scale-95 transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                <i class="fas fa-book-open text-indigo-400 group-hover:scale-110 transition-transform"></i>
                            </div>
                            <div class="text-left">
                                <h4 class="text-[9px] font-black text-white uppercase tracking-wide">Herb Encyclopedia</h4>
                                <p class="text-[7px] text-gray-400">View Rarity & Prices</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right text-gray-500 text-xs"></i>
                    </button>
                `;
                userInfoCard.after(btnContainer);
            }
        }

        this.renderMiniWarehouse();
        this.renderSalesHistory();
    },

    // --- ENCYCLOPEDIA LOGIC (POIN 6) ---
    showEncyclopedia() {
        const overlay = document.createElement('div');
        overlay.id = "ency-modal";
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex flex-col p-4 animate-in";
        
        // Header
        let html = `
            <div class="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h2 class="text-2xl font-black text-white italic uppercase tracking-wider">Encyclopedia</h2>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Market Index & Rarity</p>
                </div>
                <button onclick="document.getElementById('ency-modal').remove()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            <div class="pt-20 pb-28 px-4 overflow-y-auto no-scrollbar relative">
        `;

        // Render List Tanaman
        if (window.HerbData) {
            Object.keys(window.HerbData).forEach(key => {
                const herb = window.HerbData[key];
                const currentPrice = GameState.getPrice(key);
                // Hitung simulasi perubahan harga (Crypto Style)
                // Kita bandingkan harga sekarang dengan rata-rata (min+max)/2
                const avg = (herb.minPrice + herb.maxPrice) / 2;
                const change = ((currentPrice - avg) / avg) * 100;
                const isUp = change >= 0;
                
                const rarityClass = `rarity-${herb.rarity.toLowerCase()}`; // CSS class
                const badgeClass = `bg-rarity-${herb.rarity.toLowerCase()}`;
                
                html += `
                    <div class="glass p-3 rounded-2xl border flex items-center gap-4 relative overflow-hidden ${rarityClass}">
                        <div class="absolute -right-4 -top-4 opacity-10 text-6xl rotate-12"><i class="fas fa-leaf"></i></div>
                        
                        <div class="w-14 h-14 bg-black/30 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                            <img src="${herb.img}" class="w-10 h-10 object-contain drop-shadow-md">
                        </div>
                        
                        <div class="flex-1 z-10">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="text-[10px] font-black text-white uppercase tracking-wide">${herb.name}</h3>
                                <span class="text-[6px] font-bold px-1.5 py-0.5 rounded uppercase ${badgeClass}">${herb.rarity}</span>
                            </div>
                            
                            <div class="flex justify-between items-end">
                                <div>
                                    <p class="text-[7px] text-gray-400">Growth: ${(herb.time/60)} Mins</p>
                                    <p class="text-[7px] text-gray-400">Range: ${herb.minPrice}-${herb.maxPrice}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-black text-white">${currentPrice} PTS</p>
                                    <p class="text-[7px] font-bold ${isUp ? 'trend-up' : 'trend-down'}">
                                        <i class="fas fa-caret-${isUp ? 'up' : 'down'}"></i> ${Math.abs(change).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
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
        let transactions = [];
        if (window.HistorySystem) {
            transactions = HistorySystem.getAllTransactions();
        } else {
            transactions = GameState.user.sales_history || [];
        }
        if (transactions.length === 0) {
            container.innerHTML = `<div class="text-center py-4"><p class="text-[9px] text-gray-600 font-bold uppercase">No activity yet</p></div>`;
            return;
        }
        transactions.slice(0, 5).forEach(tx => {
            const icon = tx.icon || 'fa-sack-dollar';
            const color = tx.color || 'text-yellow-500';
            const title = tx.title || `SOLD ${tx.item || 'Item'}`;
            const amount = tx.amount || `+${tx.price || 0}`;
            const date = tx.date || 'Just now';

            container.innerHTML += `
                <div class="bg-white/5 p-2 rounded-xl flex justify-between items-center border border-white/5 mb-1.5">
                    <div class="flex items-center gap-2">
                        <i class="fas ${icon} ${color} text-xs w-4 text-center"></i>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase truncate max-w-[120px]">${title}</p>
                            <p class="text-[7px] text-gray-400">${date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black ${amount.includes('-') ? 'text-red-400' : 'text-emerald-400'}">${amount}</p>
                    </div>
                </div>
            `;
        });
    },

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

    // --- HELPER UNTUK TEXT MODAL ---
    showTextModal(title, contentHTML) {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex flex-col p-6 animate-in";
        overlay.innerHTML = `
            <div class="flex justify-between items-center mb-6 shrink-0">
                <h2 class="text-xl font-black text-white italic uppercase tracking-wider border-l-4 border-emerald-500 pl-3">${title}</h2>
                <button onclick="this.closest('.fixed').remove()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-times text-xs"></i></button>
            </div>
            <div class="flex-1 overflow-y-auto no-scrollbar text-content bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                ${contentHTML}
            </div>
            <div class="mt-4 text-center">
                <p class="text-[7px] text-gray-500 font-mono">Daily Crop v1.0.0 (Beta)</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // 10. PRIVACY POLICY
    showPrivacy() {
        this.showTextModal("Privacy Policy", `
            <p><strong>Effective Date:</strong> January 2026</p>
            <h3>1. Data Collection</h3>
            <p>We collect minimal data necessary for gameplay: Telegram User ID (for account identification), Username, and Game Progress (Coins, Inventory, Level). We do NOT collect real names, addresses, or phone numbers.</p>
            <h3>2. Data Storage</h3>
            <p>Your game progress is stored securely on Google Firebase Cloud servers. We use industry-standard encryption.</p>
            <h3>3. Third Party Services</h3>
            <p>We may use third-party services for Analytics and Advertisement (e.g., Adsgram). These parties may collect anonymous usage data.</p>
            <h3>4. User Rights</h3>
            <p>You have the right to request deletion of your game data by contacting our support bot.</p>
        `);
    },

    // 11. TERMS OF USE
    showTermsModal() { // Ganti fungsi showTermsModal yang lama
        this.showTextModal("Terms of Use", `
            <h3>1. Fair Play</h3>
            <p>Cheating, exploiting bugs, or using automation tools (bots/scripts) is strictly prohibited. Accounts found violating this will be banned permanently without notice.</p>
            <h3>2. Multiple Accounts</h3>
            <p>Creating multiple accounts to farm referrals or abuse the system is forbidden. One user, one account.</p>
            <h3>3. Virtual Currency</h3>
            <p>"PTS" (Points) are virtual game currency with no inherent real-world value unless explicitly stated in the Withdrawal menu. We reserve the right to adjust game economy balancing at any time.</p>
            <h3>4. Liability</h3>
            <p>The developer is not responsible for any loss of data due to Telegram outages or internet connection issues.</p>
        `);
    },

    // 12. GAME TUTORIAL
    showTutorial() {
        this.showTextModal("How to Play", `
            <h3>Step 1: Farming <i class="fas fa-seedling text-emerald-400"></i></h3>
            <p>Tap empty pots to plant seeds. Wait for the timer to finish. Use <strong>Water</strong> or <strong>Fertilizer</strong> in the Task Menu to verify activity.</p>
            
            <h3>Step 2: Harvesting <i class="fas fa-sickle text-yellow-400"></i></h3>
            <p>When ready, a bubble will appear. Click it! Watch a short ad to Harvest & Auto-Replant instantly. Items go to your <strong>Storage</strong>.</p>
            
            <h3>Step 3: Selling <i class="fas fa-coins text-amber-400"></i></h3>
            <p>Go to <strong>Shop > Sell Crops</strong>. Check the prices! Prices change dynamically. Sell high to make profit.</p>
            
            <h3>Step 4: Withdraw <i class="fas fa-wallet text-blue-400"></i></h3>
            <p>Accumulate PTS. Once you reach the limit, go to your Wallet to withdraw to FaucetPay or Crypto Wallet.</p>
        `);
    }
};
window.UIEngine = UIEngine;