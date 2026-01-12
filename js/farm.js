// js/farm.js
// Updated Logic: Slot Locking & Gacha Planting
// Rewards & Timers now connected to window.GameConfig via HerbData

const FarmSystem = {
    // Mengambil Data Tanaman yang sudah digabung di herbs.js (Visual + Config)
    plantData: window.HerbData, 
    
    // Konfigurasi Visual Slot
    maxVisibleSlots: 4,

    // DEFINISI TUGAS HARIAN
    // Reward mengambil dari Config agar mudah di-balancing
    dailyTasks: [
        // Tugas Ringan
        { id: 'daily_login', name: 'Daily Login', icon: 'fa-calendar-check', reward: window.GameConfig.Tasks.Login },
        { id: 'visit_farm', name: 'Visit Farm House', icon: 'fa-walking', reward: window.GameConfig.Tasks.Visit },
        { id: 'free_reward', name: 'Free Gift', icon: 'fa-gift', reward: window.GameConfig.Tasks.Gift },
        { id: 'clean_farm', name: 'Clean Farm Area', icon: 'fa-broom', reward: window.GameConfig.Tasks.Clean },

        // Tugas Menengah
        { id: 'water_plants', name: 'Water Plants', icon: 'fa-tint', reward: window.GameConfig.Tasks.Water },
        { id: 'fertilizer', name: 'Add Fertilizer', icon: 'fa-seedling', reward: window.GameConfig.Tasks.Fertilizer },
        { id: 'kill_pests', name: 'Pest Control', icon: 'fa-bug', reward: window.GameConfig.Tasks.Pest },

        // Tugas Utama
        { id: 'harvest_once', name: 'Harvest Crop', icon: 'fa-sickle', reward: window.GameConfig.Tasks.Harvest },
        { id: 'sell_item', name: 'Sell at Market', icon: 'fa-coins', reward: window.GameConfig.Tasks.Sell },

        // Spin (Reward 0 karena hadiah didapat dari putaran roda)
        { id: 'claim_spin', name: 'Free Lucky Spin', icon: 'fa-dharmachakra', reward: 0, action: 'spin' }
    ],
    
    init() {
        // Init Data Farm Plots jika belum ada
        if(!GameState.farmPlots || GameState.farmPlots.length === 0) {
            GameState.farmPlots = Array(12).fill(null).map((_, i) => ({
                id: i + 1, status: 'locked', plant: null, harvestAt: 0 
            }));
        }

        const now = Date.now();
        // LOGIKA OFFLINE GROWTH: Cek tanaman yang sudah selesai saat user offline
        GameState.farmPlots.forEach(plot => {
            if (plot.status === 'growing' && plot.harvestAt > 0) {
                if (now >= plot.harvestAt) {
                    plot.status = 'ready';
                    plot.harvestAt = 0;
                }
            }
        });

        this.renderLayout();
        this.renderFarmGrid(); // Render awal untuk menerapkan status locked/unlocked
        this.startEngine();
        this.startTaskTimer();
    },

    // Menentukan Status Slot berdasarkan Pembelian di Market
    updateSlotStatus() {
        const purchased = GameState.user.landPurchasedCount || 0;
        
        GameState.farmPlots.forEach((plot, index) => {
            // Abaikan plot yang sedang aktif menanam/panen agar tidak mereset tanaman
            if (plot.status === 'growing' || plot.status === 'ready') return;

            // LOGIKA PENGUNCIAN SLOT
            // Index 0 (Slot 1): Selalu Terbuka
            // Index 1 (Slot 2): Terbuka jika purchased >= 1
            // Index 2 (Slot 3): Terbuka jika purchased >= 2
            // Index 3+ (Slot 4+): Terkunci sementara (Plan Future)
            
            if (index === 0) {
                if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
            } 
            else if (index === 1) {
                plot.status = (purchased >= 1) ? 'empty' : 'locked';
            } 
            else if (index === 2) {
                plot.status = (purchased >= 2) ? 'empty' : 'locked';
            } 
            else {
                plot.status = 'disabled';
            }
        });
    },

    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        
        const header = document.createElement('div');
        header.className = "glass p-3 rounded-2xl border border-white/10 mb-3 flex justify-between items-center shrink-0 relative overflow-hidden";
        header.innerHTML = `
            <div class="flex items-center gap-3 w-1/3">
                <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                     <i class="fas fa-tractor text-emerald-400 text-lg animate-bounce"></i>
                </div>
                <div>
                    <h3 class="text-[9px] font-black text-white uppercase tracking-wider leading-tight">${GameState.user.username || 'FARMER'}</h3>
                    <p class="text-[7px] text-emerald-500 font-bold uppercase">FARM HOUSE</p>
                </div>
            </div>
            <div id="target-warehouse-icon" onclick="WarehouseSystem.show()" class="w-1/3 flex justify-center cursor-pointer active:scale-90 transition-transform">
                <div class="relative w-12 h-12 bg-gradient-to-b from-amber-700 to-amber-900 rounded-2xl border-2 border-amber-600 shadow-lg flex items-center justify-center">
                    <i class="fas fa-warehouse text-white text-xl drop-shadow-md"></i>
                    <div class="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 rounded-full border border-white shadow-sm">Check</div>
                </div>
            </div>
            <div class="w-1/3 flex justify-end">
                <button onclick="SpinSystem.show()" class="group flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/50 px-3 py-1.5 rounded-xl hover:bg-indigo-600/40 transition-all active:scale-95">
                    <div class="text-right">
                        <p class="text-[6px] text-indigo-300 font-bold uppercase">Lucky</p>
                        <p class="text-[8px] font-black text-white uppercase">SPIN</p>
                    </div>
                    <i class="fas fa-dharmachakra text-indigo-400 animate-spin-slow group-hover:text-white"></i>
                </button>
            </div>
        `;
        container.appendChild(header);

        const mainArea = document.createElement('div');
        mainArea.className = "flex-1 flex gap-3 min-h-0 overflow-hidden";
        // SIDEBAR TASKS
        const sidebar = document.createElement('div');
        sidebar.id = "task-sidebar";
        sidebar.className = "w-20 flex flex-col gap-2 overflow-y-auto no-scrollbar pb-24 shrink-0 pr-1";
        
        // TOMBOL TANAM KHUSUS (GACHA)
        const plantBtn = document.createElement('button');
        plantBtn.className = "w-full aspect-square glass rounded-2xl flex flex-col items-center justify-center border-emerald-500/20 active:scale-90 transition-all group hover:bg-emerald-500/10 mb-2 border-2 border-dashed border-emerald-500/50";
        plantBtn.innerHTML = `
            <i class="fas fa-seedling text-emerald-500 text-xl mb-1 group-hover:animate-bounce"></i>
            <span class="text-[6px] font-black uppercase text-center leading-tight text-emerald-100">PLANT<br>RANDOM</span>
        `;
        plantBtn.onclick = () => this.plantAll();
        sidebar.appendChild(plantBtn);

        mainArea.appendChild(sidebar);

        const farmContainer = document.createElement('div');
        farmContainer.className = "flex-1 flex flex-col min-h-0";
        farmContainer.innerHTML = `<div id="farm-grid" class="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-32 pr-1 content-start"></div>`;
        mainArea.appendChild(farmContainer);
        container.appendChild(mainArea);
        
        this.renderTaskButtons();
    },

    renderTaskButtons() {
        const sidebar = document.getElementById('task-sidebar');
        if(!sidebar) return;
        // Simpan tombol plant yg sudah ada
        const plantBtn = sidebar.firstElementChild;
        sidebar.innerHTML = '';
        sidebar.appendChild(plantBtn);

        const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
        const now = Date.now();
        
        this.dailyTasks.forEach(task => {
            const lastClaim = cooldowns[task.id] || 0;
            const isCooldown = (now - lastClaim) < 86400000;
            const btn = document.createElement('button');
            let btnClass = "w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg border relative overflow-hidden group ";
            
            if (isCooldown) {
                btnClass += "bg-gray-800/50 border-gray-700 cursor-not-allowed grayscale opacity-70";
                const timeLeft = 86400000 - (now - lastClaim);
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
                btn.innerHTML = `<i class="fas fa-clock text-gray-400 text-xs mb-1"></i><span class="text-[6px] font-black text-gray-500 uppercase">${hours}H LEFT</span>`;
                btn.disabled = true;
            } else {
                btnClass += "glass border-white/10 hover:bg-emerald-500/20 active:scale-90 hover:border-emerald-500/50";
                // Tampilkan reward dinamis dari Config
                const rewardText = task.reward > 0 ? `<br><span class="text-[5px] text-yellow-400">+${task.reward}</span>` : '';
                btn.innerHTML = `<i class="fas ${task.icon} text-emerald-400 text-sm mb-1 group-hover:scale-110 transition-transform"></i><span class="text-[6px] font-black uppercase text-center text-white">${task.name}${rewardText}</span>`;
                btn.onclick = () => this.handleTaskClick(task, btn);
            }
            btn.className = btnClass;
            sidebar.appendChild(btn);
        });
    },

    handleTaskClick(task, btnElement) {
        if (task.action === 'spin') { SpinSystem.show(); return; }
        
        // Iklan Wajib untuk Tugas (Sesuai Ekonomi)
        UIEngine.showRewardPopup(task.name, `Watch Ad to complete "${task.name}"?`, async () => {
             UIEngine.showRewardPopup("ADVERTISEMENT", "Processing Task... 3s", null, "...");
             setTimeout(async () => {
                GameState.user.coins += task.reward;
                const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
                cooldowns[task.id] = Date.now();
                localStorage.setItem('dc_task_cooldowns', JSON.stringify(cooldowns));
                
                if(btnElement) this.playCoinAnimation(btnElement);
                await GameState.save();
                this.renderTaskButtons();
                UIEngine.showRewardPopup("SUCCESS", `Task Done! +${task.reward} PTS`, null, "OK");
             }, 3000);
        }, "WATCH AD");
    },

    // --- LOGIC MENANAM (GACHA SYSTEM) ---
    async plantAll() {
        // Cek apakah ada slot kosong yang unlocked
        this.updateSlotStatus();
        const emptyPlots = GameState.farmPlots.filter(p => p.status === 'empty');
        if (emptyPlots.length === 0) {
            UIEngine.showRewardPopup("FULL", "No empty unlocked plots available.", null, "OK");
            return;
        }

        const buffs = GameState.user.activeBuffs || {};
        let speedMultiplier = 1;
        if (buffs['growth_speed'] && buffs['growth_speed'] > Date.now()) speedMultiplier *= 0.8; // -20%
        if (buffs['speed_soil'] && buffs['speed_soil'] > Date.now()) speedMultiplier *= 0.9; // -10%

        const now = Date.now();
        // GACHA: Tanam bibit random di semua slot kosong
        emptyPlots.forEach(plot => {
            plot.status = 'growing';
            plot.plant = DropEngine.roll(); 
            
            // Waktu tumbuh diambil dari this.plantData yang sekarang adalah window.HerbData (Merged with Config)
            const baseTimeSeconds = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
            const durationMs = Math.ceil(baseTimeSeconds * speedMultiplier) * 1000;
            
            plot.harvestAt = now + durationMs;
        });
        await GameState.save();
        this.renderFarmGrid();
        UIEngine.showRewardPopup("PLANTED", `Planted ${emptyPlots.length} seeds randomly!`, null, "GROW!");
    },

    async harvestAll() {
        let potentialHarvest = 0;
        GameState.farmPlots.forEach(plot => { 
            if (plot.status === 'ready') potentialHarvest++; 
        });
        if (potentialHarvest === 0) return;

        // Cek Gudang
        if (window.WarehouseSystem && WarehouseSystem.isFull(potentialHarvest)) {
            UIEngine.showRewardPopup("STORAGE FULL", "Warehouse is full! Sell items at Market.", () => { 
                WarehouseSystem.show(); 
            }, "OPEN STORAGE");
            return; 
        }

        // Iklan Panen (Revenue Model)
        UIEngine.showRewardPopup(
            "HARVEST READY", 
            `Watch Ad to harvest ${potentialHarvest} crops & Replant?`, 
            () => {
                UIEngine.showRewardPopup("ADVERTISEMENT", "Harvesting... 3s", null, "...");
                let timeLeft = 3;
                const adTimer = setInterval(async () => {
                    timeLeft--;
                    if(timeLeft <= 0) {
                        clearInterval(adTimer);
                        await this.executeHarvestLogic();
                    }
                }, 1000);
            }, 
            "WATCH & HARVEST"
        );
    },

    async executeHarvestLogic() {
        const buffs = GameState.user.activeBuffs || {};
        const hasYieldBuff = (buffs['yield_bonus'] && buffs['yield_bonus'] > Date.now());
        let speedMultiplier = 1;
        if (buffs['growth_speed'] && buffs['growth_speed'] > Date.now()) speedMultiplier *= 0.8;

        let count = 0;
        const now = Date.now();
        GameState.farmPlots.forEach((plot, index) => {
            if (plot.status === 'ready') {
                let yieldAmount = 1;
                // Buff Yield Chance
                if (hasYieldBuff && Math.random() < 0.25) yieldAmount = 2;
                
                const plantName = plot.plant || 'ginger';
                GameState.warehouse[plantName] = (GameState.warehouse[plantName] || 0) + yieldAmount;
                
                if(this.plantData[plantName]) this.playFlyAnimation(this.plantData[plantName].img, index);
                
                // Auto Replant (Gacha Again)
                plot.status = 'growing';
                plot.plant = DropEngine.roll();
                const baseTimeSeconds = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
                const durationMs = Math.ceil(baseTimeSeconds * speedMultiplier) * 1000;
                plot.harvestAt = now + durationMs;
                
                count += yieldAmount;
            }
        });

        if(count > 0) {
            GameState.user.totalHarvest += count;
            await GameState.save();
            this.renderFarmGrid();
            UIEngine.showRewardPopup("HARVEST SUCCESS", `Harvested ${count} items!`, null, "GREAT!");
        }
    },

    startEngine() {
        if(this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            let change = false;
            const now = Date.now();
            GameState.farmPlots.forEach(plot => {
                if (plot.status === 'growing') {
                    if (now >= plot.harvestAt) {
                        plot.status = 'ready';
                        plot.harvestAt = 0;
                        change = true;
                    } else {
                        change = true; 
                    }
                }
            });
            if (change) this.renderFarmGrid();
        }, 1000);
    },

    startTaskTimer() {
        setInterval(() => { this.renderTaskButtons(); }, 60000);
    },

    renderFarmGrid() {
        const grid = document.getElementById('farm-grid');
        if (!grid) return;
        this.updateSlotStatus();
        grid.innerHTML = '';
        const now = Date.now();
        
        // Hanya render 4 slot (Sesuai visual document)
        const displayLimit = this.maxVisibleSlots;
        for (let i = 0; i < displayLimit; i++) {
            const plot = GameState.farmPlots[i];
            let content = '';
            let clickAction = '';
            
            if (plot.status === 'disabled') {
                content = `<div class="h-full w-full bg-black/60 rounded-3xl border border-white/5 flex flex-col items-center justify-center opacity-50"><i class="fas fa-ban text-gray-600"></i><span class="text-[6px] font-black uppercase text-gray-600 mt-1">Soon</span></div>`;
            } 
            else if (plot.status === 'locked') {
                // Harga Slot diambil dari Config (via Market Logic manual atau bisa di inject di sini)
                // Untuk konsistensi visual, kita pakai label statis dulu atau ambil dari config jika mau sangat detail.
                // Disini kita ambil dari Config untuk label
                const price2 = window.GameConfig.ShopItems.LandPrice_2;
                const price3 = window.GameConfig.ShopItems.LandPrice_3;
                let priceLabel = i === 1 ? (price2/1000)+"K PTS" : (price3/1000)+"K PTS"; 

                content = `
                    <div class="h-full w-full bg-[#2d1e18] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center group-hover:border-yellow-500/50 transition-colors">
                        <i class="fas fa-lock text-yellow-500/60 text-lg mb-1"></i>
                        <span class="text-[6px] font-black uppercase text-gray-400">Unlock</span>
                        <div class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[6px] font-black mt-1">${priceLabel}</div>
                    </div>`;
                clickAction = `UIEngine.navigate('Shop'); MarketSystem.switchTab('buy');`; 
            } 
            else if (plot.status === 'empty') {
                content = `<div class="h-full w-full bg-[#5d4037] rounded-3xl border border-white/10 flex items-center justify-center relative"><i class="fas fa-plus absolute text-white/20 text-2xl animate-pulse"></i></div>`;
                clickAction = `FarmSystem.plantAll()`;
            } 
            else if (plot.status === 'growing') {
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                content = `
                    <div class="h-full w-full bg-[#4e342e] rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                        <div class="absolute bottom-0 w-full bg-emerald-500/10 h-[${Math.random()*50}%]"></div>
                        <i class="fas fa-seedling text-emerald-400 text-3xl animate-bounce mb-2 relative z-10"></i>
                        <div class="bg-black/60 px-3 py-1 rounded-full z-10 border border-white/10">
                            <span class="text-[8px] font-mono font-bold text-white">${this.formatTime(remainingSec)}</span>
                        </div>
                    </div>`;
            } 
            else if (plot.status === 'ready') {
                const img = this.plantData[plot.plant]?.img || 'https://img.icons8.com/color/96/question-mark.png';
                content = `
                    <div class="h-full w-full bg-[#5d4037] rounded-3xl border-2 border-emerald-500 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <div class="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                        <img src="${img}" class="w-14 h-14 object-contain drop-shadow-2xl z-10 transform hover:scale-110 transition-transform">
                        <div class="absolute bottom-3 bg-emerald-600 text-white text-[6px] font-black px-3 py-1 rounded-full uppercase shadow-lg z-20 flex items-center gap-1">
                            <i class="fas fa-check"></i> Harvest
                        </div>
                    </div>`;
                clickAction = `FarmSystem.harvestAll()`;
            }

            const div = document.createElement('div');
            div.className = "w-full aspect-square relative active:scale-95 transition-transform duration-200 group"; 
            div.innerHTML = content;
            if (clickAction) div.setAttribute('onclick', clickAction);
            grid.appendChild(div);
        }
    },
    
    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
        const targetEl = document.getElementById('target-warehouse-icon');
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth/2, top: 50, width: 0, height: 0 };
        
        const flyItem = document.createElement('img');
        flyItem.src = imgUrl;
        flyItem.className = "fixed z-[9999] w-10 h-10 object-contain pointer-events-none transition-all duration-700 ease-in-out";
        flyItem.style.left = `${rect.left + rect.width/2}px`;
        flyItem.style.top = `${rect.top + rect.height/2}px`;
        
        document.body.appendChild(flyItem);
        
        setTimeout(() => {
            flyItem.style.left = `${targetRect.left + targetRect.width/2}px`; 
            flyItem.style.top = `${targetRect.top + targetRect.height/2}px`;
            flyItem.style.opacity = "0"; 
            flyItem.style.transform = "scale(0.2)";
        }, 50);
        setTimeout(() => flyItem.remove(), 700);
    },

    playCoinAnimation(startElement) {
        const startRect = startElement.getBoundingClientRect();
        const walletEl = document.getElementById('header-coins'); 
        const targetRect = walletEl ? walletEl.getBoundingClientRect() : { left: window.innerWidth - 50, top: 20 };
        const coin = document.createElement('div');
        coin.className = "fixed z-[9999] w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center shadow-lg transition-all duration-1000 ease-in-out";
        coin.innerHTML = '<i class="fas fa-dollar-sign text-yellow-800 text-xs"></i>';
        coin.style.left = `${startRect.left + startRect.width/2}px`; 
        coin.style.top = `${startRect.top + startRect.height/2}px`;
        
        document.body.appendChild(coin);
        setTimeout(() => { coin.style.left = `${targetRect.left}px`; coin.style.top = `${targetRect.top}px`; coin.style.opacity = "0"; }, 50);
        setTimeout(() => coin.remove(), 1000);
    },

    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};

window.FarmSystem = FarmSystem;