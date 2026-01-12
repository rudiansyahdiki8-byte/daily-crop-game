const FarmSystem = {
    plantData: window.HerbData, 
    tierVisuals: { 'FREE': 4, 'MORTGAGE': 6, 'TENANT': 8, 'OWNER': 12 },

    dailyTasks: [
        { id: 'daily_login', name: 'Neural Link established', icon: 'fa-user-check', reward: 100 },
        { id: 'free_reward', name: 'Claim Data Packet', icon: 'fa-box-open', reward: 50 },
        { id: 'visit_farm', name: 'Access Mainframe', icon: 'fa-terminal', reward: 30 },
        { id: 'harvest_once', name: 'Extract One Node', icon: 'fa-download', reward: 50 },
        { id: 'sell_item', name: 'Upload Data Pack', icon: 'fa-upload', reward: 50 },
        { id: 'water_plants', name: 'Sync Neural Stream', icon: 'fa-sync', reward: 40 },
        { id: 'fertilizer', name: 'Overclock Node', icon: 'fa-bolt', reward: 40 },
        { id: 'kill_pests', name: 'Purge Malwares', icon: 'fa-shield-virus', reward: 40 },
        { id: 'clean_farm', name: 'Clear System Logs', icon: 'fa-broom', reward: 30 }
    ],

init() {
        // 1. Muat data tanah dari localStorage
        const savedFarm = localStorage.getItem('dc_farm_save');
        if(savedFarm) {
            GameState.farmPlots = JSON.parse(savedFarm);
        } else {
            // Jika data hilang, buat 12 petak default
            GameState.farmPlots = Array(12).fill(null).map((_, i) => ({
                id: i + 1, status: 'locked', plant: null, readyAt: 0 
            }));
        }

        // 2. Pastikan Plan Limits dijalankan SEBELUM render
        // Ini yang akan mengubah status 'locked' menjadi 'empty' (lahan terbuka)
        this.applyPlanLimits(); 

        const now = Date.now();
        GameState.farmPlots.forEach(plot => {
            if (plot.status === 'growing' && plot.readyAt > 0) {
                if (now >= plot.readyAt) {
                    plot.status = 'ready';
                }
            }
        });

        if (!localStorage.getItem('dc_task_cooldowns')) {
            localStorage.setItem('dc_task_cooldowns', JSON.stringify({}));
        }

        this.renderLayout();
        this.renderFarmGrid(); // Render petak ke layar
        this.startEngine();
        this.startTaskTimer();
    },

    renderLayout() {
        const container = document.getElementById('FarmingHouse');
        if (!container) return;
        container.innerHTML = '';
        
// Di dalam FarmSystem.renderLayout di farm.js
        const header = document.createElement('div');
        header.className = "glass p-3 mb-3 flex justify-between items-center shrink-0 relative overflow-hidden border-[#00f2ff]/20"; 
        header.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="w-8 h-8 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30 shrink-0">
                    <i class="fas fa-microchip text-cyan-400 text-sm animate-pulse"></i>
                </div>
                <div class="truncate">
                    <h3 class="text-[9px] font-black text-white uppercase tracking-wider leading-tight truncate">
                        ${GameState.user.username || 'NETRUNNER'}
                    </h3>
                    <p class="text-[6px] text-cyan-500 font-bold uppercase italic tracking-tighter leading-none">Neural Mainframe</p>
                </div>
            </div>
            
            <div class="flex items-center gap-1 ml-2 shrink-0">
                <button onclick="UIEngine.showNeuralDatabase()" class="w-9 h-9 glass flex items-center justify-center border-amber-500/30 text-amber-500 active:scale-95 transition-all">
                    <i class="fas fa-terminal text-xs"></i>
                </button>

                <button id="target-warehouse-icon" onclick="WarehouseSystem.show()" class="w-9 h-9 glass flex items-center justify-center border-[#ff0055]/30 text-[#ff0055] active:scale-95 transition-all">
                    <i class="fas fa-database text-xs"></i>
                </button>
            </div>
        `;
        container.appendChild(header);

        const mainArea = document.createElement('div');
        mainArea.className = "flex-1 flex gap-3 min-h-0 overflow-hidden";
        
        const sidebar = document.createElement('div');
        sidebar.id = "task-sidebar";
        sidebar.className = "w-20 flex flex-col gap-2 overflow-y-auto no-scrollbar pb-24 shrink-0 pr-1";
        mainArea.appendChild(sidebar);

        const farmContainer = document.createElement('div');
        farmContainer.className = "flex-1 flex flex-col min-h-0";
        farmContainer.innerHTML = `
            <div id="farm-grid" class="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-32 pr-1 content-start"></div>
        `;
        mainArea.appendChild(farmContainer);
        container.appendChild(mainArea);
        
        this.renderTaskButtons();
    },

    renderTaskButtons() {
        const sidebar = document.getElementById('task-sidebar');
        if(!sidebar) return;
        
        const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
        const now = Date.now();
        sidebar.innerHTML = '';
        
        this.dailyTasks.forEach(task => {
            const lastClaim = cooldowns[task.id] || 0;
            const isCooldown = (now - lastClaim) < 86400000;
            const btn = document.createElement('button');
            let btnClass = "w-full aspect-square flex flex-col items-center justify-center transition-all shadow-lg border relative overflow-hidden group ";
            
            if (isCooldown) {
                btnClass += "bg-black/80 border-gray-900 cursor-not-allowed grayscale opacity-40";
                const timeLeft = 86400000 - (now - lastClaim);
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
                btn.innerHTML = `<i class="fas fa-lock text-gray-400 text-xs mb-1"></i><span class="text-[6px] font-black text-gray-500 uppercase">${hours}H OFFLINE</span>`;
                btn.disabled = true;
            } else {
                btnClass += "glass border-cyan-500/20 hover:bg-cyan-500/10 active:scale-90";
                btn.innerHTML = `<i class="fas ${task.icon} text-cyan-400 text-sm mb-1 group-hover:scale-110 transition-transform"></i><span class="text-[5px] font-black uppercase text-center leading-tight text-white/80">${task.name}</span><div class="absolute top-1 right-1 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>`;
                btn.onclick = () => this.handleTaskClick(task, btn);
            }
            btn.className = btnClass;
            sidebar.appendChild(btn);
        });
    },

    handleTaskClick(task, btnElement) {
        if (task.action === 'spin') { SpinSystem.show(); return; }
        
        UIEngine.showRewardPopup("UPLINK REQUEST", `Establishing proxy to complete "${task.name}"?`, () => {
            UIEngine.showRewardPopup("SYNCING", "Connecting to Satellite... please wait.", null, "...");
            
            setTimeout(() => {
                UIEngine.showRewardPopup("SYNC SUCCESS", `Access Granted! ${task.reward} Credits received.`, () => {
                    GameState.user.coins += task.reward;
                    GameState.save();
                    
                    const cooldowns = JSON.parse(localStorage.getItem('dc_task_cooldowns') || '{}');
                    cooldowns[task.id] = Date.now();
                    localStorage.setItem('dc_task_cooldowns', JSON.stringify(cooldowns));
                    
                    if(btnElement) this.playCoinAnimation(btnElement);
                    UIEngine.updateHeader();
                    this.renderTaskButtons();
                }, "COLLECT CREDITS");
            }, 2000);
        }, "START SYNC");
    },

    applyPlanLimits() {
        const userPlan = GameState.user.plan || "FREE";
        const config = (window.PlanConfig && PlanConfig[userPlan]) ? PlanConfig[userPlan] : { basePlots: 1, maxPlots: 3 };
        const visualLimit = this.tierVisuals[userPlan];

        GameState.farmPlots.forEach((plot, index) => {
            if (index < config.basePlots) {
                if (plot.status === 'locked' || plot.status === 'disabled') plot.status = 'empty';
            } else if (index < config.maxPlots) {
                if (plot.status === 'disabled' || plot.status === 'empty') plot.status = 'locked';
            } else if (index < visualLimit) {
                plot.status = 'disabled';
            }
        });
    },

    plantAll() {
        const buffs = GameState.user.activeBuffs || {};
        let speedMultiplier = 1;
        const now = Date.now();
        
        if (buffs['growth_speed'] && buffs['growth_speed'] > now) speedMultiplier *= 0.8;
        if (buffs['speed_soil'] && buffs['speed_soil'] > now) speedMultiplier *= 0.9;

        let planted = 0;
        GameState.farmPlots.forEach(plot => {
            if (plot.status === 'empty') {
                plot.status = 'growing';
                plot.plant = DropEngine.roll(); 
                
// FORCE SEMUA JADI 5 MENIT (300 DETIK)
                const baseTimeSeconds = 300; 
                const durationMs = Math.ceil(baseTimeSeconds * speedMultiplier) * 1000;
                
                // Simpan Timestamp selesai
                plot.readyAt = now + durationMs;
                planted++;            }
        });
        
        if (planted > 0) {
            this.saveFarmState();
            this.renderFarmGrid();
        }
    },

    harvestAll() {
        let potentialHarvest = 0;
        GameState.farmPlots.forEach(plot => {
            if (plot.status === 'ready') potentialHarvest++;
        });

        

        if (potentialHarvest === 0) return;

        if (window.WarehouseSystem && WarehouseSystem.isFull(potentialHarvest)) {
            UIEngine.showRewardPopup("VAULT FULL", "Neural storage is at capacity! Export data packets.", () => {
                WarehouseSystem.show();
            }, "OPEN VAULT");
            return; 
        }

        const now = Date.now();
        const buffs = GameState.user.activeBuffs || {};
        const hasYieldBuff = (buffs['yield_bonus'] && buffs['yield_bonus'] > now);
        
        let count = 0;
        GameState.farmPlots.forEach((plot, index) => {
            if (plot.status === 'ready') {
                let yieldAmount = 1;
                if (hasYieldBuff && Math.random() < 0.25) yieldAmount = 2;

                const plantName = plot.plant || 'ginger';
                GameState.warehouse[plantName] = (GameState.warehouse[plantName] || 0) + yieldAmount;
                
                if(this.plantData[plantName]) {
                    this.playFlyAnimation(this.plantData[plantName].img, index);
                }
                
                plot.status = 'empty';
                plot.plant = null;
                plot.readyAt = 0;
                
                count += yieldAmount;
            }
        });

        if(count > 0) {
            GameState.user.totalHarvest += count;
            this.saveFarmState();
            
            setTimeout(() => {
                this.plantAll();
            }, 800);
        }
    },

    saveFarmState() {
        GameState.save();
        localStorage.setItem('dc_farm_save', JSON.stringify(GameState.farmPlots));
    },

    startEngine() {
        if(this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            let change = false;
            const now = Date.now();

            GameState.farmPlots.forEach(plot => {
                if (plot.status === 'growing' && plot.readyAt > 0) {
                    if (now >= plot.readyAt) {
                        plot.status = 'ready';
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
        
        grid.innerHTML = '';
        const userPlan = GameState.user.plan || "FREE";
        const limit = this.tierVisuals[userPlan] || 4;
        const now = Date.now();

        for (let i = 0; i < limit; i++) {
            const plot = GameState.farmPlots[i];
            if (!plot) continue;

            let content = '';
            let clickAction = '';
            
            if (plot.status === 'disabled') {
                content = `<div class="h-full w-full bg-black/60 border border-white/5 flex flex-col items-center justify-center opacity-40 group hover:opacity-100"><i class="fas fa-lock text-gray-600 mb-1"></i><span class="text-[6px] font-black text-gray-600 uppercase">Tier Locked</span></div>`;
                clickAction = `UIEngine.navigate('SubscibePlan')`;
            } else if (plot.status === 'locked') {
                content = `<div class="h-full w-full bg-[#1a1a2e] border-2 border-dashed border-cyan-500/20 flex flex-col items-center justify-center group"><i class="fas fa-terminal text-cyan-500/30 text-lg group-hover:text-cyan-500 transition-colors"></i><span class="text-[6px] text-cyan-500/50 font-black uppercase tracking-widest mt-1 italic">Assign Node</span></div>`;
                clickAction = `UIEngine.navigate('Shop'); if(window.MarketSystem) MarketSystem.switchTab('buy');`;
            } else if (plot.status === 'empty') {
                content = `<div class="h-full w-full bg-black/40 border border-[#ff0055]/20 flex items-center justify-center hover:bg-[#ff0055]/10 transition-colors"><i class="fas fa-plus text-[#ff0055]/30 text-xl"></i></div>`;
                clickAction = `FarmSystem.plantAll()`;
            } else if (plot.status === 'growing') {
                const sisa = Math.max(0, Math.ceil((plot.readyAt - now) / 1000));
                content = `<div class="h-full w-full bg-black/80 border border-cyan-500/30 flex flex-col items-center justify-center relative">
                    <i class="fas fa-satellite text-cyan-400 text-3xl animate-flicker mb-2"></i>
                    <span class="text-[8px] font-mono font-bold text-cyan-300">${this.formatTime(sisa)}</span>
                </div>`;
            } else if (plot.status === 'ready') {
                const img = this.plantData[plot.plant]?.img || 'https://img.icons8.com/nolan/96/data-configuration.png';
                content = `<div class="h-full w-full bg-black border border-[#ff0055]/50 flex flex-col items-center justify-center relative group cursor-pointer">
                    <img src="${img}" class="w-16 h-16 object-contain group-hover:scale-110 transition-transform">
                    <div class="absolute bottom-2 bg-[#ff0055] text-white text-[6px] font-black px-3 py-0.5 uppercase italic">Extract</div>
                </div>`;
                clickAction = `FarmSystem.harvestAll()`;
            }

            const div = document.createElement('div');
            div.className = "w-full aspect-square relative active:scale-95 transition-transform duration-200"; 
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
        flyItem.className = "fixed z-[9999] w-10 h-10 object-contain pointer-events-none transition-all duration-700 ease-in-out shadow-[0_0_10px_white]";
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
        coin.className = "fixed z-[9999] w-6 h-6 rounded-sm bg-cyan-400 flex items-center justify-center shadow-[0_0_10px_#00f2ff] transition-all duration-1000 ease-in-out";
        coin.innerHTML = '<i class="fas fa-bolt text-black text-[10px]"></i>';
        coin.style.left = `${startRect.left + startRect.width/2}px`;
        coin.style.top = `${startRect.top + startRect.height/2}px`;
        
        document.body.appendChild(coin);
        setTimeout(() => {
            coin.style.left = `${targetRect.left}px`;
            coin.style.top = `${targetRect.top}px`;
            coin.style.opacity = "0";
            coin.style.transform = "rotate(360deg)";
        }, 50);
        setTimeout(() => coin.remove(), 1000);
    },

    formatTime(s) {
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec<10?'0':''}${sec}`;
    }
};

window.FarmSystem = FarmSystem;