// js/ui.js
// UI Engine: Mengelola Tampilan, Popup, dan Navigasi

const UIEngine = {
    pages: ['Dashboard', 'FarmingHouse', 'Shop', 'SubscibePlan', 'Affiliate'],
    
    // Mapping ID lama ke ID baru (untuk backward compatibility)
    // ID HTML Baru: home-area, farm-area, market-area, task-area, Affiliate
    sectionMap: {
        'Dashboard': 'home-area',
        'FarmingHouse': 'farm-area',
        'Shop': 'market-area',
        'SubscibePlan': 'task-area',
        'Affiliate': 'Affiliate'
    },

    // --- 1. NAVIGASI (Dipanggil Bootstrap & Tombol Bawah) ---
    showScreen(screenId) {
        // Normalisasi ID (jika pakai ID lama, convert ke baru)
        const targetId = this.sectionMap[screenId] || screenId;

        // 1. Sembunyikan semua halaman utama
        const allSections = Object.values(this.sectionMap).concat(['withdraw-area']);
        allSections.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.style.display = 'none';
                el.classList.remove('active-section', 'animate-in');
            }
        });

        // 2. Matikan Popup
        this.closeModals();

        // 3. Tampilkan halaman target
        const target = document.getElementById(targetId);
        if(target) {
            target.style.display = 'flex'; // Sesuaikan layout (flex/block)
            target.classList.add('active-section', 'animate-in');
        }

        // 4. Update Header & Navbar
        this.updateHeader();
        this.updateNavbar(targetId);

        // 5. Trigger Init System (Lazy Load)
        if (targetId === 'farm-area' && window.FarmSystem) FarmSystem.init();
        if (targetId === 'market-area' && window.MarketSystem) MarketSystem.init();
        if (targetId === 'task-area' && window.TaskSystem) TaskSystem.init();
        if (targetId === 'Affiliate' && window.AffiliateSystem) AffiliateSystem.init();
    },

    // Alias untuk navigate (biar tombol lama tetap jalan)
    navigate(pageId) {
        this.showScreen(pageId);
    },

    closeModals() {
        ['warehouse-modal', 'withdraw-modal', 'ency-modal', 'system-popup'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
    },

    // --- 2. UPDATE UI ---
    updateHeader() {
        if (!window.GameState || !window.GameState.user) return;
        const user = GameState.user;
        
        // Header Atas
        const coinEl = document.getElementById('header-coins');
        if (coinEl) coinEl.innerText = Math.floor(user.coins).toLocaleString();

        // Dashboard Home
        const els = {
            'dash-username': user.username,
            'dash-id': user.userId,
            'dash-plan': window.PlanConfig?.[user.plan]?.name || user.plan,
            'dash-harvest': (user.totalHarvest || 0).toLocaleString(),
            'dash-sold': (user.totalSold || 0).toLocaleString()
        };
        for (const [id, val] of Object.entries(els)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }

        // Render Warehouse di Home (jika ada)
        this.renderMiniWarehouse();
    },

    updateNavbar(activeId) {
        // Reset warna tombol
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('text-emerald-500', 'scale-110');
            btn.classList.add('text-gray-500');
        });
        
        // Cari tombol yang onclick-nya mengarah ke ID aktif
        // Kita cari manual berdasarkan urutan atau keyword
        const navMap = {
            'home-area': 0,
            'farm-area': 1,
            'market-area': 2,
            'task-area': 3,
            'Affiliate': 4
        };
        
        const index = navMap[activeId];
        const navBtns = document.querySelectorAll('.nav-item');
        if (navBtns[index]) {
            navBtns[index].classList.remove('text-gray-500');
            navBtns[index].classList.add('text-emerald-500', 'scale-110');
        }
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
                // Ambil gambar dari HerbData (pastikan herbs.js terload)
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

    // --- 3. POPUP SYSTEM ---
    showWarehouse() {
        const modal = document.getElementById('warehouse-modal');
        if (modal) {
            modal.style.display = 'flex';
            if(window.WarehouseSystem) WarehouseSystem.render(); // Pastikan warehouse.js ada
        }
    },

    openWithdraw() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (window.WithdrawSystem) WithdrawSystem.render();
        }
    },

    // ALERT CUSTOM (Pengganti SweetAlert)
    showRewardPopup(title, message, callback, btnText = "OK") {
        const old = document.getElementById('system-popup');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = "system-popup";
        overlay.className = "fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-6 animate-in";
        
        overlay.innerHTML = `
            <div class="glass w-full max-w-xs p-6 rounded-[2rem] border border-white/10 text-center relative overflow-hidden shadow-2xl transform scale-100">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <h3 class="text-xl font-black text-white italic uppercase tracking-wider mb-2">${title}</h3>
                <div class="text-[10px] text-gray-300 font-medium mb-6 leading-relaxed">${message}</div>
                <button id="popup-btn-action" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                    ${btnText}
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('popup-btn-action').onclick = () => {
            overlay.remove();
            if (callback) callback();
        };
    },

    // Helper Modal Teks (Privacy/Terms)
    showTextModal(title, content) {
        this.showRewardPopup(title, `<div class="text-left max-h-60 overflow-y-auto">${content}</div>`, null, "CLOSE");
    },

    showPrivacy() {
        this.showTextModal("Privacy Policy", "Data disimpan aman di server Firebase. Kami tidak membagikan data pribadi.");
    },
    
    showTermsModal() {
        this.showTextModal("Terms of Use", "Dilarang curang / menggunakan bot. Pelanggaran = Ban Permanen.");
    }
};

window.UIEngine = UIEngine;
