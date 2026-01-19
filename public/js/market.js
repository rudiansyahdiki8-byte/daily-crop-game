// js/market.js
// FRONTEND MARKET SYSTEM
// Logic: Tampilan di sini, Transaksi aman di Server API

const MarketSystem = {
    currentTab: 'buy', // 'buy' or 'sell'

    init() {
        const container = document.getElementById('Shop');
        if (container) {
            this.render(container);
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.init(); // Re-render
    },

    render(container) {
        container.innerHTML = '';
        container.className = "h-full flex flex-col bg-black/20";

        // 1. HEADER & TABS
        const header = document.createElement('div');
        header.className = "p-4 shrink-0";
        header.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-md">Marketplace</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Trading Center</p>
                </div>
                <div class="text-right">
                    <p class="text-[8px] text-gray-500 uppercase font-bold">Your Balance</p>
                    <p class="text-xl font-black text-emerald-400 text-shadow-sm">${Math.floor(GameState.user.coins).toLocaleString()} <span class="text-[10px]">PTS</span></p>
                </div>
            </div>
            
            <div class="flex p-1 bg-black/40 rounded-xl border border-white/5">
                <button onclick="MarketSystem.switchTab('buy')" class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${this.currentTab === 'buy' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <i class="fas fa-shopping-cart mr-1"></i> Buy Items
                </button>
                <button onclick="MarketSystem.switchTab('sell')" class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${this.currentTab === 'sell' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <i class="fas fa-coins mr-1"></i> Sell Crops
                </button>
            </div>
        `;
        container.appendChild(header);

        // 2. CONTENT GRID
        const content = document.createElement('div');
        content.className = "flex-1 overflow-y-auto no-scrollbar p-4 pt-0 pb-32 grid grid-cols-2 gap-3 content-start";
        
        if (this.currentTab === 'buy') {
            this.renderShopItems(content);
        } else {
            this.renderSellItems(content);
        }

        container.appendChild(content);
    },

    // --- RENDERING TOKO (BUY) ---
    renderShopItems(container) {
        const items = [
            { key: 'LandPrice_2', name: 'Land Plot #2', icon: 'fa-vector-square', desc: 'Unlock 2nd Slot' },
            { key: 'LandPrice_3', name: 'Land Plot #3', icon: 'fa-border-all', desc: 'Unlock 3rd Slot' },
            { key: 'StoragePlus', name: 'Extra Storage', icon: 'fa-warehouse', desc: '+50 Capacity' },
            { key: 'BuffSpeed', name: 'Speed Soil', icon: 'fa-bolt', desc: '-20% Grow Time (24h)' },
            { key: 'BuffGrowth', name: 'Growth Fertilizer', icon: 'fa-leaf', desc: '-50% Grow Time (24h)' },
            { key: 'BuffTrade', name: 'Trade Permit', icon: 'fa-file-invoice-dollar', desc: '+20% Sell Price (24h)' },
            { key: 'BuffYield', name: 'Yield Protocol', icon: 'fa-wheat', desc: '+Chance Double Yield (24h)' },
            { key: 'BuffRare', name: 'Genetic Mod', icon: 'fa-dna', desc: '+20% Rare Chance (24h)' }
        ];

        items.forEach(item => {
            // Ambil harga dari Config (Bukan hardcode)
            const price = window.GameConfig.ShopItems[item.key] || 999999;
            const canBuy = GameState.user.coins >= price;
            
            // Cek Status (Milik/Aktif)
            let statusHTML = '';
            let btnAction = `MarketSystem.buyItem('${item.key}')`;
            let btnClass = canBuy ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gray-700 text-gray-400 cursor-not-allowed';
            let btnText = 'BUY';

            // Logic Visual Khusus Lahan
            if (item.key.includes('Land')) {
                const landId = item.key === 'LandPrice_2' ? 2 : 3;
                const plot = GameState.farmPlots.find(p => p.id === landId);
                if (plot && plot.status !== 'locked') {
                    btnClass = 'bg-gray-800 text-emerald-500 border border-emerald-500/30';
                    btnText = 'OWNED';
                    btnAction = '';
                }
            }

            container.innerHTML += `
                <div class="glass p-3 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas ${item.icon} text-4xl text-white"></i>
                    </div>
                    <div>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-2 text-emerald-400 border border-emerald-500/30">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <h3 class="text-[10px] font-black text-white uppercase tracking-wide leading-tight">${item.name}</h3>
                        <p class="text-[7px] text-gray-400 mb-2">${item.desc}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-yellow-400 mb-1 drop-shadow-sm">${price.toLocaleString()} PTS</p>
                        <button onclick="${btnAction}" class="w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ${btnClass}">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        });
    },

    // --- RENDERING JUAL (SELL) ---
    renderSellItems(container) {
        if (!GameState.warehouse || Object.keys(GameState.warehouse).length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center py-10 opacity-50"><i class="fas fa-box-open text-4xl mb-2"></i><p class="text-xs">Storage Empty</p></div>`;
            return;
        }

        Object.keys(GameState.warehouse).forEach(key => {
            const count = GameState.warehouse[key];
            if (count <= 0) return;

            const herb = window.HerbData[key] || { name: key, img: '' };
            const currentPrice = GameState.getPrice(key);
            
            // Cek Bonus Buff
            let priceLabel = `${currentPrice}`;
            if (GameState.user.activeBuffs && GameState.user.activeBuffs['sell_bonus'] > Date.now()) {
                const boosted = Math.floor(currentPrice * 1.2);
                priceLabel = `<span class="text-gray-400 line-through text-[8px]">${currentPrice}</span> <span class="text-yellow-400 animate-pulse">${boosted}</span>`;
            }

            container.innerHTML += `
                <div class="glass p-3 rounded-2xl border border-white/5 flex items-center gap-3 relative">
                    <div class="w-10 h-10 bg-black/30 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                        <img src="${herb.img}" class="w-6 h-6 object-contain">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-[9px] font-black text-white uppercase truncate">${herb.name}</h3>
                        <p class="text-[7px] text-gray-400">Stock: <span class="text-white font-bold">${count}</span></p>
                        <p class="text-[8px] text-emerald-400 font-bold">Price: ${priceLabel}</p>
                    </div>
                    <button onclick="MarketSystem.sellItem('${key}', ${count})" class="w-12 h-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[8px] font-black uppercase shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center">
                        <span>SELL</span>
                        <span class="text-[6px]">ALL</span>
                    </button>
                </div>
            `;
        });
    },

    // --- TRANSAKSI KE API ---

    async buyItem(itemKey) {
        UIEngine.showRewardPopup("BUYING", "Processing purchase...", null, "...");
        GameState.isSyncing = true; // Kunci Autosave

        try {
            const response = await fetch('/api/market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    action: 'buy',
                    itemKey: itemKey
                })
            });
            const result = await response.json();

            if (result.success) {
                // Update State Total dari Server
                GameState.user.coins = result.newCoins;
                GameState.farmPlots = result.farmPlots;
                GameState.user.extraStorage = result.extraStorage;
                GameState.user.activeBuffs = result.activeBuffs;

                // Refresh UI
                UIEngine.updateHeader();
                this.init(); // Re-render toko (biar tombol berubah jadi OWNED)
                if(window.FarmSystem) FarmSystem.updateSlotStatus(); // Update gembok lahan di Farm

                UIEngine.showRewardPopup("SUCCESS", "Item Purchased!", null, "NICE");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error || "Purchase Failed", null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        } finally {
            GameState.isSyncing = false;
        }
    },

    async sellItem(itemKey, amount) {
        UIEngine.showRewardPopup("SELLING", `Selling ${amount}x items...`, null, "...");
        GameState.isSyncing = true;

        try {
            const response = await fetch('/api/market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    action: 'sell',
                    itemKey: itemKey,
                    amount: amount
                })
            });
            const result = await response.json();

            if (result.success) {
                // Update State
                GameState.user.coins = result.newCoins;
                GameState.warehouse[itemKey] = result.newStock;

                UIEngine.updateHeader();
                this.init(); // Refresh list jualan

                UIEngine.showRewardPopup("SOLD", `Earned ${result.earned} PTS`, null, "RICH!");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error || "Sell Failed", null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        } finally {
            GameState.isSyncing = false;
        }
    }
};

window.MarketSystem = MarketSystem;
