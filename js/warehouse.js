const WarehouseSystem = {
    // --- UTILITIES ---
    
    getTotalItems() {
        if (!GameState.warehouse) return 0;
        return Object.values(GameState.warehouse).reduce((a, b) => a + b, 0);
    },

    getMaxLimit() {
        const userPlan = GameState.user.plan || "FREE";
        const baseLimit = (window.PlanConfig && PlanConfig[userPlan]) ? PlanConfig[userPlan].warehouseLimit : 50;
        const extra = GameState.user.extraStorage || 0; 
        
        return baseLimit === 9999 ? 9999 : (baseLimit + extra);
    },

    isFull(amountToAdd = 1) {
        const current = this.getTotalItems();
        const max = this.getMaxLimit();
        if (max === 9999) return false;
        return (current + amountToAdd) > max;
    },

    // --- UI CONTROLLER ---

    show() {
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

        modalContent.innerHTML = '';
        modalContent.className = "glass w-full max-w-sm p-6 border border-cyan-500/30 relative overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_20px_rgba(0,0,0,1)]";

        const current = this.getTotalItems();
        const max = this.getMaxLimit();
        const percent = Math.min((current / max) * 100, 100);
        
        let barColor = "bg-cyan-500 shadow-[0_0_10px_#00f2ff]";
        let limitColor = "text-cyan-400";
        
        if (percent >= 100) {
            barColor = "bg-[#ff0055] shadow-[0_0_15px_#ff0055] animate-pulse";
            limitColor = "text-[#ff0055] animate-pulse";
        } else if (percent > 70) {
            barColor = "bg-amber-500 shadow-[0_0_10px_#f59e0b]";
            limitColor = "text-amber-500";
        }

        modalContent.innerHTML = `
            <button onclick="WarehouseSystem.close()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-[#ff0055] hover:text-white transition-all z-20"><i class="fas fa-times text-xs"></i></button>

            <div class="mb-6 relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]"><i class="fas fa-database text-cyan-400 text-lg"></i></div>
                    <div><h2 class="text-xl font-black text-white italic uppercase tracking-[0.1em]">Neural Vault</h2><p class="text-[8px] text-cyan-500/60 font-bold uppercase tracking-widest italic">Hardware Storage Management</p></div>
                </div>

                <div class="w-full h-6 bg-black rounded-sm border border-cyan-500/20 relative overflow-hidden">
                    <div id="wh-progress-bar" class="h-full ${barColor} transition-all duration-700 ease-out flex items-center justify-end pr-2" style="width: ${percent}%">
                        ${percent >= 95 ? '<i class="fas fa-exclamation-triangle text-[8px] text-white animate-flicker"></i>' : ''}
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center"><span class="text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-md ${limitColor}">${current} / ${max === 9999 ? 'UNLIMITED' : max} UNITS</span></div>
                </div>
            </div>

            <div id="warehouse-grid" class="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 gap-3 content-start pb-4 min-h-0"></div>

            <div class="pt-4 mt-auto border-t border-cyan-500/10 shrink-0">
                <button onclick="WarehouseSystem.goToSell()" class="w-full py-4 bg-[#ff0055] text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_15px_rgba(255,0,85,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                    <i class="fas fa-file-export group-hover:translate-x-1 transition-transform"></i> Export Data to Syndicate
                </button>
            </div>
        `;
    },

    renderInventory() {
        const container = document.getElementById('warehouse-grid');
        if (!container) return;

        container.innerHTML = '';
        const items = Object.keys(GameState.warehouse);
        let isEmpty = true;

        items.forEach(key => {
            const count = GameState.warehouse[key];
            const plantInfo = (window.FarmSystem && FarmSystem.plantData[key]) ? FarmSystem.plantData[key] : { name: key, img: '' };
            const activeClass = "bg-cyan-500/5 border-cyan-500/30 opacity-100 shadow-[inset_0_0_10px_rgba(0,242,255,0.05)]";
            const emptyClass = "bg-black border-white/5 opacity-20 grayscale";

            if (count > 0) isEmpty = false;

            container.innerHTML += `
                <div class="glass p-2 rounded-sm flex flex-col items-center justify-center relative border transition-all aspect-square ${count > 0 ? activeClass : emptyClass}">
                    ${count > 0 ? `<div class="absolute top-1 right-1 bg-cyan-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">x${count}</div>` : ''}
                    <img src="${plantInfo.img}" class="w-8 h-8 object-contain mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                    <span class="text-[6px] font-black text-white uppercase text-center leading-tight tracking-tighter">${plantInfo.name}</span>
                </div>
            `;
        });

        if (this.getTotalItems() === 0) {
            container.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center py-10 opacity-30"><i class="fas fa-folder-open text-4xl text-cyan-900 mb-2"></i><p class="text-[9px] uppercase font-bold text-cyan-700 tracking-widest">Vault Empty</p></div>`;
        }
    },

    goToSell() {
        this.close();
        if(window.UIEngine) {
            UIEngine.navigate('Shop');
            if(window.MarketSystem) MarketSystem.switchTab('sell');
        }
    }
};

window.WarehouseSystem = WarehouseSystem;