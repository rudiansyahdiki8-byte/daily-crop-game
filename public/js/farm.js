// js/farm.js
// FRONTEND FARM SYSTEM (CONNECTED TO VERCEL API)
// Tugas: Visualisasi & Kirim Perintah ke Server. Tidak ada logika acak di sini.

const FarmSystem = {
    // Ambil Data Tanaman dari Config Utama
    get plantData() {
        return window.GameConfig && window.GameConfig.Crops ? window.GameConfig.Crops : {};
    },
    
    maxVisibleSlots: 4,
    isTaskMenuOpen: false,
    interval: null,

    // DEFINISI TUGAS HARIAN (Reward dari Config)
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
        // Render awal
        this.renderLayout();
        this.renderFarmGrid(); 
        this.startEngine();
        this.startTaskTimer();
    },

    updateSlotStatus() {
        const purchased = GameState.user.landPurchasedCount || 0;
        
        // Pastikan farmPlots ada
        if (!GameState.farmPlots) GameState.farmPlots = [];

        GameState.farmPlots.forEach((plot, index) => {
            // Jangan ubah status jika sedang growing/ready (biar gak error visual)
            if (plot.status === 'growing' || plot.status === 'ready') return;
            
            // Logika Unlock Lahan
            if (index === 0) {
                // Slot 1 Selalu Terbuka
                if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
            } 
            else if (index === 1) {
                // Slot 2 butuh beli Land #2
                plot.status = (purchased >= 1) ? 'empty' : 'locked';
            } 
            else if (index === 2) {
                // Slot 3 butuh beli Land #3
                plot.status = (purchased >= 2) ? 'empty' : 'locked';
            } 
            else {
                // Slot 4 dst (Sementara dikunci/disabled)
                plot.status = 'disabled'; 
            }
        });
    },

    // --- 1. RENDER LAYOUT (Visual) ---
    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        container.className = "h-full w-full relative overflow-hidden bg-transparent";

        // Cek Spin Cooldown untuk animasi visual
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

        // LEFT MENU (Gudang & Market)
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

        // FARM CONTAINER
        const farmContainer = document.createElement('div');
        farmContainer.className = "w-full h-full overflow-y-auto no-scrollbar relative z-10";
        farmContainer.innerHTML = `
            <div class="w-full flex justify-center mt-2 mb-[-40px] pt-20 relative z-0 pointer-events-none translate-x-4">
                <img src="assets_iso/farm_house.png" class="w-72 drop-shadow-2xl animate-in fade-in" 
                     onerror="this.style.display='none'"> 
            </div>
            <div id="farm-grid" class="pt-4 pb-40 pl-6"></div> 
        `;
        container.appendChild(farmContainer);

        // TASK MENU (FAB)
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

    // --- 2. LOGIC TANAM (CLIENT -> SERVER API) ---
    async plantAll() {
        this.updateSlotStatus();
        
        // Cari lahan kosong
        // Kita butuh Index Asli (0, 1, 2, 3) untuk dikirim ke API
        const emptyIndices = [];
        GameState.farmPlots.forEach((p, i) => {
            if (p.status === 'empty') emptyIndices.push(i);
        });

        if (emptyIndices.length === 0) {
            UIEngine.showRewardPopup("FULL", "No empty unlocked plots available.", null, "OK");
            return;
        }

        this.toggleTaskMenu(); // Tutup menu
        UIEngine.showRewardPopup("PLANTING", "Contacting Server...", null, "WAIT");

        // Proses satu per satu (Sequential) agar aman
        let successCount = 0;
        
        for (const idx of emptyIndices) {
            try {
                const response = await fetch('/api/farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        action: 'plant',
                        plotIndex: idx
                    })
                });
                const result = await response.json();

                if (result.success) {
                    // Update State Lokal dengan Data dari Server
                    // (Server sudah memilihkan bibit random berdasarkan Config)
                    GameState.farmPlots = result.farmPlots;
                    successCount++;
                }
            } catch (e) {
                console.error("Plant Error:", e);
            }
        }

        if (successCount > 0) {
            await GameState.save(); // Simpan state terbaru (backup)
            this.renderFarmGrid();
            UIEngine.showRewardPopup("PLANTED", `Successfully planted ${successCount} seeds!`, null, "GROW!");
        } else {
            UIEngine.showRewardPopup("ERROR", "Failed to plant. Check connection.", null, "CLOSE");
        }
    },

    // --- 3. LOGIC PANEN (CLIENT -> ADS -> SERVER API) ---
    async harvestAll(specificIndex = null) {
        // Filter lahan siap panen
        let readyIndices = [];
        
        if (specificIndex !== null) {
            if (GameState.farmPlots[specificIndex].status === 'ready') readyIndices.push(specificIndex);
        } else {
            GameState.farmPlots.forEach((p, i) => {
                if (p.status === 'ready') readyIndices.push(i);
            });
        }

        if (readyIndices.length === 0) return;

        // Cek Gudang Penuh (Client Check)
        if (window.WarehouseSystem && WarehouseSystem.isFull(readyIndices.length)) {
            UIEngine.showRewardPopup("FULL", "Storage Full! Sell items first.", () => WarehouseSystem.show(), "OPEN");
            return; 
        }

        // TAMPILKAN IKLAN DULU (Ads.js Hybrid Stack)
        if (window.AdsManager) {
            AdsManager.showHybridStack(2, async () => {
                await this.executeHarvestAPI(readyIndices);
            });
        } else {
            // Fallback jika ads belum load
            await this.executeHarvestAPI(readyIndices);
        }
    },

    async executeHarvestAPI(indices) {
        UIEngine.showRewardPopup("HARVESTING", "Collecting crops...", null, "WAIT");

        let totalYield = 0;
        let lastCropName = "";

        for (const idx of indices) {
            try {
                // Animasi Coin/Item Terbang (Visual Only)
                // Kita ambil data sebelum update untuk tau apa yang terbang
                const plot = GameState.farmPlots[idx];
                const plantName = plot.plant || 'ginger';
                this.playFlyAnimation(`assets_iso/plant_${plantName.toLowerCase()}.png`, idx);

                // Call API
                const response = await fetch('/api/farm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        action: 'harvest',
                        plotIndex: idx
                    })
                });
                const result = await response.json();

                if (result.success) {
                    // Update State Lokal
                    GameState.farmPlots = result.farmPlots; // Plot sudah auto-replant dari server
                    GameState.warehouse = result.warehouse;
                    GameState.user = result.user; // Update XP/TotalHarvest
                    
                    // Hitung selisih yield (Server vs Local logic agak susah, kita asumsi sukses)
                    // Ambil pesan server "Harvested 3x Corn"
                    if(result.message) {
                        const parts = result.message.split(' ');
                        // Coba parsing angka jika ada (simple)
                        totalYield += 1; // Default visual count
                        lastCropName = plantName;
                    }
                }
            } catch (e) {
                console.error("Harvest Error:", e);
            }
        }

        this.renderFarmGrid();
        UIEngine.updateHeader(); // Update koin/level jika ada
        
        UIEngine.showRewardPopup("HARVEST COMPLETE", `Collected crops & Auto-Replanted!`, null, "AWESOME");
    },

    // --- ENGINE & RENDER ---
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
                        // Update visual timer (bisa dioptimalkan tanpa re-render full grid)
                        change = true; 
                    }
                }
            });
            if (change) this.renderFarmGrid();
        }, 1000);
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

            // Base Tanah
            let landImg = (plot.status === 'locked') ? 'assets_iso/land_locked.png' : 'assets_iso/land_empty.png';
            
            let contentOverlay = '';
            let clickAction = () => {};

            // 1. LOCKED
            if (plot.status === 'locked') {
                const price2 = window.GameConfig?.ShopItems?.land_2 || 5000;
                const price3 = window.GameConfig?.ShopItems?.land_3 || 10000;
                let priceLabel = i === 1 ? (price2/1000)+"K" : (price3/1000)+"K";

                contentOverlay = `
                    <div class="iso-ui">
                         <div class="bg-black/80 text-yellow-400 px-2 py-1 rounded-lg text-[10px] font-black border border-yellow-500/50 backdrop-blur-sm shadow-lg">
                            <i class="fas fa-lock text-[8px] mr-1"></i>${priceLabel}
                         </div>
                    </div>`;
                clickAction = () => { UIEngine.navigate('Shop'); if(window.MarketSystem) MarketSystem.switchTab('buy'); };
            } 
            
            // 2. EMPTY
            else if (plot.status === 'empty') {
                contentOverlay = `
                    <div class="iso-ui animate-bounce" style="bottom: 50%;">
                        <i class="fas fa-plus-circle text-4xl text-white/60 hover:text-white transition-colors drop-shadow-md"></i>
                    </div>`;
                clickAction = () => { this.plantAll(); };
            } 
            
            // 3. GROWING
            else if (plot.status === 'growing') {
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                
                // Ambil durasi tumbuh dari Config
                const plantKey = plot.plant || 'ginger';
                const plantConfig = this.plantData[plantKey] || { time: 180 };
                const baseTime = plantConfig.time;
                
                // Visual Stage
                let stageImg = (remainingSec > (baseTime * 0.7)) ? 'assets_iso/stage_sprout.png' : 'assets_iso/stage_growing.png';

                contentOverlay = `
                    <img src="${stageImg}" class="iso-plant plant-anim">
                    <div class="absolute top-[-10px] bg-black/70 text-white text-[10px] px-2 py-1 rounded-full z-30 font-bold backdrop-blur-sm border border-white/20 shadow-xl">
                        ⏳ ${this.formatTime(remainingSec)}
                    </div>`;
            }   
            
            // 4. READY (Visualisasi Bubble Besar)
            else if (plot.status === 'ready') {
                const plantName = plot.plant ? plot.plant.toLowerCase() : 'ginger';
                // Ambil gambar dari config
                const plantConfig = this.plantData[plot.plant] || {};
                const plantSource = plantConfig.img || `assets_iso/plant_${plantName}.png`;
                
                contentOverlay = `
                    <img src="${plantSource}" class="iso-plant drop-shadow-lg" 
                         onerror="this.src='assets_iso/stage_growing.png'"> 
                    
                    <div class="absolute top-[-35px] z-50 bg-white border-4 border-emerald-500 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl animate-bounce cursor-pointer">
                        <img src="${plantSource}" class="w-10 h-10 object-contain drop-shadow-md">
                        <div class="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm">
                            <i class="fas fa-sickle text-[10px]"></i>
                        </div>
                    </div>`;
                clickAction = () => { this.harvestAll(i); };
            }

            div.innerHTML = `
                <img src="${landImg}" class="iso-land" alt="Land">
                ${contentOverlay}
            `;
            if (clickAction) div.onclick = clickAction;
            grid.appendChild(div);
        }
    },

    // --- UTILS ---
    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
        // Target ke tombol Warehouse (Storage)
        // Kita cari elemen .fa-warehouse di DOM
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
    
    // --- TASK SYSTEM UTILS ---
    startTaskTimer() {
        setInterval(() => { this.renderTaskButtons(); }, 60000);
    },
    
    renderTaskButtons() {
        const listContent = document.getElementById('task-list-content');
        if(!listContent) return;
        listContent.innerHTML = '';

        // Tombol Plant Random
        const plantBtn = document.createElement('button');
        plantBtn.className = "w-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-xl py-1 px-2 flex items-center gap-3 transition-all active:scale-95";
        plantBtn.innerHTML = `<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><i class="fas fa-seedling text-xs"></i></div><span class="text-[9px] font-black uppercase text-white">Plant Random</span>`;
        plantBtn.onclick = () => { this.plantAll(); };
        listContent.appendChild(plantBtn);

        // Task List (Manual Rewards)
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
        
        // Task Reward Sederhana (Client Side) -> Bisa dipindah ke Server nanti
        AdsManager.showHybridStack(3, async () => {
            GameState.user.coins += task.reward;
            if (!GameState.user.task_cooldowns) GameState.user.task_cooldowns = {};
            GameState.user.task_cooldowns[task.id] = Date.now();
            await GameState.save(); 
            this.renderTaskButtons();
            UIEngine.showRewardPopup("SUCCESS", `Task Done! +${task.reward} PTS`, null, "OK");
        });
    },

    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};

window.FarmSystem = FarmSystem;
