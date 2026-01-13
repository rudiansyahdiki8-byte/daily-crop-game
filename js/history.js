// js/history.js
const HistorySystem = {
    currentFilter: 'all',

    show() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // --- INI KUNCINYA AGAR LANGSUNG TAMPIL ---
            // Saat modal dibuka, kita paksa sistem menekan tombol 'all' secara otomatis
            this.filter('all'); 
        }
    },

    close() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    filter(type) {
        this.currentFilter = type;
        
        // 1. Update Warna Tombol (Biar user tau mana yang aktif)
        this.updateButtonVisuals(type);
        
        // 2. Render Ulang List
        this.render();
    },

    updateButtonVisuals(activeType) {
        // Daftar semua tombol
        const buttons = {
            'all': document.getElementById('btn-filter-all'),
            'in': document.getElementById('btn-filter-in'),
            'out': document.getElementById('btn-filter-out')
        };

        // Style Aktif (Hijau) vs Style Pasif (Abu)
        const activeClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
        const inactiveClass = "bg-white/5 border-white/10 text-gray-400";

        // Loop untuk mereset semua tombol
        for (const key in buttons) {
            const btn = buttons[key];
            if (!btn) continue;

            // Hapus class lama dulu biar bersih
            btn.className = "flex-1 py-2 rounded-xl text-[8px] font-black uppercase transition-all border ";

            if (key === activeType) {
                // Jika ini tombol yang dipilih -> Pakai Style Hijau
                btn.className += activeClass;
            } else {
                // Jika bukan -> Pakai Style Abu
                btn.className += inactiveClass;
            }
        }
    },

    // MENGGABUNGKAN SEMUA DATA JADI SATU
    getAllTransactions() {
        if (!window.GameState || !GameState.user) return [];

        let allTx = [];

        // 1. Ambil History Penjualan (Income)
        if (GameState.user.sales_history) {
            GameState.user.sales_history.forEach(tx => {
                allTx.push({
                    type: 'sell',
                    title: `Sold ${tx.item}`,
                    amount: `+${tx.price}`,
                    date: tx.date, 
                    icon: 'fa-sack-dollar',
                    color: 'text-emerald-400',
                    isIncome: true
                });
            });
        }

        // 2. Ambil History Withdraw (Expense)
        if (GameState.user.history) { 
            GameState.user.history.forEach(tx => {
                allTx.push({
                    type: 'withdraw',
                    title: `Withdraw ${tx.method}`,
                    amount: `-${tx.amount}`,
                    date: tx.date,
                    icon: 'fa-wallet',
                    color: 'text-red-400',
                    isIncome: false
                });
            });
        }

        // 3. Ambil History Pembelian (Expense) - Jika ada
        if (GameState.user.buy_history) {
            GameState.user.buy_history.forEach(tx => {
                allTx.push({
                    type: 'buy',
                    title: `Bought ${tx.item}`,
                    amount: `-${tx.price}`,
                    date: tx.date,
                    icon: 'fa-cart-shopping',
                    color: 'text-yellow-400',
                    isIncome: false
                });
            });
        }

        // Sortir dari yang terbaru (dibalik urutannya)
        return allTx.reverse(); 
    },

    render() {
        const container = document.getElementById('history-list');
        if (!container) return;
        container.innerHTML = '';

        const transactions = this.getAllTransactions();
        let isEmpty = true;

        transactions.forEach(tx => {
            // LOGIKA FILTER:
            // Jika filter 'in' (Income) tapi transaksinya bukan income, lewati.
            if (this.currentFilter === 'in' && !tx.isIncome) return;
            // Jika filter 'out' (Expense) tapi transaksinya income, lewati.
            if (this.currentFilter === 'out' && tx.isIncome) return;

            isEmpty = false;
            
            const html = `
                <div class="glass p-3 rounded-2xl flex items-center justify-between border border-white/5 group hover:bg-white/5 transition-colors animate-in">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
                            <i class="fas ${tx.icon} ${tx.color} text-sm"></i>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-white uppercase">${tx.title}</p>
                            <p class="text-[7px] text-gray-500 font-bold">${tx.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-black ${tx.isIncome ? 'text-emerald-400' : 'text-red-400'}">${tx.amount}</p>
                        <p class="text-[6px] text-gray-600 uppercase">PTS</p>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

        if (isEmpty) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 opacity-40">
                    <i class="fas fa-history text-4xl text-gray-600 mb-2"></i>
                    <p class="text-[9px] font-bold text-gray-500 uppercase">No records found</p>
                </div>`;
        }
    }
};

window.HistorySystem = HistorySystem;