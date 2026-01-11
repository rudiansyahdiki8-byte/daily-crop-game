const MarketSystem = {
    currentTab: 'sell', 
    
    // Config Hardware & Software (Black Market Reskin)
    shopItems: [
        { id: 'land_permit', type: 'land', name: "Node Extension Chip", icon: "fa-microchip", color: "text-cyan-400", desc: "Unlock Neural Plot (Max 2 via CRD)", special: true },
        { id: 'storage_plus', type: 'storage', name: "Buffer Upgrade", icon: "fa-hdd", color: "text-blue-400", price: 5000, desc: "+20 Data Slots (Permanent)" },
        { id: 'growth_fert', type: 'buff', buffKey: 'growth_speed', name: "Overclock Module", icon: "fa-bolt", color: "text-yellow-400", price: 1500, desc: "-20% Cycle Time (24h)" },
        { id: 'speed_soil', type: 'buff', buffKey: 'speed_soil', name: "Neural Paste", icon: "fa-vial", color: "text-green-400", price: 1000, desc: "-10% Cycle Time (24h)" },
        { id: 'yield_boost', type: 'buff', buffKey: 'yield_bonus', name: "Yield Injector", icon: "fa-syringe", color: "text-amber-500", price: 3000, desc: "+25% Double Extraction Chance" },
        { id: 'trade_permit', type: 'buff', buffKey: 'sell_bonus', name: "Syndicate Pass", icon: "fa-id-card", color: "text-purple-400", price: 2500, desc: "+20% Exchange Rate (24h)" },
        { id: 'rare_boost', type: 'buff', buffKey: 'rare_luck', name: "Zenith Lens", icon: "fa-crosshairs", color: "text-pink-400", price: 4000, desc: "+20% Drop Probability (24h)" }
    ],

    init() {
        const shopContainer = document.getElementById('Shop');
        if (shopContainer) this.renderLayout(shopContainer);
        
        const pricesChanged = GameState.refreshMarketPrices();
        this.checkExpiredBuffs();
        this.switchTab(this.currentTab);
    },

    // --- LOGIC AFFILIATE (PEMICU KOMISI) ---
    triggerAffiliateCommission(totalSales) {
        const commission = Math.floor(totalSales * 0.10); 
        if (GameState.user.referral_status === 'Pending') {
            GameState.user.referral_status = 'Active'; 
            console.log("[SYNDICATE] Agent Activated! First Exchange Done.");
        }
        if (GameState.user.upline && commission > 0) {
            console.log(`[SYNDICATE] Routing ${commission} Credits to Handler: ${GameState.user.upline}`);
        }
    },

    renderLayout(container) { 
        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-24";
        
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-[0.1em] drop-shadow-[0_0_10px_rgba(255,0,85,0.4)]">Black Market</h2>
                    <p class="text-[9px] text-cyan-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Underground Data Exchange</p>
                </div>
                <div class="w-12 h-12 bg-black rounded-xl shadow-[0_0_15px_#ff0055] flex items-center justify-center border border-[#ff0055]/50 transform -rotate-3">
                    <i class="fas fa-user-secret text-[#ff0055] text-xl"></i>
                </div>
            </div>`;
        container.appendChild(header);

        const tabContainer = document.createElement('div');
        tabContainer.className = "flex gap-3 bg-black/40 p-1 rounded-sm border border-cyan-500/20 mb-6 shrink-0 backdrop-blur-md";
        tabContainer.innerHTML = `
            <button id="tab-sell" onclick="MarketSystem.switchTab('sell')" class="flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 tracking-widest italic">
                <i class="fas fa-file-export text-sm"></i> Liquidate Data
            </button>
            <button id="tab-buy" onclick="MarketSystem.switchTab('buy')" class="flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 tracking-widest italic">
                <i class="fas fa-microchip text-sm"></i> Hardware
            </button>`;
        container.appendChild(tabContainer);

        const contentArea = document.createElement('div');
        contentArea.className = "flex-1 relative overflow-hidden min-h-0"; 
        contentArea.innerHTML += `
            <div id="area-sell" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 overflow-y-auto no-scrollbar pb-10">
                <div class="glass p-5 relative overflow-hidden shrink-0 border-cyan-500/30">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div class="relative z-10 flex justify-between items-end">
                        <div>
                            <p class="text-[9px] text-cyan-500/60 font-bold uppercase mb-1 tracking-widest">Net Asset Worth</p>
                            <h3 id="preview-coins" class="text-3xl font-black text-white tracking-tighter">0 <span class="text-xs text-[#ff0055]">CRD</span></h3>
                            <p class="text-[7px] text-cyan-400 mt-1 italic uppercase tracking-widest"><i class="fas fa-sync-alt animate-spin-slow"></i> Rates update every cycle</p>
                        </div>
                        <button id="price-booster-btn" onclick="MarketSystem.applyPriceBooster()" class="bg-[#ff0055]/20 border border-[#ff0055]/50 text-[#ff0055] px-3 py-1.5 rounded-sm text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all">
                            <i class="fas fa-satellite"></i> Proxy +20%
                        </button>
                    </div>
                </div>
                <p class="text-[8px] text-cyan-900 font-bold uppercase tracking-[0.2em] px-2 italic">Select specific data fragment to liquidate</p>
                <div id="sell-inventory" class="grid grid-cols-1 gap-2 content-start"></div>
                <button id="btn-sell-all" onclick="MarketSystem.sellAll()" class="w-full py-4 bg-[#ff0055] text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_0_20px_rgba(255,0,85,0.4)] active:scale-95 transition-all mt-auto shrink-0 flex items-center justify-center gap-2 italic">
                    <i class="fas fa-skull-crossbones"></i> Full Data Wipe (Sell All)
                </button>
            </div>`;
        contentArea.innerHTML += `<div id="area-buy" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 hidden overflow-y-auto no-scrollbar pb-10"><div id="booster-list" class="flex flex-col gap-3"></div></div>`;
        container.appendChild(contentArea);
    },

    switchTab(tab) {
        this.currentTab = tab;
        const btnBuy = document.getElementById('tab-buy');
        const btnSell = document.getElementById('tab-sell');
        const areaBuy = document.getElementById('area-buy');
        const areaSell = document.getElementById('area-sell');
        if (!btnBuy || !areaBuy) return;
        
        const activeClass = "bg-[#ff0055] text-white shadow-[0_0_15px_rgba(255,0,85,0.5)]";
        const inactiveClass = "text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/5";
        
        if (tab === 'buy') {
            btnBuy.className = `flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${activeClass}`;
            btnSell.className = `flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${inactiveClass}`;
            areaBuy.classList.remove('hidden');
            areaSell.classList.add('hidden');
            this.renderShopItems();
        } else {
            btnSell.className = `flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${activeClass}`;
            btnBuy.className = `flex-1 py-3 rounded-sm text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${inactiveClass}`;
            areaSell.classList.remove('hidden');
            areaBuy.classList.add('hidden');
            this.renderSellInventory();
            this.calculatePreview();
            this.checkBoosterStatus();
        }
    },

    processSell(key, qty, price) {
        const multiplier = this.getSellMultiplier();
        const finalPrice = Math.floor(price * multiplier);
        const totalEarn = finalPrice * qty;

        GameState.user.coins += totalEarn;
        GameState.user.totalSold += totalEarn;
        GameState.warehouse[key] -= qty;
        
        this.triggerAffiliateCommission(totalEarn);

        GameState.save();
        UIEngine.updateHeader();
        this.renderSellInventory();
        this.calculatePreview();
        
        UIEngine.showRewardPopup("TRANSFER COMPLETE", `Liquidation successful! Received ${totalEarn} Credits.`, null, "ACKNOWLEDGE");
    },

    sellAll() {
        const total = this.calculatePreview();
        if (total <= 0) return;

        UIEngine.showRewardPopup("INITIALIZE WIPE?", `Liquidate all fragments for ${total.toLocaleString()} Credits?`, () => {
            Object.keys(GameState.warehouse).forEach(k => { GameState.warehouse[k] = 0; });
            GameState.user.coins += total;
            GameState.user.totalSold += total;
            
            this.triggerAffiliateCommission(total);

            GameState.save();
            UIEngine.updateHeader();
            this.renderSellInventory();
            this.calculatePreview();
            
            setTimeout(() => { UIEngine.showRewardPopup("VAULT WIPED", `Neural link updated. ${total.toLocaleString()} Credits synced.`, null, "DONE"); }, 500);
        }, "START WIPE");
    },

    renderSellInventory() {
        const container = document.getElementById('sell-inventory');
        if (!container) return;
        container.innerHTML = '';
        let isEmpty = true;
        Object.keys(GameState.warehouse).forEach(key => {
            const count = GameState.warehouse[key];
            if (count > 0) {
                isEmpty = false;
                const plantInfo = (window.FarmSystem && FarmSystem.plantData[key]) ? FarmSystem.plantData[key] : { img: '', name: key };
                const currentPrice = GameState.getPrice(key);
                const maxPrice = window.PriceRanges[key].max;
                const priceQuality = currentPrice > (maxPrice * 0.8) ? 'text-cyan-400' : (currentPrice < (maxPrice * 0.5) ? 'text-[#ff0055]' : 'text-yellow-400');
                const trendIcon = currentPrice > (maxPrice * 0.8) ? 'fa-chart-line' : 'fa-minus';
                
                container.innerHTML += `
                    <div onclick="MarketSystem.openSellModal('${key}', ${count}, ${currentPrice})" class="glass p-3 flex items-center justify-between border-cyan-500/10 group active:scale-95 transition-all cursor-pointer hover:bg-cyan-500/5">
                        <div class="flex items-center gap-3">
                            <img src="${plantInfo.img}" class="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]">
                            <div>
                                <h4 class="text-[9px] font-black text-white uppercase tracking-wider">${plantInfo.name}</h4>
                                <span class="text-[8px] text-cyan-500/40">Fragment Qty: <b class="text-white">${count}</b></span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] font-black ${priceQuality} flex items-center gap-1 uppercase tracking-tighter">
                                <i class="fas ${trendIcon} text-[8px]"></i> ${currentPrice}
                            </span>
                            <span class="text-[7px] text-gray-600 uppercase italic">Rate/Unit</span>
                        </div>
                    </div>`;
            }
        });
        const btn = document.getElementById('btn-sell-all');
        if (isEmpty) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 opacity-20"><i class="fas fa-terminal text-4xl text-cyan-900 mb-2"></i><p class="text-[9px] uppercase font-bold text-cyan-800 tracking-[0.2em]">Matrix Empty</p></div>`;
            if(btn) btn.disabled = true;
        } else {
            if(btn) btn.disabled = false;
        }
    },
    
    openSellModal(key, maxQty, price) {
        const plantName = (window.FarmSystem && FarmSystem.plantData[key]) ? FarmSystem.farmData[key].name : key;
        UIEngine.showRewardPopup("EXTRACT DATA", `
            <div class="text-center mb-4">
                <h3 class="text-lg font-black text-cyan-400 uppercase tracking-widest">${plantName}</h3>
                <p class="text-[8px] text-gray-500 italic uppercase">Exchange Rate: ${price} CRD/packet</p>
            </div>
            <div class="bg-black/60 p-4 border border-cyan-500/20 mb-4">
                <input type="range" id="sell-slider" min="1" max="${maxQty}" value="${maxQty}" class="w-full h-1 bg-cyan-900 appearance-none accent-[#ff0055] mb-3" oninput="document.getElementById('sell-qty-display').innerText = this.value; document.getElementById('sell-total-display').innerText = (this.value * ${price}).toLocaleString();">
                <div class="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span class="text-white">Qty: <span id="sell-qty-display" class="text-cyan-400">${maxQty}</span></span>
                    <span class="text-white">Yield: <span id="sell-total-display" class="text-[#ff0055]">${(maxQty * price).toLocaleString()}</span> <span class="text-[7px] text-[#ff0055]">CRD</span></span>
                </div>
            </div>`, () => {
            const qtyToSell = parseInt(document.getElementById('sell-slider').value);
            this.processSell(key, qtyToSell, price);
        }, "CONFIRM LIQUIDATION");
    },
    
    getSellMultiplier() {
        let multiplier = 1;
        if (GameState.user.adBoosterCooldown > Date.now()) multiplier += 0.2;
        if (GameState.user.activeBuffs && GameState.user.activeBuffs['sell_bonus'] > Date.now()) multiplier += 0.2;
        return multiplier;
    },
    
    calculatePreview() {
        let total = 0;
        Object.keys(GameState.warehouse).forEach(item => {
            const price = GameState.getPrice(item);
            total += GameState.warehouse[item] * price;
        });
        total = Math.floor(total * this.getSellMultiplier());
        const previewEl = document.getElementById('preview-coins');
        if (previewEl) previewEl.innerHTML = `${total.toLocaleString()} <span class="text-[10px] text-[#ff0055] font-black uppercase italic">CRD</span>`;
        return total;
    },
    
    renderShopItems() {
       const list = document.getElementById('booster-list');
       if (!list) return;
       const activeBuffs = GameState.user.activeBuffs || {};
       list.innerHTML = this.shopItems.map(item => {
            let price = item.price;
            let btnText = `${price ? price.toLocaleString() : 0} CRD`;
            let disabled = false;
            let statusBadge = "";
            if (item.type === 'land') {
                const purchased = GameState.user.landPurchasedCount || 0;
                if (purchased === 0) { price = 5000; btnText = "5,000 CRD"; } 
                else if (purchased === 1) { price = 500000; btnText = "500,000 CRD"; } 
                else { disabled = true; btnText = "LIMIT REACED"; statusBadge = `<span class="text-[7px] text-[#ff0055] font-black border border-[#ff0055]/30 px-1 uppercase tracking-tighter">PLAN LIMIT</span>`; }
            }
            if (item.type === 'buff' && activeBuffs[item.buffKey] > Date.now()) {
                disabled = true; btnText = "INSTALLED";
                const hoursLeft = Math.ceil((activeBuffs[item.buffKey] - Date.now()) / 3600000);
                statusBadge = `<span class="text-[7px] text-cyan-400 font-black italic uppercase">${hoursLeft}H REMAINING</span>`;
            }
            return `
                <div class="glass p-4 flex justify-between items-center border-cyan-500/10 group relative overflow-hidden">
                    <div class="flex items-center gap-4 pl-1 relative z-10">
                        <div class="w-12 h-12 bg-black flex items-center justify-center border border-cyan-500/20">
                            <i class="fas ${item.icon} ${item.color} text-xl drop-shadow-[0_0_5px_currentColor]"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 italic">${item.name} ${statusBadge}</p>
                            <p class="text-[8px] text-cyan-900 font-bold uppercase tracking-widest mt-0.5">${item.desc}</p>
                        </div>
                    </div>
                    <button onclick="MarketSystem.buyItem('${item.id}', ${price})" class="${disabled ? 'bg-black text-gray-700 cursor-not-allowed border-gray-900' : 'bg-black border-cyan-500/40 text-cyan-400 hover:bg-[#ff0055] hover:text-white hover:border-[#ff0055] active:scale-95'} border px-4 py-2.5 rounded-sm text-[9px] font-black transition-all shadow-lg uppercase italic tracking-widest" ${disabled ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>`;
        }).join('');
    },
    
    buyItem(id, price) {
        const item = this.shopItems.find(i => i.id === id);
        if (!item) return;
        if (GameState.user.coins < price) { UIEngine.showRewardPopup("INSUFFICIENT CREDITS", "Neural balance low. Liquidate more data.", null, "CLOSE"); return; }
        if (item.type === 'land') {
            const lockedPlot = GameState.farmPlots.find(p => p.status === 'locked');
            if (!lockedPlot) { UIEngine.showRewardPopup("MAINBOARD LIMIT", "Protocol blocked. Upgrade System Plan to expand.", () => UIEngine.navigate('SubscibePlan'), "UPGRADE"); return; }
        }
        UIEngine.showRewardPopup("INITIALIZE PURCHASE?", `Install ${item.name} module for ${price.toLocaleString()} Credits?`, () => {
            GameState.user.coins -= price;
            if (item.type === 'land') {
                const lockedPlot = GameState.farmPlots.find(p => p.status === 'locked');
                if (lockedPlot) {
                    lockedPlot.status = 'empty';
                    if (!GameState.user.landPurchasedCount) GameState.user.landPurchasedCount = 0;
                    GameState.user.landPurchasedCount++;
                }
            } else if (item.type === 'storage') {
                if (!GameState.user.extraStorage) GameState.user.extraStorage = 0;
                GameState.user.extraStorage += 20;
            } else if (item.type === 'buff') {
                if (!GameState.user.activeBuffs) GameState.user.activeBuffs = {};
                GameState.user.activeBuffs[item.buffKey] = Date.now() + 86400000;
            }
            GameState.save(); UIEngine.updateHeader(); this.renderShopItems();
            UIEngine.showRewardPopup("MODULE INSTALLED", `${item.name} hardware is now online.`, null, "ACKNOWLEDGE");
        }, "AUTHORIZE");
    },
    
    checkBoosterStatus() {
        const btn = document.getElementById('price-booster-btn');
        if(!btn) return;
        const now = Date.now();
        const cooldown = GameState.user.adBoosterCooldown || 0;
        if (now < cooldown) {
            const timeLeft = Math.ceil((cooldown - now) / 3600000);
            btn.className = "bg-black text-gray-700 px-3 py-1.5 border border-gray-900 text-[8px] font-black uppercase flex items-center gap-1 cursor-not-allowed";
            btn.innerHTML = `<i class="fas fa-history"></i> Lock: ${timeLeft}h`;
            btn.onclick = null;
        } else {
            btn.className = "bg-[#ff0055]/20 border border-[#ff0055]/50 text-[#ff0055] px-3 py-1.5 rounded-sm text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer";
            btn.innerHTML = `<i class="fas fa-satellite-dish"></i> Uplink +20%`;
            btn.onclick = () => this.applyPriceBooster();
        }
    },
    
    applyPriceBooster() {
        UIEngine.showRewardPopup("PROXY UPLINK", "Establish illegal proxy connection for +20% liquidation rate (24h)?", () => {
            GameState.user.adBoosterCooldown = Date.now() + 86400000;
            GameState.save();
            this.checkBoosterStatus();
            this.calculatePreview();
        }, "CONNECT PROXY");
    },
    
    checkExpiredBuffs() {
        if (!GameState.user.activeBuffs) return;
        Object.keys(GameState.user.activeBuffs).forEach(k => {
            if(GameState.user.activeBuffs[k] < Date.now()) delete GameState.user.activeBuffs[k];
        });
        GameState.save();
    }
};

window.MarketSystem = MarketSystem;