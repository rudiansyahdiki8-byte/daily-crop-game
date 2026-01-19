// js/farm.js
// FRONTEND FARM SYSTEM (CONNECTED TO VERCEL API)

const FarmSystem = {
    // Helper: Ambil data tanaman dari Config
    get plantData() {
        return window.GameConfig && window.GameConfig.Crops ? window.GameConfig.Crops : {};
    },
    
    maxVisibleSlots: 4,
    isTaskMenuOpen: false,
    interval: null,

    // Tugas Harian
    get dailyTasks() {
        const tasks = window.GameConfig?.Tasks || {};
        return [
            { id: 'daily_login', name: 'Login', icon: 'fa-calendar-check', reward: tasks.Login || 100 },
            { id: 'visit_farm', name: 'Visit', icon: 'fa-walking', reward: tasks.Visit || 50 },
            { id: 'free_reward', name: 'Gift', icon: 'fa-gift', reward: tasks.Gift || 50 },
            { id: 'clean_farm', name: 'Clean', icon: 'fa-broom', reward: tasks.Clean || 50 },
            { id: 'water_plants', name: 'Water', icon: 'fa-tint', reward: tasks.Water || 50 },
            { id: 'fertilizer', name: 'Fertilize', icon: 'fa-seedling', reward: tasks.Fertilizer || 50 },
            { id: 'kill_pests', name: 'Pest', icon: 'fa-bug', reward: tasks.Pest || 50 },
            { id: 'harvest_once', name: 'Harvest', icon: 'fa-sickle', reward: tasks.Harvest || 100 },
            { id: 'sell_item', name: 'Sell', icon: 'fa-coins', reward: tasks.Sell || 100 },
            { id: 'claim_spin', name: 'Spin', icon: 'fa-dharmachakra', reward: 0, action: 'spin' }
        ];
    },
    
    init() {
        this.renderLayout();
        this.renderFarmGrid(); 
        this.startEngine();
        this.startTaskTimer();
    },

    updateSlotStatus() {
        const purchased = GameState.user.landPurchasedCount || 0;
        if (!GameState.farmPlots) GameState.farmPlots = [];

        GameState.farmPlots.forEach((plot, index) => {
            if (plot.status === 'growing' || plot.status === 'ready') return;
            
            if (index === 0) {
                if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
            } 
            else if (index === 1) plot.status = (purchased >= 1) ? 'empty' : 'locked';
            else if (index === 2) plot.status = (purchased >= 2) ? 'empty' : 'locked';
            else plot.status = 'disabled'; 
        });
    },

    // --- RENDER LAYOUT UTAMA ---
    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        container.className = "h-full w-full relative overflow-hidden bg-transparent";

        const isSpinReady = (Date.now() - (GameState.user.spin_free_cooldown || 0)) > (window.GameConfig?.Spin?.CooldownFree || 3600000);

        // HEADER
        const header = document.createElement('div');
        header.className = "absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50 pointer-events-none";
        header.innerHTML = `
            <div class="pointer-events-auto glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 bg-black/40 backdrop-blur-md shadow-lg">
                <i class="fas fa-user-astronaut text-emerald-400 text-xs"></i>
                <span class="text-[10px] font-black text-white uppercase tracking-wider">${GameState.user.username}</span>
            </div>
            <div onclick="SpinSystem.show()" class="pointer-events-auto spin-orb ${isSpinReady ? "spin-ready" : "bg-gray-800 border-gray-600 grayscale opacity-80"} active:scale-90 cursor-pointer shadow-2xl">
                <i class="fas fa-dharmachakra text-white text-2xl animate-[spin-slow_5s_linear_infinite]"></i>
            </div>
        `;
        container.appendChild(header);

        // LEFT MENU
        const leftMenu = document.createElement('div');
        leftMenu.className = "hud-left pointer-events-auto";
        leftMenu.innerHTML = `
            <div onclick="WarehouseSystem.show()" class="btn-diamond group">
                <div class="btn-content-rotate">
                    <i class="fas fa-warehouse text-amber-400 text-xl group-active:text-white drop-shadow-md"></i>
                    <span class="text-[7px] font-bold text-gray-300 uppercase mt-1">Storage</span>
                </div>
            </div>
            <div onclick="UIEngine.navigate('Shop')" class="btn-diamond group border-blue-500">
                <div class="btn-content-rotate">
                    <i class="fas fa-store text-blue-400 text-xl group-active:text-white drop-shadow-md"></i>
                    <span class="text-[7px] font-bold text-gray-300 uppercase mt-1">Market</span>
                </div>
            </div>
        `;
        container.appendChild(leftMenu);

        // FARM AREA
        const farmContainer = document.createElement('div');
        farmContainer.className = "w-full h-full overflow-y-auto no-scrollbar relative z-10";
        farmContainer.innerHTML = `
            <div class="w-full flex justify-center mt-2 mb-[-40px] pt-20 relative z-0 pointer-events-none translate-x-4">
                <img src="assets_iso/farm_house.png" class="w-72 drop-shadow-2xl animate-in fade-in" onerror="this.style.display='none'"> 
            </div>
            <div id="farm-grid" class="pt-4 pb-40 pl-6"></div> 
        `;
        container.appendChild(farmContainer);

        // TASK MENU
        const fabContainer = document.createElement('div');
        fabContainer.className = "fab-menu";
        fabContainer.innerHTML = `
            <button onclick="FarmSystem.toggleTaskMenu()" class="fab-btn bg-white/90 backdrop-blur border border-emerald-400 relative z-50 shadow-lg">
                <div id="fab-icon-container" class="flex items-center justify-center w-full h-full">
                    <img src="https://img.icons8.com/plasticine/100/task.png" class="w-8 h-8 object-contain"/>
                </div>
                <div id="task-notification" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white hidden"></div>
            </button>
            <div id="task-list-content" class="fab-content w-48 flex flex-col gap-2 shadow-2xl"></div>
        `;
        container.appendChild(fabContainer);
        this.renderTaskButtons();
    },
    
    toggleTaskMenu() {
        const content = document.getElementById('task-list-content');
        this.isTaskMenuOpen = !this.isTaskMenuOpen;
        if(content) content.classList.toggle('open', this.isTaskMenuOpen);
    },

    // --- LOGIC TANAM ---
    async plantAll() {
        this.updateSlotStatus();
        const emptyIndices = [];
        GameState.farmPlots.forEach((p, i) => { if (p.status === 'empty') emptyIndices.push(i); });

        if (emptyIndices.length === 0) {
            UIEngine.showRewardPopup("FULL", "No empty unlocked plots.", null, "OK");
            return;
        }

        this.toggleTaskMenu(); 
        UIEngine.showRewardPopup("PLANTING", "Planting seeds...", null, "WAIT");

        let successCount = 0;
        for (const idx of emptyIndices) {
            try {
                const response = await fetch('/api/farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: GameState.user.userId, action: 'plant', plotIndex: idx })
                });
                const result = await response.json();
                
                if (result.success) {
                    GameState.farmPlots = result.farmPlots;
                    successCount++;
                } else {
                    // Jika ada error spesifik dari server
                    console.error("Plant Fail:", result.error);
                }
            } catch (e) {
                console.error("Plant Error:", e);
                // Jangan popup dulu biar loop lanjut, nanti cek successCount
            }
        }

        if (successCount > 0) {
            await GameState.save();
            this.renderFarmGrid();
            UIEngine.showRewardPopup("PLANTED", `Planted ${successCount} seeds!`, null, "GROW!");
        } else {
            // Jika gagal total, beri tahu user
            UIEngine.showRewardPopup("ERROR", "Failed to plant. Check internet or config!", null, "RETRY");
        }
    },

    // --- LOGIC PANEN (DIPERBAIKI) ---
    async harvestAll(specificIndex = null) {
        let readyIndices = [];
        if (specificIndex !== null) {
            if (GameState.farmPlots[specificIndex].status === 'ready') readyIndices.push(specificIndex);
        } else {
            GameState.farmPlots.forEach((p, i) => { if (p.status === 'ready') readyIndices.push(i); });
        }

        if (readyIndices.length === 0) return;

        // Cek Gudang
        if (window.WarehouseSystem && WarehouseSystem.isFull(readyIndices.length)) {
            UIEngine.showRewardPopup("FULL", "Storage Full! Sell items first.", () => WarehouseSystem.show(), "OPEN");
            return; 
        }

        // Cek AdsManager (Anti Macet)
        if (window.AdsManager && typeof AdsManager.showHybridStack === 'function') {
            AdsManager.showHybridStack(2, async () => {
                await this.executeHarvestAPI(readyIndices);
            });
        } else {
            // Fallback aman jika AdsManager belum siap (Langsung Panen)
            console.warn("AdsManager missing, skipping ad.");
            await this.executeHarvestAPI(readyIndices);
        }
    },

    async executeHarvestAPI(indices) {
        UIEngine.showRewardPopup("HARVESTING", "Collecting crops...", null, "WAIT");

        let success = false;
        let errorMsg = "";

        for (const idx of indices) {
            try {
                // Animasi visual
                const plot = GameState.farmPlots[idx];
                const plantName = plot.plant || 'ginger';
                this.playFlyAnimation(`assets_iso/plant_${plantName.toLowerCase()}.png`, idx);

                // Panggil API
                const response = await fetch('/api/farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: GameState.user.userId, action: 'harvest', plotIndex: idx })
                });
                
                // Cek status HTTP (misal 500 Server Error)
                if (!response.ok) {
                    throw new Error(`Server Error (${response.status})`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    GameState.farmPlots = result.farmPlots; 
                    GameState.warehouse = result.warehouse;
                    GameState.user = result.user; 
                    success = true;
                } else {
                    throw new Error(result.error || "Unknown API Error");
                }
            } catch (e) {
                console.error("Harvest Failed:", e);
                errorMsg = e.message;
                // Stop loop jika error, agar user tahu ada masalah
                break; 
            }
        }

        if(success) {
            this.renderFarmGrid();
            if(window.UIEngine) UIEngine.updateHeader(); 
            UIEngine.showRewardPopup("HARVEST COMPLETE", `Collected & Auto-Replanted!`, null, "AWESOME");
        } else {
            // TAMPILKAN ERROR JIKA GAGAL (PENTING!)
            UIEngine.showRewardPopup("ERROR", `Harvest Failed: ${errorMsg}. Check api/gameConfig.js!`, null, "FIX");
        }
    },

    // --- ENGINE & TIMER ---
    startEngine() {
        if(this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            let change = false;
            const now = Date.now();
            if(GameState.farmPlots) {
                GameState.farmPlots.forEach(plot => {
                    if (plot.status === 'growing') {
                        if (now >= plot.harvestAt) {
                            plot.status = 'ready';
                            plot.harvestAt = 0;
                            change = true;
                        } else change = true;
                    }
                });
            }
            if (change) this.renderFarmGrid();
        }, 1000);
    },

    startTaskTimer() { setInterval(() => { this.renderTaskButtons(); }, 60000); },

    // --- RENDER GRID ---
    renderFarmGrid() {
        const grid = document.getElementById('farm-grid');
        if (!grid) return;
        this.updateSlotStatus();
        grid.innerHTML = '';
        
        const plots = GameState.farmPlots || [];
        for (let i = 0; i < this.maxVisibleSlots; i++) {
            const plot = plots[i];
            if(!plot) continue; // Safety check

            const div = document.createElement('div');
            div.className = 'plot-container';

            let landImg = (plot.status === 'locked') ? 'assets_iso/land_locked.png' : 'assets_iso/land_empty.png';
            let contentOverlay = '';
            let clickAction = () => {};

            // 1. LOCKED
            if (plot.status === 'locked') {
                const price2 = window.GameConfig?.ShopItems?.land_2 || 5000;
                let priceLabel = i === 1 ? (price2/1000)+"K" : "10K";
                contentOverlay = `<div class="iso-ui"><div class="bg-black/80 text-yellow-400 px-2 py-1 rounded-lg text-[10px] font-black border border-yellow-500/50"><i class="fas fa-lock text-[8px] mr-1"></i>${priceLabel}</div></div>`;
                clickAction = () => { if(window.UIEngine) UIEngine.navigate('Shop'); if(window.MarketSystem) MarketSystem.switchTab('buy'); };
            } 
            // 2. EMPTY
            else if (plot.status === 'empty') {
                contentOverlay = `<div class="iso-ui animate-bounce" style="bottom: 50%;"><i class="fas fa-plus-circle text-4xl text-white/60 hover:text-white drop-shadow-md"></i></div>`;
                clickAction = () => { this.plantAll(); };
            } 
            // 3. GROWING
            else if (plot.status === 'growing') {
                const now = Date.now();
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                const plantKey = plot.plant || 'ginger';
                const plantConfig = this.plantData[plantKey] || { time: 180 };
                let stageImg = (remainingSec > (plantConfig.time * 0.7)) ? 'assets_iso/stage_sprout.png' : 'assets_iso/stage_growing.png';
                contentOverlay = `<img src="${stageImg}" class="iso-plant plant-anim"><div class="absolute top-[-10px] bg-black/70 text-white text-[10px] px-2 py-1 rounded-full z-30 font-bold border border-white/20">⏳ ${this.formatTime(remainingSec)}</div>`;
            }   
            // 4. READY
            else if (plot.status === 'ready') {
                const plantName = plot.plant ? plot.plant.toLowerCase() : 'ginger';
                const plantSource = this.plantData[plot.plant]?.img || `assets_iso/plant_${plantName}.png`;
                contentOverlay = `
                    <img src="${plantSource}" class="iso-plant drop-shadow-lg" onerror="this.src='assets_iso/stage_growing.png'"> 
                    <div class="absolute top-[-35px] z-50 bg-white border-4 border-emerald-500 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl animate-bounce cursor-pointer">
                        <img src="${plantSource}" class="w-10 h-10 object-contain drop-shadow-md">
                        <div class="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm"><i class="fas fa-sickle text-[10px]"></i></div>
                    </div>`;
                clickAction = () => { this.harvestAll(i); };
            }

            div.innerHTML = `<img src="${landImg}" class="iso-land">${contentOverlay}`;
            div.onclick = clickAction;
            grid.appendChild(div);
        }
    },

    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
        // Target ke icon storage
        const targetEl = document.querySelector('.fa-warehouse'); 
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth/2, top: 0 };
        
        const flyItem = document.createElement('img');
        flyItem.src = imgUrl;
        flyItem.onerror = function() { this.src = 'assets_iso/stage_growing.png'; }; 
        flyItem.className = "fixed z-[9999] w-12 h-12 object-contain pointer-events-none transition-all duration-1000 ease-in-out";
        flyItem.style.left = `${rect.left + rect.width/2 - 24}px`;
        flyItem.style.top = `${rect.top}px`; 
        
        document.body.appendChild(flyItem);
        setTimeout(() => {
            flyItem.style.left = `${targetRect.left}px`; 
            flyItem.style.top = `${targetRect.top}px`;
            flyItem.style.opacity = "0"; 
            flyItem.style.transform = "scale(0.1)";
        }, 50);
        setTimeout(() => flyItem.remove(), 1000);
    },
    
    renderTaskButtons() {
        const listContent = document.getElementById('task-list-content');
        if(!listContent) return;
        listContent.innerHTML = '';

        // Tombol Plant
        const plantBtn = document.createElement('button');
        plantBtn.className = "w-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-xl py-1 px-2 flex items-center gap-3 transition-all active:scale-95";
        plantBtn.innerHTML = `<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><i class="fas fa-seedling text-xs"></i></div><span class="text-[9px] font-black uppercase text-white">Plant Random</span>`;
        plantBtn.onclick = () => { this.plantAll(); };
        listContent.appendChild(plantBtn);

        // List Task
        const cooldowns = GameState.user.task_cooldowns || {};
        const now = Date.now();
        let readyCount = 0;

        this.dailyTasks.forEach(task => {
            const lastClaim = cooldowns[task.id] || 0;
            const isCooldown = (now - lastClaim) < 86400000;
            if (!isCooldown) readyCount++;

            const btn = document.createElement('button');
            const styleClass = isCooldown ? 
                'bg-gray-800/50 border-gray-700 opacity-50 grayscale cursor-not-allowed' : 
                'bg-white/5 border-white/10 hover:bg-white/10';

            btn.className = `w-full rounded-xl py-1.5 px-2 flex items-center gap-3 transition-all active:scale-95 border ${styleClass}`;            
            
            let statusHTML = '';
            if (isCooldown) {
                const timeLeft = 86400000 - (now - lastClaim);
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
                statusHTML = `<span class="text-[8px] text-gray-500 font-bold ml-auto">${hours}H</span>`;
            } else {
                statusHTML = task.reward > 0 ? `<span class="text-[8px] text-yellow-400 font-black ml-auto">+${task.reward}</span>` : `<i class="fas fa-chevron-right text-[8px] text-gray-400 ml-auto"></i>`;
            }

            btn.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-gray-300 border border-white/5">
                    <i class="fas ${task.icon} text-[10px]"></i>
                </div>
                <span class="text-[9px] font-bold uppercase text-gray-300 text-left flex-1">${task.name}</span>
                ${statusHTML}
            `;
            
            if(!isCooldown) {
                btn.onclick = () => this.handleTaskClick(task, btn);
            }
            listContent.appendChild(btn);
        });

        const notifDot = document.getElementById('task-notification');
        if(notifDot) notifDot.style.display = readyCount > 0 ? 'block' : 'none';
    },

    handleTaskClick(task, btnElement) {
        if (task.action === 'spin') { SpinSystem.show(); return; }
        
        // Client side task reward (Simulasi)
        if(window.AdsManager) {
            AdsManager.showHybridStack(3, async () => {
                GameState.user.coins += task.reward;
                if (!GameState.user.task_cooldowns) GameState.user.task_cooldowns = {};
                GameState.user.task_cooldowns[task.id] = Date.now();
                await GameState.save(); 
                this.renderTaskButtons();
                UIEngine.showRewardPopup("SUCCESS", `Task Done! +${task.reward} PTS`, null, "OK");
            });
        }
    },

    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};

window.FarmSystem = FarmSystem;
