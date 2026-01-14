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
renderLayout() {
        // --- KONFIGURASI GRID BARU ---
        const DEBUG_MODE = true;  
        const GRID_SIZE = 125;     // <--- GANTI DARI 80 KE 125
        const START_Y = 100;       // Kita naikkan dikit (biar gak terlalu turun)
        const container = document.getElementById('FarmingHouse');
        container.innerHTML = '';
        container.className = "h-full w-full relative overflow-hidden bg-transparent";

        // 1. HEADER (Tetap)
        const header = document.createElement('div');
        header.className = "absolute top-0 left-0 right-0 p-4 z-50 pointer-events-none";
        header.innerHTML = `
            <div class="pointer-events-auto glass px-3 py-1.5 rounded-full border border-white/10 w-fit bg-black/40 backdrop-blur-md">
                <span class="text-[10px] font-black text-white uppercase">${GameState.user.username}</span>
            </div>`;
        container.appendChild(header);

        // 2. WORLD CONTAINER
        const world = document.createElement('div');
        world.className = "w-full h-full relative overflow-y-auto no-scrollbar";
        
        // --- FUNGSI PEMBANTU: Taruh Item Berdasarkan Koordinat Grid (Row, Col) ---
        // Row = Baris (Turun), Col = Kolom (Samping)
        const placeAtGrid = (row, col) => {
            // Rumus Isometric Sederhana untuk CSS Absolute
            // Kita pakai "Pseudo-Grid": X = Kanan, Y = Bawah
            
            // Titik Tengah Layar
            const centerX = window.innerWidth / 2;
            
            // Hitung pixel (Ini rumus diamond grid)
            // Geser X: (Col - Row) * Setengah Lebar
            // Geser Y: (Col + Row) * Setengah Tinggi
            const x = centerX + (col - row) * (GRID_SIZE * 0.7); // 0.7 biar agak rapat
            const y = START_Y + (col + row) * (GRID_SIZE * 0.4); 
            
            return { x, y };
        };

        // --- LAYER 1: GARIS MERAH (DEBUG) ---
        if (DEBUG_MODE) {
            const debugLayer = document.createElement('div');
            debugLayer.className = "debug-grid-layer";
            
            // Bikin Grid 5x5 untuk panduan
            for(let r = -2; r <= 4; r++) {
                for(let c = -2; c <= 4; c++) {
                    const pos = placeAtGrid(r, c);
                    const box = document.createElement('div');
                    box.className = "debug-diamond";
                    box.style.left = pos.x + 'px';
                    box.style.top = pos.y + 'px';
                    box.innerHTML = `${r},${c}`; // Koordinat
                    debugLayer.appendChild(box);
                }
            }
            world.appendChild(debugLayer);
        }

        // --- LAYER 2: PENEMPATAN ITEM SESUAI SKEMA GAMBAR ---
        
        // A. FARM HOUSE (Pusat: 0,0)
        // Rumah duduk di tengah grid (0,0) tapi ukurannya besar
        const housePos = placeAtGrid(0, 0); 
        const house = document.createElement('div');
        house.className = "absolute z-20 flex justify-center items-end pointer-events-none";
        house.style.left = housePos.x + 'px';
        house.style.top = (housePos.y - 40) + 'px'; // Naik dikit biar pas tapaknya
        house.innerHTML = `
            <img src="assets_iso/farm_house.png" class="w-64 drop-shadow-2xl -translate-x-1/2 -translate-y-1/2">
        `;
        world.appendChild(house);

        // B. WAREHOUSE (Kiri Atas: Row 0, Col -2)
        // Lihat garis merah: Dia ada di sebelah kiri atas rumah
        const whPos = placeAtGrid(0, -2);
        const btnGudang = document.createElement('div');
        btnGudang.className = "absolute shape-diamond-small snap-center cursor-pointer";
        btnGudang.style.left = whPos.x + 'px';
        btnGudang.style.top = whPos.y + 'px';
        btnGudang.onclick = () => WarehouseSystem.show();
        btnGudang.innerHTML = `<i class="fas fa-warehouse text-amber-400 text-lg" style="transform: rotate(-45deg)"></i>`;
        world.appendChild(btnGudang);

        // C. MARKET (Kanan Atas: Row -2, Col 0)
        // Seberang Warehouse
        const mktPos = placeAtGrid(-2, 0);
        const btnMarket = document.createElement('div');
        btnMarket.className = "absolute shape-diamond-small border-blue-400/50 snap-center cursor-pointer";
        btnMarket.style.left = mktPos.x + 'px';
        btnMarket.style.top = mktPos.y + 'px';
        btnMarket.onclick = () => UIEngine.navigate('Shop');
        btnMarket.innerHTML = `<i class="fas fa-store text-blue-400 text-lg" style="transform: rotate(-45deg)"></i>`;
        world.appendChild(btnMarket);

        // D. TANAH HIJAU (4 Slot di Bawah Rumah)
        // Slot 1: (1, 0)
        // Slot 2: (0, 1)
        // Slot 3: (1, 1) -> Pusat Cluster
        // Slot 4: (2, 1) ... dst
        // Sesuai gambar, tanah ada di Row 1 & 2
        
        const landCoords = [
            {r: 1, c: 0}, // Slot 1 (Atas Kiri)
            {r: 0, c: 1}, // Slot 2 (Atas Kanan)
            {r: 2, c: 0}, // Slot 3 (Bawah Kiri)
            {r: 1, c: 1}  // Slot 4 (Bawah Kanan)
        ];

        landCoords.forEach((coord, i) => {
            if (!GameState.farmPlots[i]) return;
            const pos = placeAtGrid(coord.r, coord.c);
            const plotDiv = document.createElement('div');
            
            // Pakai class shape-diamond-big (ukuran grid)
            plotDiv.className = "absolute shape-diamond-big snap-center cursor-pointer active:scale-95 transition-transform";
            plotDiv.style.left = pos.x + 'px';
            plotDiv.style.top = pos.y + 'px';
            
            // ... (Kode Isi Gambar Tanah sama seperti sebelumnya) ...
            let imgSource = 'assets_iso/land_empty.png';
            if (GameState.farmPlots[i].status === 'locked') imgSource = 'assets_iso/land_locked.png';
            
            let content = `<img src="${imgSource}" class="land-img" alt="Land">`;
            if (GameState.farmPlots[i].status === 'locked') {
                content += `<div class="absolute z-10 text-[10px] bg-black/80 px-1 rounded text-yellow-400 font-bold" style="transform: rotate(-45deg)">🔒</div>`;
            } else if (GameState.farmPlots[i].status === 'growing') {
                content += `<div class="absolute z-10 text-xl" style="transform: rotate(-45deg)">🌱</div>`;
            }
            
            plotDiv.innerHTML = content;
            plotDiv.onclick = () => { /* Logika Panen */ };
            
            world.appendChild(plotDiv);
        });

        // E. LAND LOCKED / DISABLE (Menjalar ke bawah sesuai garis merah)
        // Kita tambah hiasan tanah terkunci di bawahnya: Row 2, Col 1 dst
        const lockedPos = placeAtGrid(2, 1);
        const lockedDiv = document.createElement('div');
        lockedDiv.className = "absolute shape-diamond-big snap-center opacity-50";
        lockedDiv.style.left = lockedPos.x + 'px';
        lockedDiv.style.top = (lockedPos.y + 60) + 'px'; // Manual turun dikit buat hiasan
        lockedDiv.innerHTML = `<img src="assets_iso/land_locked.png" class="land-img grayscale">`;
        world.appendChild(lockedDiv);

        container.appendChild(world);
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

        const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
        const now = Date.now();
        let readyCount = 0;

        this.dailyTasks.forEach(task => {
            const lastClaim = cooldowns[task.id] || 0;
            const isCooldown = (now - lastClaim) < 86400000;
            
            if (!isCooldown) readyCount++;

            const btn = document.createElement('button');
            btn.className = `w-full rounded-xl py-1.5 px-2 flex items-center gap-3 transition-all active:scale-95 border ${isCooldown ? 'bg-gray-800/50 border-gray-700 opacity-50 grayscale cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10'}`;            
            
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
        
        AdsManager.showAd(`Task: ${task.name}`, async () => {
            GameState.user.coins += task.reward;
            const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
            cooldowns[task.id] = Date.now();
            localStorage.setItem('dc_task_cooldowns', JSON.stringify(cooldowns));
            
            if(btnElement) this.playCoinAnimation(btnElement);
            await GameState.save();
            this.renderTaskButtons();
            UIEngine.showRewardPopup("SUCCESS", `Task Done! +${task.reward} PTS`, null, "OK");
        });
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

    async harvestAll(specificIndex = null) {
        let plotsToHarvest = [];
        if (specificIndex !== null) {
            const plot = GameState.farmPlots[specificIndex];
            if (plot && plot.status === 'ready') plotsToHarvest.push(plot);
        } else {
            plotsToHarvest = GameState.farmPlots.filter(p => p.status === 'ready');
        }

        if (plotsToHarvest.length === 0) return;

        if (window.WarehouseSystem && WarehouseSystem.isFull(plotsToHarvest.length)) {
            UIEngine.showRewardPopup("FULL", "Storage Full! Sell items first.", () => WarehouseSystem.show(), "OPEN");
            return; 
        }

        UIEngine.showRewardPopup("ADVERTISEMENT", "Harvesting Crops... 3s", null, "...");
        AdsManager.showAd("Harvesting Crops", async () => {
            await this.executeHarvestLogic(plotsToHarvest);
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