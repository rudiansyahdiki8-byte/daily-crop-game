// js/warehouse.js
const WarehouseSystem = {
    // Kapasitas sesuai Plan
    limits: { 'FREE': 50, 'MORTGAGE': 240, 'TENANT': 500, 'OWNER': 999999 },

    init() {
        // Cek apakah modal sudah ada? Jika belum, buatkan!
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

    isFull(incomingAmount = 1) {
        const currentTotal = this.getTotalItems();
        const userPlan = (GameState.user && GameState.user.plan) ? GameState.user.plan : 'FREE';
        const maxLimit = this.limits[userPlan] || 50;
        return (currentTotal + incomingAmount) > maxLimit;
    },

    getTotalItems() {
        if (!GameState.warehouse) return 0;
        return Object.values(GameState.warehouse).reduce((a, b) => a + b, 0);
    },

    show() {
        // Pastikan init sudah jalan
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
        
        const percent = Math.min(100, (currentUsed / maxCapacity) * 100);
        let barColor = percent > 80 ? 'bg-red-500' : 'bg-emerald-500';

        container.innerHTML = '';
        
        // Panel UI
        const panel = document.createElement('div');
        panel.className = "w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200";
        
        panel.innerHTML = `
            <div class="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-black text-white italic uppercase"><i class="fas fa-warehouse text-amber-400 mr-2"></i>Storage</h2>
                    <div class="text-[10px] text-gray-400 font-bold uppercase mt-1">Capacity: <span class="text-white">${currentUsed}</span> / <span class="text-yellow-400">${maxCapacity === 999999 ? '∞' : maxCapacity}</span></div>
                </div>
                <button onclick="WarehouseSystem.close()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 hover:text-white text-gray-400 transition-colors flex items-center justify-center"><i class="fas fa-times"></i></button>
            </div>
            <div class="h-1 w-full bg-slate-700"><div class="h-full ${barColor} transition-all duration-500" style="width: ${percent}%"></div></div>
        `;

        // List Barang
        const listContainer = document.createElement('div');
        listContainer.className = "flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar";
        
        const items = Object.keys(warehouse).filter(k => warehouse[k] > 0);

        if (items.length === 0) {
            listContainer.innerHTML = `<div class="flex flex-col items-center justify-center h-40 opacity-50 text-gray-400"><i class="fas fa-box-open text-4xl mb-2"></i><span class="text-xs uppercase font-bold">Empty Storage</span></div>`;
        } else {
            items.forEach(itemKey => {
                const qty = warehouse[itemKey];
                // Ambil harga dari Config atau default 10
                const cropConf = (window.GameConfig?.Crops && window.GameConfig.Crops[itemKey]) ? window.GameConfig.Crops[itemKey] : { sellPrice: 10 };
                const price = cropConf.sellPrice || 10;
                
                const itemRow = document.createElement('div');
                itemRow.className = "flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700";
                itemRow.innerHTML = `
                    <div class="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center relative">
                        <img src="assets_iso/plant_${itemKey.toLowerCase()}.png" class="w-10 h-10 object-contain drop-shadow-md" onerror="this.src='assets_iso/stage_growing.png'">
                        <div class="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">x${qty}</div>
                    </div>
                    <div class="flex-1"><h4 class="text-white font-bold text-sm uppercase">${itemKey}</h4><div class="text-[10px] text-gray-400">Sell: <span class="text-yellow-400 font-bold">${price}</span></div></div>
                    <button onclick="WarehouseSystem.sellItem('${itemKey}', ${qty})" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg active:scale-95 transition-all">Sell All</button>
                `;
                listContainer.appendChild(itemRow);
            });
        }
        panel.appendChild(listContainer);
        container.appendChild(panel);
    },

    // CALL SERVER MARKET
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
                // Update Lokal agar responsif
                GameState.user.coins = result.newCoins || (GameState.user.coins + result.earned); // Pastikan sinkron
                GameState.warehouse[itemName] = result.newStock;
                
                // Refresh UI
                this.render(document.getElementById('WarehouseModal'));
                
                // PENTING: Update Header Koin di Layar Utama
                if(window.UIEngine && UIEngine.updateHeader) UIEngine.updateHeader();
                
                UIEngine.showRewardPopup("SOLD!", `Earned ${result.earned} Coins`, null, "GREAT");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error, null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        }
    }
};

window.WarehouseSystem = WarehouseSystem;
