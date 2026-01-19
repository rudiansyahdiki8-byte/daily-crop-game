// js/market.js
// ==========================================
// MARKET SYSTEM (CONNECTED TO VERCEL API)
// Frontend UI untuk Trading & Acquisitions
// ==========================================

const MarketSystem = {
    currentTab: 'sell', 
    
    // METADATA VISUAL 
    // (Harga tetap diambil dari GameConfig agar sinkron, disini cuma Icon/Nama)
    shopItemsMeta: {
        // ASSETS
        'land_2': { name: "Land Plot #2", icon: "fa-map-location-dot", color: "text-emerald-400", desc: "Expand production. Permanent Asset.", category: "Asset", type: 'land', tier: 1 },
        'land_3': { name: "Land Plot #3", icon: "fa-certificate", color: "text-yellow-400", desc: "Premium slot. Status Symbol.", category: "Asset", type: 'land', tier: 2 },
        'storage_plus': { name: "Warehouse +20", icon: "fa-warehouse", color: "text-blue-400", desc: "Increase cap. Stackable.", category: "Asset", type: 'storage' },
        
        // CONSUMABLES
        'speed_soil': { name: "Speed Soil", icon: "fa-bolt", color: "text-yellow-300", desc: "-10% Growth Time (24h)", category: "Consumable", type: 'buff', buffKey: 'speed_soil' },
        'growth_fert': { name: "Growth Catalyst", icon: "fa-flask", color: "text-green-400", desc: "-20% Growth Time (24h)", category: "Consumable", type: 'buff', buffKey: 'growth_speed' },
        'trade_permit': { name: "Trade Permit", icon: "fa-file-contract", color: "text-purple-400", desc: "+20% Sell Value (24h)", category: "Consumable", type: 'buff', buffKey: 'sell_bonus' },
        'yield_boost': { name: "Yield Protocol", icon: "fa-wheat", color: "text-amber-500", desc: "+25% Yield Chance (24h)", category: "Consumable", type: 'buff', buffKey: 'yield_bonus' },
        'rare_boost': { name: "Fortune Essence", icon: "fa-gem", color: "text-pink-400", desc: "+Chance Rare Drop (24h)", category: "Consumable", type: 'buff', buffKey: 'rare_luck' }
    },

    init() {
        const shopContainer = document.getElementById('Shop');
        if (shopContainer) this.renderLayout(shopContainer);
        
        // Refresh harga saat membuka toko agar sinkron dengan jam server
        if(window.GameState && GameState.refreshMarketPrices) {
            GameState.refreshMarketPrices();
        }
        
        this.checkExpiredBuffs();
        this.switchTab(this.currentTab);
    },

    // --- RENDER UTAMA (LAYOUT) ---
    renderLayout(container) {
        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-28"; 
        
        // Header
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Exchange</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global Trading Post</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-800 rounded-xl shadow-lg flex items-center justify-center border border-white/10 transform -rotate-3 hover:rotate-0 transition-transform">
                    <i class="fas fa-chart-line text-white text-xl drop-shadow-md"></i>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Tab Switcher
        const tabContainer = document.createElement('div');
        tabContainer.className = "flex gap-2 bg-black/30 p-1 rounded-2xl border border-white/5 mb-6 shrink-0 backdrop-blur-md";
        tabContainer.innerHTML = `
            <button id="tab-sell" onclick="MarketSystem.switchTab('sell')" class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 group">
                <i class="fas fa-sack-dollar text-sm group-hover:scale-110 transition-transform"></i> Trade Crops
            </button>
            <button id="tab-buy" onclick="MarketSystem.switchTab('buy')" class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 group">
                <i class="fas fa-briefcase text-sm group-hover:scale-110 transition-transform"></i> Acquisitions
            </button>
        `;
        container.appendChild(tabContainer);

        // Content Area
        const contentArea = document.createElement('div');
        contentArea.className = "flex-1 relative overflow-hidden min-h-0";
        contentArea.innerHTML = `
            <div id="area-sell" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 overflow-y-auto no-scrollbar pb-10">
                <div class="glass p-5 rounded-[2rem] border border-white/10 relative overflow-hidden shrink-0 group">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>
                    <div class="relative z-10 flex justify-between items-end">
                        <div>
                            <p class="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-widest">Estimated Portfolio</p>
                            <h3 id="preview-coins" class="text-3xl font-black text-white tracking-tight">0 <span class="text-xs text-emerald-500">PTS</span></h3>
                            <p class="text-[8px] text-emerald-400 mt-1 flex items-center gap-1"><i class="fas fa-globe"></i> Market is live</p>
                        </div>
                        <button id="price-booster-btn" onclick="MarketSystem.applyPriceBooster()" class="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-transform hover:bg-purple-500/30">
                            <i class="fas fa-chart-bar"></i> Maximize +20%
                        </button>
                    </div>
                </div>

                <div id="sell-inventory" class="grid grid-cols-2 gap-2 content-start"></div>
                
                <div class="fixed bottom-5 left-2 right-4 flex gap-3 z-100 w-full py-4">
                    <button id="btn-sell-all" onclick="MarketSystem.sellAll()" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/30 active:scale-95 transition-all mt-auto shrink-0 flex items-center justify-center gap-2 border border-emerald-400/20">
                        <i class="fas fa-check-double"></i> Liquidate All Assets
                    </button>
                </div>
            </div>

            <div id="area-buy" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 hidden overflow-y-auto no-scrollbar pb-10">
                <div id="shop-assets" class="flex flex-col gap-2"></div>
                <div class="w-full h-px bg-white/5 my-2"></div>
                <h3 class="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2">Operational Supplies</h3>
                <div id="shop-consumables" class="grid grid-cols-2 gap-2"></div>
            </div>`;
        container.appendChild(contentArea);
    },

    switchTab(tab) {
        this.currentTab = tab;
        const areaBuy = document.getElementById('area-buy');
        const areaSell = document.getElementById('area-sell');
        const btnSell = document.getElementById('tab-sell');
        const btnBuy = document.getElementById('tab-buy');
        if (!areaBuy || !areaSell) return;

        const activeClass = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500 text-black shadow-lg";
        const inactiveClass = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 text-gray-400 hover:text-white";

        if (tab === 'buy') {
            areaBuy.classList.remove('hidden');
            areaSell.classList.add('hidden');
            btnBuy.className = activeClass;
            btnSell.className = inactiveClass;
            this.renderShopItems();
        } else {
            areaSell.classList.remove('hidden');
            areaBuy.classList.add('hidden');
            btnSell.className = activeClass;
            btnBuy.className = inactiveClass;
            this.renderSellInventory();
            this.calculatePreview();
            this.checkBoosterStatus();
        }
    },

    // --- LOGIC JUAL (CONNECT KE API) ---
    async processSell(key, qty, displayedPrice) {
        UIEngine.showRewardPopup("EXECUTING", "Connecting to Exchange...", null, "WAIT");

        try {
            // Panggil API
            const response = await fetch('/api/market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    action: 'sell',
                    itemKey: key,
                    amount: qty
                })
            });
            const result = await response.json();

            if (result.success) {
                // Update State Lokal dari Response Server
                GameState.user.coins = result.newCoins;
                GameState.warehouse[key] = result.newStock;
                if(!GameState.user.totalSold) GameState.user.totalSold = 0;
                GameState.user.totalSold += result.earned;

                // Catat History Lokal (Visual)
                if (!GameState.user.sales_history) GameState.user.sales_history = [];
                GameState.user.sales_history.unshift({
                    item: (window.HerbData && HerbData[key]) ? HerbData[key].name : key,
                    qty: qty,
                    price: result.earned,
                    date: new Date().toLocaleTimeString()
                });
                if (GameState.user.sales_history.length > 5) GameState.user.sales_history.pop();

                await this.triggerAffiliateCommission(result.earned);

                // Refresh UI
                UIEngine.updateHeader();
                this.renderSellInventory();
                this.calculatePreview();
                
                UIEngine.showRewardPopup("TRANSACTION COMPLETE", `Liquidated ${qty} units for ${result.earned.toLocaleString()} PTS.`, null, "CONFIRM");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error || "Transaction declined", null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        }
    },

    async sellAll() {
        const warehouse = GameState.warehouse;
        const itemsToSell = Object.keys(warehouse).filter(k => warehouse[k] > 0);
        
        if (itemsToSell.length === 0) return;

        UIEngine.showRewardPopup("LIQUIDATION", "Liquidating all assets...", null, "WAIT");

        let totalEarned = 0;
        let successCount = 0;

        // Proses satu per satu untuk keamanan
        for (const key of itemsToSell) {
            const qty = warehouse[key];
            try {
                const response = await fetch('/api/market', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        action: 'sell',
                        itemKey: key,
                        amount: qty
                    })
                });
                const result = await response.json();
                if (result.success) {
                    GameState.user.coins = result.newCoins;
                    GameState.warehouse[key] = result.newStock;
                    totalEarned += result.earned;
                    successCount++;
                }
            } catch (e) {
                console.error("Sell error for " + key, e);
            }
        }

        if (successCount > 0) {
            UIEngine.updateHeader();
            this.renderSellInventory();
            this.calculatePreview();
            UIEngine.showRewardPopup("LIQUIDATION REPORT", `Sold ${successCount} types of assets. Total Revenue: ${totalEarned.toLocaleString()} PTS.`, null, "EXCELLENT");
        } else {
            UIEngine.showRewardPopup("FAILED", "Could not complete transactions.", null, "CLOSE");
        }
    },

    // --- RENDER INVENTORY JUAL ---
    renderSellInventory() {
        const container = document.getElementById('sell-inventory');
        if (!container) return;
        container.innerHTML = '';
        let isEmpty = true;
        
        Object.keys(GameState.warehouse).forEach(key => {
            const count = GameState.warehouse[key];
            if (count > 0) {
                isEmpty = false;
                const plantInfo = (window.HerbData && HerbData[key]) ? HerbData[key] : { img: '', name: key };
                const currentPrice = GameState.getPrice(key); // Ambil harga dinamis
                
                container.innerHTML += `
                    <div onclick="MarketSystem.openSellModal('${key}', ${count}, ${currentPrice})" class="market-row cursor-pointer group glass p-3 rounded-2xl border border-white/5 flex items-center justify-between mb-2 hover:bg-white/5 transition-all">
                        <div class="flex items-center gap-3">
                            <img src="${plantInfo.img}" class="w-8 h-8 object-contain drop-shadow-sm group-hover:scale-110 transition-transform">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-white uppercase leading-tight">${plantInfo.name}</span>
                                <span class="text-[7px] text-gray-500">Vol: ${count}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                             <div class="text-right">
                                <span class="text-[9px] font-black text-emerald-400 block">${currentPrice} PTS</span>
                                <span class="text-[6px] text-gray-500 uppercase">/ Unit</span>
                             </div>
                             <i class="fas fa-chevron-right text-[8px] text-gray-600"></i>
                        </div>
                    </div>`;
            }
        });
        
        if (isEmpty) {
            container.innerHTML = `
                <div class="col-span-2 flex flex-col items-center justify-center py-8 opacity-50 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <i class="fas fa-chart-pie text-2xl text-gray-600 mb-2"></i>
                    <p class="text-[8px] uppercase font-bold text-gray-500">No Assets Available</p>
                </div>`;
        }
    },

    openSellModal(key, maxQty, price) {
        const plantName = (window.HerbData && HerbData[key]) ? HerbData[key].name : key;
        UIEngine.showRewardPopup("TRADE ASSET", `
            <div class="text-center mb-4"><h3 class="text-lg font-black text-emerald-400 uppercase">${plantName}</h3><p class="text-[9px] text-gray-400">Current Rate: ${price} PTS</p></div>
            <div class="bg-black/40 p-3 rounded-xl mb-4 border border-white/10">
                <input type="range" id="sell-slider" min="1" max="${maxQty}" value="${maxQty}" class="w-full accent-emerald-500 mb-2 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" oninput="document.getElementById('sell-qty-display').innerText = this.value; document.getElementById('sell-total-display').innerText = (this.value * ${price}).toLocaleString();">
                <div class="flex justify-between text-[9px] font-bold text-white mt-2"><span>Volume: <span id="sell-qty-display" class="text-emerald-400">${maxQty}</span></span><span>Total: <span id="sell-total-display" class="text-yellow-400">${(maxQty * price).toLocaleString()}</span> PTS</span></div>
            </div>`, () => {
            const qtyToSell = parseInt(document.getElementById('sell-slider').value);
            this.processSell(key, qtyToSell, price);
        }, "EXECUTE TRADE");
    },

    // --- LOGIC BELI (CONNECT KE API) ---
    async buyItem(id, displayPrice) {
        if (GameState.user.coins < displayPrice) { 
            UIEngine.showRewardPopup("INSUFFICIENT FUNDS", "Please add more funds to your wallet.", null, "CLOSE");
            return;
        }

        const meta = this.shopItemsMeta[id];
        UIEngine.showRewardPopup("CONFIRM ACQUISITION", `Authorize purchase of ${meta.name} for ${displayPrice.toLocaleString()} PTS?`, async () => {
            
            // Panggil API
            UIEngine.showRewardPopup("PROCESSING", "Acquiring asset...", null, "WAIT");

            try {
                const response = await fetch('/api/market', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: GameState.user.userId, 
                        action: 'buy', 
                        itemKey: id 
                    })
                });
                const result = await response.json();

                if (result.success) {
                    // Update State
                    GameState.user.coins = result.newCoins;
                    if(result.farmPlots) GameState.farmPlots = result.farmPlots;
                    if(result.extraStorage) GameState.user.extraStorage = result.extraStorage;

                    // Update UI
                    UIEngine.updateHeader();
                    this.renderShopItems();
                    UIEngine.showRewardPopup("SUCCESS", result.message, null, "DISMISS");
                } else {
                    UIEngine.showRewardPopup("FAILED", result.error, null, "CLOSE");
                }
            } catch(e) {
                UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
            }
        }, "AUTHORIZE");
    },

    // --- RENDER ITEMS TOKO (Beli) ---
    renderShopItems() {
       const assetContainer = document.getElementById('shop-assets');
       const consumContainer = document.getElementById('shop-consumables');
       if (!assetContainer || !consumContainer) return;

       assetContainer.innerHTML = '';
       consumContainer.innerHTML = '';

       const activeBuffs = GameState.user.activeBuffs || {};
       const configItems = window.GameConfig.ShopItems || {};
       
       Object.keys(this.shopItemsMeta).forEach(key => {
            const item = this.shopItemsMeta[key];
            const price = configItems[key] || 999999; 
            
            let disabled = false;
            let btnText = `${price.toLocaleString()} PTS`;
            let btnClass = "bg-white/5 text-white hover:bg-white/10 border-white/10";
            
            // Logic Disabled Status
            if (item.type === 'land') {
                const purchased = GameState.user.landPurchasedCount || 0;
                if (item.tier === 1 && purchased >= 1) { disabled = true; btnText = "OWNED"; btnClass = "bg-gray-800 text-gray-500 border-transparent"; }
                if (item.tier === 2 && purchased < 1) { disabled = true; btnText = "LOCKED"; btnClass = "bg-red-900/20 text-red-500 border-red-500/20 opacity-50"; }
                if (item.tier === 2 && purchased >= 2) { disabled = true; btnText = "OWNED"; btnClass = "bg-gray-800 text-gray-500 border-transparent"; }
            } 
            else if (item.type === 'buff') {
                if (activeBuffs[item.buffKey] > Date.now()) { 
                    disabled = true;
                    btnText = "ACTIVE"; 
                    btnClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse"; 
                }
            }

            // HTML CARD
            const html = `
            <div class="glass p-3 rounded-2xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
                <div class="flex items-start justify-between mb-2">
                    <div class="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                        <i class="fas ${item.icon} ${item.color} text-sm"></i>
                    </div>
                    ${item.type === 'land' ? '<i class="fas fa-star text-[8px] text-yellow-500"></i>' : ''}
                </div>
                <div class="mb-2">
                    <h4 class="text-[9px] font-black uppercase text-white leading-tight mb-0.5">${item.name}</h4>
                    <p class="text-[7px] text-gray-400 leading-tight">${item.desc}</p>
                </div>
                <button onclick="MarketSystem.buyItem('${key}', ${price})" class="w-full py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${btnClass}" ${disabled ? 'disabled' : ''}>
                    ${btnText}
                </button>
            </div>`;

            if (item.category === 'Asset') {
                const assetHtml = `
                <div class="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 relative overflow-hidden mb-2">
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 shadow-inner">
                            <i class="fas ${item.icon} ${item.color} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-[10px] font-black uppercase text-white">${item.name}</h4>
                            <p class="text-[8px] text-gray-400 font-bold max-w-[120px]">${item.desc}</p>
                        </div>
                    </div>
                    <button onclick="MarketSystem.buyItem('${key}', ${price})" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all min-w-[80px] ${btnClass}" ${disabled ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>`;
                assetContainer.innerHTML += assetHtml;
            } else {
                consumContainer.innerHTML += html;
            }
       });
    },

    // --- UTILS ---
    getSellMultiplier() {
        let multiplier = 1;
        if (GameState.user.adBoosterCooldown > Date.now()) multiplier += 0.2; 
        const activeBuffs = GameState.user.activeBuffs || {};
        if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) multiplier += 0.15;
        return multiplier;
    },

    calculatePreview() {
        let total = 0;
        Object.keys(GameState.warehouse).forEach(item => {
            total += GameState.warehouse[item] * GameState.getPrice(item);
        });
        total = Math.floor(total * this.getSellMultiplier());
        const previewEl = document.getElementById('preview-coins');
        if (previewEl) previewEl.innerHTML = `${total.toLocaleString()} <span class="text-[10px] text-emerald-500 font-bold">PTS</span>`;
        return total;
    },

    // --- AFFILIATE & BOOSTER ---
    async triggerAffiliateCommission(amount) { /* Diurus Server */ },
    
    applyPriceBooster() {
        UIEngine.showRewardPopup("MARKET LEVERAGE", "Watch a Sponsor Ad to increase market value by 20%?", async () => {
            if(window.AdsManager) {
                AdsManager.showHybridStack(3, async () => {
                    GameState.user.adBoosterCooldown = Date.now() + 86400000; 
                    await GameState.save();
                    this.checkBoosterStatus();
                    this.calculatePreview();
                    UIEngine.showRewardPopup("LEVERAGE ACTIVE", "Market prices boosted by 20%.", null, "TRADE NOW");
                });
            } else {
                 UIEngine.showRewardPopup("ADS ERROR", "Ad system not ready.", null, "CLOSE");
            }
        }, "WATCH AD");
    },

    checkBoosterStatus() {
        const btn = document.getElementById('price-booster-btn');
        if(!btn) return;
        const now = Date.now();
        if (now < (GameState.user.adBoosterCooldown || 0)) {
            btn.innerHTML = `<i class="fas fa-clock"></i> Boost Active`;
            btn.className = "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 cursor-default";
            btn.onclick = null;
        } else {
            btn.innerHTML = `<i class="fas fa-chart-bar"></i> Maximize +20%`;
            btn.className = "bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-transform hover:bg-purple-500/30 cursor-pointer";
            btn.onclick = () => this.applyPriceBooster();
        }
    },

    checkExpiredBuffs() {
        // Hanya visual check, server punya validasi sendiri
        if (!GameState.user.activeBuffs) return;
        let changed = false;
        Object.keys(GameState.user.activeBuffs).forEach(k => {
            if(GameState.user.activeBuffs[k] < Date.now()) {
                delete GameState.user.activeBuffs[k];
                changed = true;
            }
        });
        if(changed) GameState.save();
    }
};

window.MarketSystem = MarketSystem;
