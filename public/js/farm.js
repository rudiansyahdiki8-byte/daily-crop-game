// js/farm.js
// ==========================================
// FARM SYSTEM (API INTEGRATED)
// Logic Backend Only: Mencegah manipulasi klien.
// ==========================================

const FarmSystem = {
    plantData: window.HerbData || {}, 
    maxVisibleSlots: 4, // Sesuai file asli
    isTaskMenuOpen: false,
    interval: null,

    // DEFINISI TUGAS HARIAN (Sesuai File Asli)
    dailyTasks: [
        { id: 'daily_login', name: 'Login', icon: 'fa-calendar-check', reward: window.GameConfig?.Tasks?.Login || 100 },
        { id: 'visit_farm', name: 'Visit', icon: 'fa-walking', reward: window.GameConfig?.Tasks?.Visit || 50 },
        { id: 'free_reward', name: 'Gift', icon: 'fa-gift', reward: window.GameConfig?.Tasks?.Gift || 50 },
        { id: 'clean_farm', name: 'Clean', icon: 'fa-broom', reward: window.GameConfig?.Tasks?.Clean || 50 },
        { id: 'water_plants', name: 'Water', icon: 'fa-tint', reward: window.GameConfig?.Tasks?.Water || 50 },
        { id: 'fertilizer', name: 'Fertilize', icon: 'fa-seedling', reward: window.GameConfig?.Tasks?.Fertilizer || 50 },
        { id: 'kill_pests', name: 'Pest', icon: 'fa-bug', reward: window.GameConfig?.Tasks?.Pest || 50 },
        { id: 'harvest_once', name: 'Harvest', icon: 'fa-sickle', reward: window.GameConfig?.Tasks?.Harvest || 100 },
        { id: 'sell_item', name: 'Sell', icon: 'fa-coins', reward: window.GameConfig?.Tasks?.Sell || 100 },
        { id: 'claim_spin', name: 'Spin', icon: 'fa-dharmachakra', reward: 0, action: 'spin' }
    ],
    
    init() {
        // Init dummy jika data belum load (Prevent Crash)
        if(!GameState.farmPlots || GameState.farmPlots.length === 0) {
            GameState.farmPlots = Array(4).fill(null).map((_, i) => ({
                id: i + 1, status: i===0?'empty':'locked', plant: null, harvestAt: 0 
            }));
        }

        this.updateSlotStatus(); // Pastikan status lahan sesuai pembelian user
        this.renderLayout();
        this.renderFarmGrid(); 
        this.startEngine();
        this.startTaskTimer();
    },

    updateSlotStatus() {
        const purchased = GameState.user.landPurchasedCount || 0;
        GameState.farmPlots.forEach((plot, index) => {
            // Jangan ubah status lahan yang sedang tumbuh/siap panen
            if (plot.status === 'growing' || plot.status === 'ready') return;
            
            // Logic pembukaan lahan (Sesuai File Asli)
            if (index === 0) {
                if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
            } 
            else if (index === 1) plot.status = (purchased >= 1) ? 'empty' : 'locked';
            else if (index === 2) plot.status = (purchased >= 2) ? 'empty' : 'locked';
            else {
                plot.status = (purchased >= 3 && index < 4) ? 'empty' : 'disabled';
                if (index >= 4) plot.status = 'disabled';
            }
        });
    },

    // --- LOGIKA UTAMA (API CONNECTED) ---

    // 1. TANAM (PLANT)
    async plantAll() {
        this.updateSlotStatus();
        const emptyIndices = [];
        GameState.farmPlots.forEach((plot, index) => {
            if (plot.status === 'empty') emptyIndices.push(index);
        });

        if (emptyIndices.length === 0) {
            UIEngine.showRewardPopup("FULL", "No empty plots.", null, "OK");
            return;
        }

        UIEngine.showRewardPopup("PLANTING", "Server Calculating...", null, "...");
        
        // KUNCI STATE (Agar tidak ditimpa autosave)
        GameState.isSyncing = true; 

        try {
            // Tanam di slot kosong pertama yang ditemukan
            const targetIndex = emptyIndices[0]; 

            const response = await fetch('/api/farm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    action: 'plant',
                    plotIndex: targetIndex
                })
            });
            const result = await response.json();

            if (result.success) {
                // UPDATE STATE DARI SERVER
                GameState.farmPlots = result.farmPlots; 
                this.renderFarmGrid();
                UIEngine.showRewardPopup("SUCCESS", `Planted Seeds!`, null, "GROW!");
            } else {
                UIEngine.showRewardPopup("ERROR", result.error || "Plant Failed", null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        } finally {
            GameState.isSyncing = false; // BUKA KUNCI
        }
    },

    // 2. PANEN (HARVEST)
    async harvestAll(specificIndex = null) {
        let indicesToHarvest = [];
        if (specificIndex !== null) {
            if (GameState.farmPlots[specificIndex]?.status === 'ready') {
                indicesToHarvest.push(specificIndex);
            }
        } else {
            GameState.farmPlots.forEach((plot, index) => {
                if (plot.status === 'ready') indicesToHarvest.push(index);
            });
        }

        if (indicesToHarvest.length === 0) return;

        // Cek Gudang Penuh (Frontend Check)
        if (window.WarehouseSystem && WarehouseSystem.isFull(indicesToHarvest.length)) {
            UIEngine.showRewardPopup("FULL", "Storage Full!", () => WarehouseSystem.show(), "OPEN");
            return; 
        }

        // Jalankan Iklan (Sesuai File Asli)
        if (window.AdsManager && window.AdsManager.showHybridStack) {
            AdsManager.showHybridStack(2, () => {
                this.processHarvestAPI(indicesToHarvest);
            });
        } else {
            this.processHarvestAPI(indicesToHarvest);
        }
    },

    async processHarvestAPI(indicesToHarvest) {
        UIEngine.showRewardPopup("HARVESTING", "Verifying...", null, "...");
        GameState.isSyncing = true; // KUNCI STATE

        try {
            // Request panen untuk setiap plot
            const promises = indicesToHarvest.map(index => 
                fetch('/api/farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        action: 'harvest',
                        plotIndex: index
                    })
                }).then(res => res.json())
            );

            const results = await Promise.all(promises);
            const successResult = results.find(r => r.success);

            if (successResult) {
                // UPDATE SELURUH DATA DARI SERVER (PENTING!)
                // Jangan hitung manual di sini, percaya pada server
                GameState.farmPlots = successResult.farmPlots;
                GameState.warehouse = successResult.warehouse;
                GameState.user = successResult.user;

                // Efek Visual
                indicesToHarvest.forEach(idx => {
                    this.playFlyAnimation('assets_iso/stage_growing.png', idx);
                });

                this.renderFarmGrid();
                UIEngine.updateHeader(); // Update Koin/Level di Header
                UIEngine.showRewardPopup("HARVEST", `Success! Items added.`, null, "GREAT");
            } else {
                const errorMsg = results.find(r => r.error)?.error || "Failed";
                UIEngine.showRewardPopup("FAILED", errorMsg, null, "CLOSE");
            }

        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        } finally {
            GameState.isSyncing = false; // BUKA KUNCI
        }
    },

    // --- TUGAS (TASKS) ---
    async processTaskAPI(task, btnElement) {
        UIEngine.showRewardPopup("CLAIMING", "Contacting Server...", null, "...");
        GameState.isSyncing = true;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    taskId: task.id
                })
            });
            const result = await response.json();

            if (result.success) {
                // Update Koin & Cooldown dari Server
                // Perhatikan: Kita menambah manual di sini hanya untuk UI instan, 
                // tapi data server adalah kebenaran utama.
                GameState.user.coins = (GameState.user.coins || 0) + result.reward;
                
                if (!GameState.user.task_cooldowns) GameState.user.task_cooldowns = {};
                GameState.user.task_cooldowns[task.id] = result.newCooldown;
                
                if(btnElement) this.playCoinAnimation(btnElement);
                this.renderTaskButtons();
                UIEngine.updateHeader();
                
                UIEngine.showRewardPopup("SUCCESS", `Task Done! +${result.reward} PTS`, null, "OK");
            } else {
                UIEngine.showRewardPopup("FAILED", result.error || "Cooldown aktif", null, "CLOSE");
            }
        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "API Error", null, "CLOSE");
        } finally {
            GameState.isSyncing = false;
        }
    },

    handleTaskClick(task, btnElement) {
        if (task.action === 'spin') { SpinSystem.show(); return; }
        
        if (window.AdsManager && window.AdsManager.showHybridStack) {
            AdsManager.showHybridStack(3, () => {
                this.processTaskAPI(task, btnElement);
            });
        } else {
            console.warn("AdsManager missing, bypassing...");
            this.processTaskAPI(task, btnElement);
        }
    },

    // --- VISUAL & RENDER (TIDAK PERLU DIUBAH BANYAK) ---
    
    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        container.className = "h-full w-full relative overflow-hidden bg-transparent";

        const isSpinReady = (Date.now() - (GameState.user.spin_free_cooldown || 0)) > (window.GameConfig?.Spin?.CooldownFree || 3600000);

        // Header
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

        // Left Menu
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

        // Farm Container
        const farmContainer = document.createElement('div');
        farmContainer.className = "w-full h-full overflow-y-auto no-scrollbar relative z-10";
        farmContainer.innerHTML = `
            <div class="w-full flex justify-center mt-2 mb-[-40px] pt-20 relative z-0 pointer-events-none translate-x-4">
                <img src="assets_iso/farm_house.png" class="w-72 drop-shadow-2xl animate-in fade-in" onerror="this.style.display='none'"> 
            </div>
            <div id="farm-grid" class="pt-4 pb-40 pl-6"></div> 
            `;
        container.appendChild(farmContainer);

        // FAB Menu
        const fabContainer = document.createElement('div');
        fabContainer.className = "fab-menu";
        fabContainer.innerHTML = `
            <button onclick="FarmSystem.toggleTaskMenu()" class="fab-btn bg-white/90 backdrop-blur border border-emerald-400 relative z-50 shadow-lg">
                <div id="fab-icon-container" class="flex items-center justify-center w-full h-full">
                    <img src="https://img.icons8.com/plasticine/100/task.png" class="w-8 h-8 object-contain" alt="task"/>
                </div>
                <div id="task-notification" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white hidden"></div>
            </button>
            <div id="task-list-content" class="fab-content w-48 flex flex-col gap-2 shadow-2xl"></div>
        `;
        container.appendChild(fabContainer);
        
        this.renderTaskButtons();
        this.renderFarmGrid();
    },

    renderFarmGrid() {
        const grid = document.getElementById('farm-grid');
        if (!grid) return;
        this.updateSlotStatus();
        grid.innerHTML = '';
        const now = Date.now();
        const displayLimit = this.maxVisibleSlots;
        
        for (let i = 0; i < displayLimit; i++) {
            const plot = GameState.farmPlots[i];
            const div = document.createElement('div');
            div.className = 'plot-container';
            let landImg = (plot.status === 'locked') ? 'assets_iso/land_locked.png' : 'assets_iso/land_empty.png';
            let contentOverlay = '';
            let clickAction = () => {};

            // 1. LOCKED
            if (plot.status === 'locked') {
                const price2 = window.GameConfig?.ShopItems?.LandPrice_2 || 5000;
                const price3 = window.GameConfig?.ShopItems?.LandPrice_3 || 10000;
                let priceLabel = i === 1 ? (price2/1000)+"K" : (price3/1000)+"K";
                contentOverlay = `<div class="iso-ui"><div class="bg-black/80 text-yellow-400 px-2 py-1 rounded-lg text-[10px] font-black border border-yellow-500/50 backdrop-blur-sm shadow-lg"><i class="fas fa-lock text-[8px] mr-1"></i>${priceLabel}</div></div>`;
                clickAction = () => { UIEngine.navigate('Shop'); MarketSystem.switchTab('buy'); };
            } 
            // 2. EMPTY
            else if (plot.status === 'empty') {
                contentOverlay = `<div class="iso-ui animate-bounce" style="bottom: 50%;"><i class="fas fa-plus-circle text-4xl text-white/60 hover:text-white transition-colors drop-shadow-md"></i></div>`;
                clickAction = () => { this.plantAll(); };
            } 
            // 3. GROWING
            else if (plot.status === 'growing') {
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                let stageImg = 'assets_iso/stage_growing.png';
                contentOverlay = `<img src="${stageImg}" class="iso-plant plant-anim"><div class="absolute top-[-10px] bg-black/70 text-white text-[10px] px-2 py-1 rounded-full z-30 font-bold backdrop-blur-sm border border-white/20 shadow-xl">⏳ ${this.formatTime(remainingSec)}</div>`;
            }   
            // 4. READY
            else if (plot.status === 'ready') {
                const plantName = plot.plant ? plot.plant.toLowerCase() : 'ginger';
                const plantSource = `assets_iso/plant_${plantName}.png`;
                contentOverlay = `<img src="${plantSource}" class="iso-plant drop-shadow-lg" onerror="this.src='assets_iso/stage_growing.png'"> <div class="absolute top-[-35px] z-50 bg-white border-4 border-emerald-500 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl animate-bounce cursor-pointer"><img src="${plantSource}" class="w-10 h-10 object-contain drop-shadow-md" onerror="this.src='https://img.icons8.com/color/96/ginger.png'"><div class="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm"><i class="fas fa-sickle text-[10px]"></i></div></div>`;
                clickAction = () => { this.harvestAll(i); };
            }

            div.innerHTML = `<img src="${landImg}" class="iso-land" alt="Land">${contentOverlay}`;
            if (clickAction) div.onclick = clickAction;
            grid.appendChild(div);
        }
    },

    toggleTaskMenu() {
        const content = document.getElementById('task-list-content');
        const iconContainer = document.getElementById('fab-icon-container');
        this.isTaskMenuOpen = !this.isTaskMenuOpen;
        
        if(this.isTaskMenuOpen) {
            content.classList.add('open');
            iconContainer.innerHTML = `<i class="fas fa-times text-emerald-600 text-xl"></i>`;
        } else {
            content.classList.remove('open');
            iconContainer.innerHTML = `<img src="https://img.icons8.com/plasticine/100/task.png" class="w-8 h-8 object-contain" alt="task"/>`;
        }
    },

    renderTaskButtons() {
        const listContent = document.getElementById('task-list-content');
        if(!listContent) return;
        listContent.innerHTML = '';

        // Tombol Plant Random
        const plantBtn = document.createElement('button');
        plantBtn.className = "w-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-xl py-1 px-2 flex items-center gap-3 transition-all active:scale-95";
        plantBtn.innerHTML = `<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><i class="fas fa-seedling text-xs"></i></div><span class="text-[9px] font-black uppercase text-white">Plant Random</span>`;
        plantBtn.onclick = () => { this.toggleTaskMenu(); this.plantAll(); };
        listContent.appendChild(plantBtn);

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

    // ANIMASI & ENGINE
    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
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
                        // Jika masih tumbuh, kita tetap rerender setiap detik untuk update timer visual
                        // Tapi tidak perlu update state status
                        change = true; 
                    }
                }
            });
            if (change) this.renderFarmGrid();
        }, 1000);
    },

    startTaskTimer() { setInterval(() => { this.renderTaskButtons(); }, 60000); },
    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};

window.FarmSystem = FarmSystem;
