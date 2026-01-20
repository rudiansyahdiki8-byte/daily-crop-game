const FarmSystem = {
    plantData: window.HerbData || {}, 
    maxVisibleSlots: 4,
    isTaskMenuOpen: false,

    // DEFINISI TUGAS HARIAN
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
                plot.status = (purchased >= 3 && index < 4) ? 'empty' : 'disabled';
                if (index >= 4) plot.status = 'disabled'; // Sementara batasi 4 dulu
            }
        });
    },

    // --- 1. RENDER LAYOUT (Background Rumah & Menu) ---
// --- RENDER LAYOUT SESUAI SKEMA (FLOATING DIAMONDS) ---
    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        container.className = "h-full w-full relative overflow-hidden bg-transparent";

        const isSpinReady = (Date.now() - (GameState.user.spin_free_cooldown || 0)) > (window.GameConfig?.Spin?.CooldownFree || 3600000);

        // 1. HEADER (Hanya Profil User, Warehouse dipindah)
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

        // 2. LEFT MENU (DIAMOND BUTTONS - WAREHOUSE & MARKET)
        const leftMenu = document.createElement('div');
        leftMenu.className = "hud-left pointer-events-auto"; // Class baru yg kita buat di CSS
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

        // 3. CONTAINER KEBUN & RUMAH
        const farmContainer = document.createElement('div');
        farmContainer.className = "w-full h-full overflow-y-auto no-scrollbar relative z-10";
        
        // Layout: Rumah di atas, Grid di bawah
        farmContainer.innerHTML = `
            <div class="w-full flex justify-center mt-2 mb-[-40px] pt-20 relative z-0 pointer-events-none translate-x-4">
                <img src="assets_iso/farm_house.png" class="w-72 drop-shadow-2xl animate-in fade-in" 
                     onerror="this.style.display='none'"> 
            </div>
            
            <div id="farm-grid" class="pt-4 pb-40 pl-6"></div> 
            `;
        container.appendChild(farmContainer);

        // 4. FLOATING MENU (TASK) - Kiri Bawah
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

        // [PERBAIKAN UTAMA DISINI]
        // Ambil data dari Firebase (GameState), BUKAN LocalStorage
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

// js/farm.js - Revisi Task
    async handleTaskClick(task, btnElement) {
            if (task.action === 'spin') { SpinSystem.show(); return; }

            // 1. PROTEKSI AWAL: Cek status task di memori lokal sebelum panggil iklan
            // Jika task sudah selesai atau masih cooldown, hentikan fungsi di sini.
            if (task.isCompleted || (task.nextAvailable && Date.now() < task.nextAvailable)) {
                UIEngine.showRewardPopup("COOLDOWN", "Task belum siap atau sudah diklaim.");
                return;
            }

            // 2. DISABLE TOMBOL: Hindari pemain klik berkali-kali
            btnElement.disabled = true;
            const originalText = btnElement.innerText;
            btnElement.innerText = "LOADING...";

            AdsManager.showHybridStack(3, async () => {
                try {
                    const response = await fetch('/api/game/rewards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            initData: window.Telegram.WebApp.initData,
                            action: 'CLAIM_TASK',
                            payload: { taskId: task.id }
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        // 3. SINKRONISASI DATABASE: Ambil status koin DAN cooldown terbaru
                        // Jangan hanya update coins, tapi load seluruh GameState terbaru.
                        await GameState.load(); 

                        // 4. REFRESH UI: Update header koin dan render ulang semua tombol
                        UIEngine.updateHeader(); 
                        this.renderTaskButtons(); // Ini akan menggambar tombol dalam status 'Disabled/Cooldown'

                        UIEngine.showRewardPopup("DONE", `+${result.reward} PTS Added!`, null, "OK");
                    } else {
                        // Jika gagal (misal: server menolak karena cooldown), aktifkan tombol lagi
                        btnElement.disabled = false;
                        btnElement.innerText = originalText;
                        UIEngine.showRewardPopup("OOPS", result.error, null, "CLOSE");
                    }
                } catch (e) { 
                    btnElement.disabled = false;
                    btnElement.innerText = originalText;
                    console.error(e); 
                }
            });
    },
    // js/farm.js - Revisi plantAll [cite: 62]
    async plantAll() {
    UIEngine.showRewardPopup("FARMING", "Planting seeds...", null, "...");

    try {
        const response = await fetch('/api/farm/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                initData: window.Telegram.WebApp.initData,
                action: 'PLANT_ALL'
            })
        });

        const result = await response.json();
        if (result.success) {
            GameState.farmPlots = result.farmPlots; // Sinkronisasi data 
            this.renderFarmGrid();
            UIEngine.showRewardPopup("SUCCESS", "Seeds planted securely!", null, "OK");
        } else {
            UIEngine.showRewardPopup("ERROR", result.error, null, "CLOSE");
        }
    } catch (e) {
        UIEngine.showRewardPopup("FAILED", "Connection Error", null, "RETRY");
    }
    },

    // js/farm.js - Revisi harvestAll [cite: 64, 69]
    async harvestAll(specificIndex = null) {
        // Tetap gunakan AdsManager sebelum memanggil API [cite: 69]
        AdsManager.showHybridStack(2, async () => {
            try {
                const response = await fetch('/api/farm/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        initData: window.Telegram.WebApp.initData,
                        action: 'HARVEST_ALL'
                    })
                });

                const result = await response.json();
                if (result.success) {
                    GameState.farmPlots = result.farmPlots;
                    GameState.warehouse = result.warehouse;
                    GameState.user.totalHarvest = (GameState.user.totalHarvest || 0) + (result.harvestedCount || 1);
                    
                    this.renderFarmGrid();
                    UIEngine.updateHeader();
                    UIEngine.showRewardPopup("HARVESTED", "Items stored in Warehouse!", null, "GREAT");
                } else {
                    UIEngine.showRewardPopup("WAIT", result.error, null, "OK");
                }
            } catch (e) {
                console.error(e);
            }
        });
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
            
            // Animasi Terbang
            // Kita paksa path ke assets_iso untuk animasi juga
            const plantImgUrl = `assets_iso/plant_${plantName.toLowerCase()}.png`;
            const originalIndex = GameState.farmPlots.indexOf(plot);
            
            // Cek apakah gambar asli ada di data tanaman, kalau tidak pakai konstruksi manual
            this.playFlyAnimation(plantImgUrl, originalIndex);
            
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
                        change = true; // Update timer
                    }
                }
            });
            if (change) this.renderFarmGrid();
        }, 1000);
    },

    startTaskTimer() {
        setInterval(() => { this.renderTaskButtons(); }, 60000);
    },

    // --- 2. RENDER FARM GRID (CORE ISOMETRIC SYSTEM) ---
// --- RENDER FARM GRID (VERSI BUBBLE HERB JUMBO) ---
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
                const price2 = window.GameConfig?.ShopItems?.LandPrice_2 || 5000;
                const price3 = window.GameConfig?.ShopItems?.LandPrice_3 || 10000;
                let priceLabel = i === 1 ? (price2/1000)+"K" : (price3/1000)+"K";

                contentOverlay = `
                    <div class="iso-ui">
                         <div class="bg-black/80 text-yellow-400 px-2 py-1 rounded-lg text-[10px] font-black border border-yellow-500/50 backdrop-blur-sm shadow-lg">
                            <i class="fas fa-lock text-[8px] mr-1"></i>${priceLabel}
                         </div>
                    </div>`;
                clickAction = () => { UIEngine.navigate('Shop'); MarketSystem.switchTab('buy'); };
            } 
            
            // 2. EMPTY
            else if (plot.status === 'empty') {
                contentOverlay = `
                    <div class="iso-ui animate-bounce" style="bottom: 50%;">
                        <i class="fas fa-plus-circle text-4xl text-white/60 hover:text-white transition-colors drop-shadow-md"></i>
                    </div>`;
                clickAction = () => { this.plantAll(); };
            } 
            
            // 3. GROWING (TAMPIL TIMER & SEMAK)
            else if (plot.status === 'growing') {
                const remainingSec = Math.max(0, Math.ceil((plot.harvestAt - now) / 1000));
                const baseTime = this.plantData[plot.plant] ? this.plantData[plot.plant].time : 180;
                
                // Masih Semak Hijau
                let stageImg = (remainingSec > (baseTime * 0.7)) ? 'assets_iso/stage_sprout.png' : 'assets_iso/stage_growing.png';

                contentOverlay = `
                    <img src="${stageImg}" class="iso-plant plant-anim">
                    <div class="absolute top-[-10px] bg-black/70 text-white text-[10px] px-2 py-1 rounded-full z-30 font-bold backdrop-blur-sm border border-white/20 shadow-xl">
                        ⏳ ${this.formatTime(remainingSec)}
                    </div>`;
            }   
            
            // 4. READY (TAMPIL BUBBLE HERB BESAR) -> Timer Hilang Disini
            else if (plot.status === 'ready') {
                const plantName = plot.plant ? plot.plant.toLowerCase() : 'ginger';
                const plantSource = `assets_iso/plant_${plantName}.png`;
                
                // LOGIKA:
                // - stage_growing HILANG -> Diganti plantSource (Tanaman dewasa)
                // - Timer HILANG -> Diganti Bubble Besar di atasnya
                
                contentOverlay = `
                    <img src="${plantSource}" class="iso-plant drop-shadow-lg" 
                         onerror="this.src='assets_iso/stage_growing.png'"> 
                    
                    <div class="absolute top-[-35px] z-50 bg-white border-4 border-emerald-500 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl animate-bounce cursor-pointer">
                        
                        <img src="${plantSource}" class="w-10 h-10 object-contain drop-shadow-md"
                             onerror="this.src='https://img.icons8.com/color/96/ginger.png'">
                        
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
        
    playFlyAnimation(imgUrl, index) {
        const grid = document.getElementById('farm-grid');
        if (!grid || !grid.children[index]) return;
        
        const rect = grid.children[index].getBoundingClientRect();
        const targetEl = document.querySelector('.fa-warehouse');
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth/2, top: 0 };
        
        const flyItem = document.createElement('img');
        flyItem.src = imgUrl;
        // Fallback jika gambar terbang gagal muat
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

    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};



window.FarmSystem = FarmSystem;



