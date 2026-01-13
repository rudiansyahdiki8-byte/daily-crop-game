// js/farm.js
const FarmSystem = {
    plantData: window.HerbData, 
    maxVisibleSlots: 4,
    isTaskMenuOpen: false,

    // DEFINISI TUGAS HARIAN
    dailyTasks: [
        { id: 'daily_login', name: 'Login', icon: 'fa-calendar-check', reward: window.GameConfig.Tasks.Login },
        { id: 'visit_farm', name: 'Visit', icon: 'fa-walking', reward: window.GameConfig.Tasks.Visit },
        { id: 'free_reward', name: 'Gift', icon: 'fa-gift', reward: window.GameConfig.Tasks.Gift },
        { id: 'clean_farm', name: 'Clean', icon: 'fa-broom', reward: window.GameConfig.Tasks.Clean },
        { id: 'water_plants', name: 'Water', icon: 'fa-tint', reward: window.GameConfig.Tasks.Water },
        { id: 'fertilizer', name: 'Fertilize', icon: 'fa-seedling', reward: window.GameConfig.Tasks.Fertilizer },
        { id: 'kill_pests', name: 'Pest', icon: 'fa-bug', reward: window.GameConfig.Tasks.Pest },
        { id: 'harvest_once', name: 'Harvest', icon: 'fa-sickle', reward: window.GameConfig.Tasks.Harvest },
        { id: 'sell_item', name: 'Sell', icon: 'fa-coins', reward: window.GameConfig.Tasks.Sell },
        { id: 'claim_spin', name: 'Spin', icon: 'fa-dharmachakra', reward: 0, action: 'spin' }
    ],
    
    init() {
        if(!GameState.farmPlots || GameState.farmPlots.length === 0) {
            GameState.farmPlots = Array(12).fill(null).map((_, i) => ({
                id: i + 1, status: 'locked', plant: null, harvestAt: 0 
            }));
        }

        // Logic Offline Growth
        const now = Date.now();
        GameState.farmPlots.forEach(plot => {
            if (plot.status === 'growing' && plot.harvestAt > 0) {
                if (now >= plot.harvestAt) {
                    plot.status = 'ready';
                    plot.harvestAt = 0;
                }
            }
        });

        this.renderLayout();
        this.renderFarmGrid(); 
        this.startEngine();
        this.startTaskTimer();
    },

    updateSlotStatus() {
        const purchased = GameState.user.landPurchasedCount || 0;
        GameState.farmPlots.forEach((plot, index) => {
            if (plot.status === 'growing' || plot.status === 'ready') return;
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

    // --- RENDER LAYOUT BARU (POIN 3 & 4) ---
    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        container.className = "h-full relative overflow-hidden flex flex-col";
        
        // 1. HEADER BARU (Dengan Tombol Spin Bulat)
        // Cek status Free Spin untuk efek glow
        const isSpinReady = (Date.now() - (GameState.user.spin_free_cooldown || 0)) > window.GameConfig.Spin.CooldownFree;
        const spinClass = isSpinReady ? "spin-ready" : "bg-gray-800 border-gray-600 grayscale opacity-80";

        const header = document.createElement('div');
        header.className = "p-4 flex justify-between items-start z-20 shrink-0";
        header.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <i class="fas fa-user-astronaut text-emerald-400 text-xs"></i>
                    <span class="text-[9px] font-black text-white uppercase">${GameState.user.username}</span>
                </div>
                <div onclick="WarehouseSystem.show()" class="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer">
                    <i class="fas fa-warehouse text-amber-400 text-xs"></i>
                    <span class="text-[8px] font-bold text-gray-300 uppercase">Storage</span>
                </div>
            </div>

            <div onclick="SpinSystem.show()" class="spin-orb ${spinClass} active:scale-90 cursor-pointer">
                <i class="fas fa-dharmachakra text-white text-2xl animate-[spin-slow_5s_linear_infinite]"></i>
            </div>
        `;
        container.appendChild(header);

        // 2. FARM GRID AREA
        const farmContainer = document.createElement('div');
        farmContainer.className = "flex-1 overflow-y-auto no-scrollbar pb-32 px-4 content-start";
        farmContainer.innerHTML = `<div id="farm-grid" class="grid grid-cols-2 gap-x-4 gap-y-6 pt-4"></div>`;
        container.appendChild(farmContainer);

        // 3. FLOATING MENU (TASK BUBBLE - POIN 3)
        const fabContainer = document.createElement('div');
        fabContainer.className = "fab-menu";
        fabContainer.innerHTML = `
            <button onclick="FarmSystem.toggleTaskMenu()" class="fab-btn bg-emerald-500 text-white border border-emerald-400 relative z-50">
                <i id="fab-icon" class="fas fa-tasks text-lg"></i>
                <div id="task-notification" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white hidden"></div>
            </button>
            <div id="task-list-content" class="fab-content w-48 flex flex-col gap-2">
                </div>
        `;
        container.appendChild(fabContainer);
        
        // Render isi tasks
        this.renderTaskButtons();
    },

    toggleTaskMenu() {
        const content = document.getElementById('task-list-content');
        const icon = document.getElementById('fab-icon');
        this.isTaskMenuOpen = !this.isTaskMenuOpen;
        
        if(this.isTaskMenuOpen) {
            content.classList.add('open');
            icon.className = "fas fa-times text-lg";
        } else {
            content.classList.remove('open');
            icon.className = "fas fa-tasks text-lg";
        }
    },

    renderTaskButtons() {
        const listContent = document.getElementById('task-list-content');
        if(!listContent) return;
        
        listContent.innerHTML = '';

        // Tombol Plant Random (Spesial di dalam menu)
        const plantBtn = document.createElement('button');
        plantBtn.className = "w-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-xl p-2 flex items-center gap-3 transition-all active:scale-95";
        plantBtn.innerHTML = `<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><i class="fas fa-seedling text-xs"></i></div><span class="text-[9px] font-black uppercase text-white">Plant Random</span>`;
        plantBtn.onclick = () => { this.toggleTaskMenu(); this.plantAll(); };
        listContent.appendChild(plantBtn);

        const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
        const now = Date.now();
        let readyCount = 0;

        this.dailyTasks.forEach(task => {
            const lastClaim = cooldowns[task.id] || 0;
            const isCooldown = (now - lastClaim) < 86400000;
            
            if (!isCooldown) readyCount++;

            const btn = document.createElement('button');
            btn.className = `w-full rounded-xl p-2 flex items-center gap-3 transition-all active:scale-95 border ${isCooldown ? 'bg-gray-800/50 border-gray-700 opacity-50 grayscale cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10'}`;
            
            let statusHTML = '';
            if (isCooldown) {
                const timeLeft = 86400000 - (now - lastClaim);
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
                statusHTML = `<span class="text-[8px] text-gray-500 font-bold ml-auto">${hours}H</span>`;
            } else {
                statusHTML = task.reward > 0 ? `<span class="text-[8px] text-yellow-400 font-black ml-auto">+${task.reward}</span>` : `<i class="fas fa-chevron-right text-[8px] text-gray-400 ml-auto"></i>`;
            }

            btn.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-gray-300 border border-white/5">
                    <i class="fas ${task.icon} text-xs"></i>
                </div>
                <span class="text-[9px] font-bold uppercase text-gray-300 text-left flex-1">${task.name}</span>
                ${statusHTML}
            `;
            
            if(!isCooldown) {
                btn.onclick = () => this.handleTaskClick(task, btn);
            }
            listContent.appendChild(btn);
        });

        // Update dot notifikasi
        const notifDot = document.getElementById('task-notification');
        if(notifDot) notifDot.style.display = readyCount > 0 ? 'block' : 'none';
    },

    handleTaskClick(task, btnElement) {
        if (task.action === 'spin') { SpinSystem.show(); return; }
        
        // Langsung Jalankan Iklan (Tanpa Konfirmasi Awal - Poin 20 style)
        UIEngine.showRewardPopup("ADVERTISEMENT", `Completing ${task.name}...`, null, "...");
        setTimeout(async () => {
            GameState.user.coins += task.reward;
            const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
            cooldowns[task.id] = Date.now();
            localStorage.setItem('dc_task_cooldowns', JSON.stringify(cooldowns));
            
            if(btnElement) this.playCoinAnimation(btnElement);
            await GameState.save();
            this.renderTaskButtons();
            UIEngine.showRewardPopup("SUCCESS", `Task Done! +${task.reward} PTS`, null, "OK");
        }, 3000); // Simulasi durasi iklan 3 detik
    },

    async plantAll() {
        this.updateSlotStatus();
        const emptyPlots = GameState.farmPlots.filter(p => p.status === 'empty');
        if (emptyPlots.length === 0) {
            UIEngine.showRewardPopup("FULL", "No empty unlocked plots available.", null, "OK");
            return;
        }

        const buffs = GameState.user.activeBuffs || {};
        let speedMultiplier = 1;
        if (buffs['growth_speed'] && buffs['growth_speed'] > Date.now()) speedMultiplier *= 0.8; 
        if (buffs['speed_soil'] && buffs['speed_soil'] > Date.now()) speedMultiplier *= 0.9;

        const now = Date.now();
        emptyPlots.forEach(plot => {
            plot.status = 'growing';
            plot.plant = DropEngine.roll(); 
            
            const baseTimeSeconds = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
            const durationMs = Math.ceil(baseTimeSeconds * speedMultiplier) * 1000;
            plot.harvestAt = now + durationMs;
        });
        await GameState.save();
        this.renderFarmGrid();
        UIEngine.showRewardPopup("PLANTED", `Planted ${emptyPlots.length} seeds randomly!`, null, "GROW!");
    },

    // --- LOGIC PANEN BARU (POIN 5 & 20) ---
    async harvestAll(specificIndex = null) {
        // Logika untuk panen satuan (karena tombolnya per pot sekarang)
        let plotsToHarvest = [];
        
        if (specificIndex !== null) {
            const plot = GameState.farmPlots[specificIndex];
            if (plot.status === 'ready') plotsToHarvest.push(plot);
        } else {
            // Fallback harvest all
            plotsToHarvest = GameState.farmPlots.filter(p => p.status === 'ready');
        }

        if (plotsToHarvest.length === 0) return;

        // Cek Gudang
        if (window.WarehouseSystem && WarehouseSystem.isFull(plotsToHarvest.length)) {
            UIEngine.showRewardPopup("FULL", "Storage Full! Sell items first.", () => WarehouseSystem.show(), "OPEN");
            return; 
        }

        // --- DIRECT AD FLOW (POIN 20) ---
        // Tanpa popup konfirmasi, langsung "Watching Ad..."
        UIEngine.showRewardPopup("ADVERTISEMENT", "Harvesting Crops... 3s", null, "...");
        
        // Simulasi Iklan
        setTimeout(async () => {
            await this.executeHarvestLogic(plotsToHarvest);
        }, 3000);
    },

    async executeHarvestLogic(plots) {
        const buffs = GameState.user.activeBuffs || {};
        const hasYieldBuff = (buffs['yield_bonus'] && buffs['yield_bonus'] > Date.now());
        let speedMultiplier = 1;
        if (buffs['growth_speed'] && buffs['growth_speed'] > Date.now()) speedMultiplier *= 0.8;

        let count = 0;
        const now = Date.now();
        
        plots.forEach(plot => {
            let yieldAmount = 1;
            if (hasYieldBuff && Math.random() < 0.25) yieldAmount = 2;
            
            const plantName = plot.plant || 'ginger';
            GameState.warehouse[plantName] = (GameState.warehouse[plantName] || 0) + yieldAmount;
            
            // Animasi Terbang (Visual Poin 5)
            // Cari index plot di array asli untuk animasi
            const originalIndex = GameState.farmPlots.indexOf(plot);
            if(this.plantData[plantName]) this.playFlyAnimation(this.plantData[plantName].img, originalIndex);
            
            // Auto Replant
            plot.status = 'growing';
            plot.plant = DropEngine.roll();
            const baseTimeSeconds = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
            const durationMs = Math.ceil(baseTimeSeconds * speedMultiplier) * 1000;
            plot.harvestAt = now + durationMs;
            
            count += yieldAmount;
        });

        GameState.user.totalHarvest += count;
        await GameState.save();
        this.renderFarmGrid();
        
        // Popup Sukses setelah iklan selesai
        UIEngine.showRewardPopup("HARVEST SUCCESS", `Harvested ${count} items & Replanted!`, null, "GREAT");
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
                        change = true; // Update timer visual
                    }
                }
            });
            if (change) this.renderFarmGrid();
        }, 1000);
    },

    startTaskTimer() {
        setInterval(() => { this.renderTaskButtons(); }, 60000);
    },

    // --- VISUAL GRID POT (POIN 5) ---
    renderFarmGrid() {
        const grid = document.getElementById('farm-grid');
        if (!grid) return;
        this.updateSlotStatus();
        grid.innerHTML = '';
        const now = Date.now();
        
        const displayLimit = this.maxVisibleSlots;
        for (let i = 0; i < displayLimit; i++) {
            const plot = GameState.farmPlots[i];
            let content = '';
            let clickAction = '';
            
            // Base Class untuk Pot
            const potClass = "pot-container w-full aspect-[4/5] flex flex-col items-center justify-end pb-2 overflow-visible relative transition-transform active:scale-95";

            if (plot.status === 'disabled') {
                content = `
                    <div class="pot-rim"></div>
                    <div class="opacity-30 flex flex-col items-center mb-4">
                        <i class="fas fa-ban text-white text-2xl"></i>
                        <span class="text-[8px] font-black uppercase text-gray-400 mt-1">Locked</span>
                    </div>`;
            } 
            else if (plot.status === 'locked') {
                const price2 = window.GameConfig.ShopItems.LandPrice_2;
                const price3 = window.GameConfig.ShopItems.LandPrice_3;
                let priceLabel = i === 1 ? (price2/1000)+"K" : (price3/1000)+"K";
                
                content = `
                    <div class="pot-rim"></div>
                    <div class="flex flex-col items-center mb-4">
                        <i class="fas fa-lock text-yellow-500 text-xl mb-1 animate-pulse"></i>
                        <div class="bg-yellow-500 text-black px-2 py-0.5 rounded text-[8px] font-black">${priceLabel}</div>
                    </div>`;
                clickAction = `UIEngine.navigate('Shop'); MarketSystem.switchTab('buy');`; 
            } 
            else if (plot.status === 'empty') {
                content = `
                    <div class="pot-rim"></div>
                    <div class="absolute -top-6 text-white/20 text-4xl animate-bounce"><i class="fas fa-arrow-down"></i></div>
                    <div class="mb-6 opacity-50"><i class="fas fa-plus-circle text-3xl text-white"></i></div>
                `;
                clickAction = `FarmSystem.plantAll()`;
            } 
            else if (plot.status === 'growing') {
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                
                // Ambil durasi total tanaman (default 180 detik jika error)
                const baseTime = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
                
                let growthImage = '';

                // --- LOGIKA 2 TAHAP ---
                
                // TAHAP 1: KECAMBAH (BULB) - Jika sisa waktu masih di atas 50%
                if (remainingSec > (baseTime / 2)) {
                     growthImage = `<img src="https://img.icons8.com/external-filled-color-icons-papa-vector/78/external-Flower-Bulbs-gardening-store-categories-filled-color-icons-papa-vector.png" 
                        class="w-50 h-50 object-contain absolute bottom-8 left-1/2 -translate-x-1/2 drop-shadow-lg animate-pulse" 
                        style="filter: brightness(0.9);">`;
                } 
                // TAHAP 2: TUNAS (SPROUT) - Jika sisa waktu sudah di bawah 50%
                else {
                     growthImage = `<img src="https://img.icons8.com/bubbles/100/sprout.png" 
                        class="w-50 h-50 object-contain absolute bottom-8 center -translate-x-1/2 drop-shadow-lg animate-bounce">`;
                }

                // Masukkan ke dalam Pot
                content = `
                    <div class="pot-rim"></div>
                    ${growthImage}
                    <div class="absolute bottom-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-white border border-white/10 z-10">
                        ${this.formatTime(remainingSec)}
                    </div>`;
            }   
            else if (plot.status === 'ready') {
                const img = this.plantData[plot.plant]?.img || 'https://img.icons8.com/color/96/question-mark.png';
                // Tanaman Siap Panen (Bubble)
                content = `
                    
                    <div class="harvest-bubble absolute -top-4 w-20 h-20 bg-white rounded-full border-2 border-emerald-500 shadow-[0_0_20px_#10b981] flex items-center justify-center z-20 overflow-hidden group">
                        <div class="absolute inset-0 bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src="${img}" class="w-10 h-10 object-contain relative z-10">
                        <div class="absolute bottom-0 right-0 bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-tl-lg z-20"><i class="fas fa-ad"></i></div>
                    </div>
                `;
                // Klik Pot Langsung Panen (Specific Index)
                clickAction = `FarmSystem.harvestAll(${i})`;
            }

            const div = document.createElement('div');
            div.className = potClass; 
            div.innerHTML = content;
            if (clickAction) div.setAttribute('onclick', clickAction);
            grid.appendChild(div);
        }
    },
    
    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
        // Target ke tombol Storage di Header
        const targetEl = document.querySelector('.fa-warehouse'); 
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth/2, top: 0 };
        
        const flyItem = document.createElement('img');
        flyItem.src = imgUrl;
        flyItem.className = "fixed z-[9999] w-12 h-12 object-contain pointer-events-none transition-all duration-1000 ease-in-out";
        flyItem.style.left = `${rect.left + rect.width/2 - 24}px`;
        flyItem.style.top = `${rect.top}px`; // Muncul dari atas pot
        
        document.body.appendChild(flyItem);
        
        setTimeout(() => {
            flyItem.style.left = `${targetRect.left}px`; 
            flyItem.style.top = `${targetRect.top}px`;
            flyItem.style.opacity = "0"; 
            flyItem.style.transform = "scale(0.1)";
        }, 50);
        setTimeout(() => flyItem.remove(), 1000);
    },

    playCoinAnimation(startElement) {
        // ... (Fungsi lama, tetap digunakan)
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
