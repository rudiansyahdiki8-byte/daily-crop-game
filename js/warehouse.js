// js/warehouse.js
const WarehouseSystem = {
    
    // --- UTILITIES ---
    
    getTotalItems() {
        if (!GameState.warehouse) return 0;
        return Object.values(GameState.warehouse).reduce((a, b) => a + b, 0);
    },

    getMaxLimit() {
        // ATURAN EKONOMI BARU:
        // Base Limit = 50 Item (Memaksa user sering ke market) 
        // Tambahan didapat dari beli item "Warehouse +20" di Market [cite: 543]
        
        const baseLimit = 50;
        const extra = GameState.user.extraStorage || 0; 
        
        // Jika user punya Plan tinggi (Owner), bisa kita kasih bonus, 
        // tapi untuk saat ini kita ikut aturan ketat ekonomi: 50 + Extra.
        return baseLimit + extra;
    },

    isFull(amountToAdd = 1) {
        const current = this.getTotalItems();
        const max = this.getMaxLimit();
        return (current + amountToAdd) > max;
    },

    // --- UI CONTROLLER ---

    show() {
        if (!GameState.isLoaded) return;
        this.renderLayout();
        this.renderInventory();
        const modal = document.getElementById('warehouse-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    close() {
        const modal = document.getElementById('warehouse-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    renderLayout() {
        const modalContent = document.querySelector('#warehouse-modal .glass');
        if (!modalContent) return;

        // Reset container style
        modalContent.className = "glass w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl shadow-emerald-900/20";
        
        const current = this.getTotalItems();
        const max = this.getMaxLimit();
        const percent = Math.min((current / max) * 100, 100);
        
        // Warna Bar Dinamis
        let barColor = "bg-emerald-500 shadow-[0_0_10px_#10b981]";
        let limitColor = "text-white";
        
        if (percent >= 100) {
            barColor = "bg-red-500 shadow-[0_0_15px_red] animate-pulse";
            limitColor = "text-red-400 animate-pulse";
        } else if (percent > 80) {
            barColor = "bg-amber-500 shadow-[0_0_10px_orange]";
            limitColor = "text-amber-400";
        }

        modalContent.innerHTML = `
            <button onclick="WarehouseSystem.close()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20"><i class="fas fa-times text-xs"></i></button>

            <div class="mb-6 relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative">
                        <i class="fas fa-warehouse text-white text-xl drop-shadow-md"></i>
                        ${percent >= 100 ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>' : ''}
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Storage</h2>
                        <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Keep limits in check</p>
                    </div>
                </div>

                <div class="w-full h-8 bg-black/60 rounded-xl border border-white/10 relative overflow-hidden p-1">
                    <div id="wh-progress-bar" class="h-full rounded-lg ${barColor} transition-all duration-700 ease-out relative overflow-hidden" style="width: ${percent}%">
                        <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center"><span class="text-[9px] font-black uppercase tracking-widest drop-shadow-md ${limitColor}">${current} / ${max} ITEMS</span></div>
                </div>
            </div>

            <div id="warehouse-grid" class="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 gap-3 content-start pb-4 min-h-0"></div>

            <div class="pt-4 mt-auto border-t border-white/5 shrink-0">
                <button onclick="WarehouseSystem.goToSell()" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 group">
                    <i class="fas fa-sack-dollar group-hover:-rotate-12 transition-transform"></i> Sell at Market
                </button>
            </div>
        `;
    },

    renderInventory() {
        const container = document.getElementById('warehouse-grid');
        if (!container) return;
        
        // Bersihkan Hantu Visual
        container.innerHTML = '';
        
        // Proteksi jika data null
        if (!GameState.warehouse) {
            container.innerHTML = `<div class="col-span-3 text-center text-[9px] text-gray-500">Loading storage...</div>`;
            return;
        }
        
        const items = Object.keys(GameState.warehouse);
        let isEmpty = true;
        
        items.forEach(key => {
            const count = GameState.warehouse[key];
            // [PENTING] Hanya gambar jika jumlah > 0. 
            // Kadang server kirim {ginger: 0}, ini harus difilter.
            if (count && count > 0) {
                isEmpty = false;
                const plantInfo = (window.HerbData && HerbData[key]) ? HerbData[key] : { name: key, img: '' };
                const rarityColor = plantInfo.rarity === 'Legendary' ? 'border-purple-500/50 shadow-purple-500/20' : 
                                    plantInfo.rarity === 'Epic' ? 'border-amber-500/50 shadow-amber-500/20' : 'border-white/10';

                container.innerHTML += `
                    <div class="glass p-2 rounded-2xl flex flex-col items-center justify-center relative border transition-all aspect-square bg-white/5 ${rarityColor} shadow-lg group hover:scale-105">
                        <div class="absolute top-1 right-1 bg-black/60 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md border border-white/10">x${count}</div>
                        <img src="${plantInfo.img}" class="w-10 h-10 object-contain mb-2 drop-shadow-md">
                        <span class="text-[7px] font-black text-gray-300 uppercase text-center leading-tight w-full truncate px-1">${plantInfo.name}</span>
                    </div>
                `;
            }
        });

        if (isEmpty) {
            container.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center py-10 opacity-50"><i class="fas fa-box-open text-4xl text-gray-600 mb-2"></i><p class="text-[9px] uppercase font-bold text-gray-500">Storage Empty</p></div>`;
        }
    },
    
    goToSell() {
        this.close();
        if(window.UIEngine && window.MarketSystem) {
            UIEngine.navigate('Shop');
            MarketSystem.switchTab('sell');
        }
    }
};


window.WarehouseSystem = WarehouseSystem;
