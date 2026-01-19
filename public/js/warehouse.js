// js/warehouse.js
const WarehouseSystem = {
    limits: { 'FREE': 50, 'MORTGAGE': 240, 'TENANT': 500, 'OWNER': 999999 },

    init() {
        if (!document.getElementById('WarehouseModal')) {
            this.createModal();
        }
    },

    createModal() {
        const div = document.createElement('div');
        div.id = 'WarehouseModal';
        div.className = "fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 hidden";
        document.body.appendChild(div);
    },

    getTotalItems() {
        if (!GameState.warehouse) return 0;
        return Object.values(GameState.warehouse).reduce((a, b) => a + b, 0);
    },

    show() {
        if (!document.getElementById('WarehouseModal')) this.init();
        const modal = document.getElementById('WarehouseModal');
        modal.classList.remove('hidden');
        this.render(modal);
    },

    close() {
        const modal = document.getElementById('WarehouseModal');
        if (modal) modal.classList.add('hidden');
    },

    render(container) {
        const warehouse = GameState.warehouse || {};
        const userPlan = (GameState.user && GameState.user.plan) ? GameState.user.plan : 'FREE';
        const maxCapacity = this.limits[userPlan] || 50;
        const currentUsed = this.getTotalItems();
        
        // Progress Bar Color
        const percent = Math.min(100, (currentUsed / maxCapacity) * 100);
        let barColor = percent > 90 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
        
        container.innerHTML = '';
        
        const panel = document.createElement('div');
        panel.className = "glass w-full max-w-md rounded-[2rem] border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200";
        
        panel.innerHTML = `
            <div class="p-5 bg-gradient-to-b from-gray-800 to-gray-900 border-b border-white/10 relative z-10">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                            <i class="fas fa-warehouse text-white text-xl drop-shadow-md"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Storage</h2>
                            <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Manage Your Crops</p>
                        </div>
                    </div>
                    <button onclick="WarehouseSystem.close()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="w-full h-6 bg-black/50 rounded-full border border-white/5 relative overflow-hidden">
                    <div class="h-full ${barColor} transition-all duration-700 relative" style="width: ${percent}%">
                        <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-[9px] font-black uppercase text-white drop-shadow-md tracking-widest">${currentUsed} / ${maxCapacity} ITEMS</span>
                    </div>
                </div>
            </div>

            <div id="wh-list" class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-black/20"></div>
        `;

        const listContainer = panel.querySelector('#wh-list');
        const items = Object.keys(warehouse).filter(k => warehouse[k] > 0);

        if (items.length === 0) {
            listContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-48 opacity-50 text-gray-500">
                    <i class="fas fa-box-open text-5xl mb-3"></i>
                    <p class="text-[10px] uppercase font-bold tracking-widest">Storage Empty</p>
                </div>`;
        } else {
items.forEach(itemKey => {
                const qty = warehouse[itemKey];

                // Ambil Config Tanaman
                const configData = (window.GameConfig && window.GameConfig.Crops && window.GameConfig.Crops[itemKey]) 
                                   ? window.GameConfig.Crops[itemKey] 
                                   : null;

                const name = configData ? configData.name : itemKey;
                const img = configData ? configData.img : `assets_iso/plant_${itemKey.toLowerCase()}.png`;
                const rarity = configData ? configData.rarity : 'Common';

                // === HARGA DINAMIS ===
                // Panggil fungsi getPrice dari State yang baru kita buat
                const price = GameState.getPrice ? GameState.getPrice(itemKey) : 10;
                
                // Style Rarity
                let rarityClass = 'border-white/10';
                if (rarity === 'Legendary') rarityClass = 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
                else if (rarity === 'Epic') rarityClass = 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
                else if (rarity === 'Rare') rarityClass = 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
                else if (rarity === 'Uncommon') rarityClass = 'border-green-500/50';

                // Indikator Trend (Naik/Turun dari Rata-rata)
                const avgPrice = configData ? (configData.minPrice + configData.maxPrice)/2 : 10;
                const isHigh = price >= avgPrice;
                const trendIcon = isHigh ? '<i class="fas fa-arrow-trend-up text-emerald-400"></i>' : '<i class="fas fa-arrow-trend-down text-red-400"></i>';

                const itemRow = document.createElement('div');
                itemRow.className = `flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border ${rarityClass} relative group overflow-hidden`;
                
                itemRow.innerHTML = `
                    <div class="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center relative shrink-0 border border-white/5">
                        <img src="${img}" class="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform" onerror="this.src='assets_iso/stage_growing.png'">
                        <div class="absolute -top-2 -left-2 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">x${qty}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-0.5">
                            <h4 class="text-white font-black text-sm uppercase truncate">${name}</h4>
                            <span class="text-[6px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300 uppercase">${rarity}</span>
                        </div>
                        <div class="text-[9px] text-gray-400 flex items-center gap-2">
                            Price: <span class="text-yellow-400 font-bold text-xs">${price}</span> ${trendIcon}
                        </div>
                    </div>
                    <button onclick="WarehouseSystem.sellItem('${itemKey}', ${qty})" class="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white pl-3 pr-4 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-1">
                        <i class="fas fa-coins text-yellow-300 text-xs"></i> Sell
                    </button>
                `;
                listContainer.appendChild(itemRow);
            });
        }
        
        container.appendChild(panel);
    },

    async sellItem(itemName, amount) {
        if (!confirm(`Sell all ${amount} ${itemName}?`)) return;
        
        UIEngine.showRewardPopup("SELLING", "Contacting Buyer...", null, "...");
        
        try {
            const response = await fetch('/api/market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: GameState.user.userId, action: 'sell', itemName, amount })
            });
            const result = await response.json();
            
            if (result.success) {
                // Update State Lokal
                GameState.user.coins = result.newCoins || (GameState.user.coins + result.earned);
                GameState.warehouse[itemName] = result.newStock;
                
                // Refresh UI
                this.render(document.getElementById('WarehouseModal'));
                if(window.UIEngine) UIEngine.updateHeader();
                UIEngine.showRewardPopup("SOLD!", `Earned ${result.earned} Coins`, null, "GREAT");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error, null, "CLOSE");
            }
        } catch (e) {
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        }
    }
};

window.WarehouseSystem = WarehouseSystem;

// Jembatan Kompatibilitas untuk Tombol Lama
window.addEventListener('load', () => {
    if (!window.UIEngine) window.UIEngine = {};
    window.UIEngine.showWarehouse = function() {
        if (window.WarehouseSystem) WarehouseSystem.show();
    };
});

