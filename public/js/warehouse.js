// js/warehouse.js
const WarehouseSystem = {
    init() {
        // Tidak perlu logika init yang berat, karena data ada di GameState
    },

    show() {
        const modal = document.getElementById('warehouse-modal');
        const container = modal.querySelector('.glass'); // Target konten
        if (!modal || !container) return;

        this.render(container);
        modal.classList.remove('hidden');
    },

    close() {
        document.getElementById('warehouse-modal')?.classList.add('hidden');
    },

    isFull(incomingAmount = 0) {
        // Cek Kapasitas (Ambil dari Config Plan)
        const userPlan = GameState.user.plan || 'FREE';
        const baseLimit = window.PlanConfig[userPlan]?.warehouseLimit || 50;
        const extra = GameState.user.extraStorage || 0;
        const maxLimit = baseLimit + extra;

        // Hitung total item saat ini
        let currentTotal = 0;
        if (GameState.warehouse) {
            Object.values(GameState.warehouse).forEach(qty => currentTotal += qty);
        }

        return (currentTotal + incomingAmount) > maxLimit;
    },

    render(container) {
        // Header
        let html = `
            <div class="flex justify-between items-center mb-4 p-4 border-b border-white/10">
                <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Storage</h2>
                <button onclick="WarehouseSystem.close()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500 transition-all">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto no-scrollbar p-4 grid grid-cols-3 gap-3 content-start">
        `;

        // Loop Data Gudang
        let hasItem = false;
        if (GameState.warehouse) {
            Object.keys(GameState.warehouse).forEach(key => {
                const count = GameState.warehouse[key];
                if (count > 0) {
                    hasItem = true;
                    const herb = window.HerbData[key] || { name: key, img: '' };
                    html += `
                        <div class="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center relative group">
                            <div class="w-10 h-10 mb-2 flex items-center justify-center">
                                <img src="${herb.img}" class="w-full h-full object-contain drop-shadow-md">
                            </div>
                            <span class="text-[8px] font-black text-white uppercase text-center leading-tight mb-1">${herb.name}</span>
                            <div class="bg-white/10 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400">x${count}</div>
                        </div>
                    `;
                }
            });
        }

        if (!hasItem) {
            html += `<div class="col-span-3 text-center py-10 opacity-50 text-[10px] uppercase">Storage Empty</div>`;
        }

        html += `</div>`;
        
        // Footer (Info Kapasitas)
        const userPlan = GameState.user.plan || 'FREE';
        const limit = (window.PlanConfig[userPlan]?.warehouseLimit || 50) + (GameState.user.extraStorage || 0);
        let current = 0;
        if (GameState.warehouse) Object.values(GameState.warehouse).forEach(q => current += q);

        html += `
            <div class="p-4 bg-black/40 border-t border-white/5">
                <div class="flex justify-between text-[9px] mb-1 uppercase font-bold text-gray-400">
                    <span>Capacity</span>
                    <span class="${current >= limit ? 'text-red-500' : 'text-emerald-500'}">${current} / ${limit}</span>
                </div>
                <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full ${current >= limit ? 'bg-red-500' : 'bg-emerald-500'} transition-all" style="width: ${(current/limit)*100}%"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
};
window.WarehouseSystem = WarehouseSystem;
