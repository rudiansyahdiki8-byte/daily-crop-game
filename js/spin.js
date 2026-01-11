const SpinSystem = {
    cooldownTime: 1 * 60 * 60 * 1000, // 1 Cycle (1 Hour)

    show() {
        const herbKeys = Object.keys(window.HerbData || {});
        const previewImgs = herbKeys.slice(0, 4).map(k => HerbData[k].img);

        const overlay = document.createElement('div');
        overlay.id = "spin-popup";
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-6 animate-in";
        
        overlay.innerHTML = `
            <div class="glass w-full max-w-sm p-6 border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                <button onclick="SpinSystem.close()" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-[#ff0055] hover:text-white transition-all z-10">
                    <i class="fas fa-times text-xs"></i>
                </button>
                
                <h2 class="text-2xl font-black text-white mb-1 uppercase italic tracking-[0.1em] text-indigo-400">Neural Breach</h2>
                <p class="text-[9px] text-gray-400 font-bold mb-8 uppercase tracking-[0.2em] px-10 italic">Extract High-Tier Hardware & Encrypted Packets</p>

                <div class="relative w-56 h-56 mx-auto mb-8">
                    <div id="main-wheel" class="w-full h-full rounded-full border-4 border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center transition-all duration-[4000ms] cubic-bezier(0.25, 0.1, 0.25, 1) relative overflow-hidden">
                        <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 p-10 opacity-30">
                             <img src="${previewImgs[0] || ''}" class="w-8 h-8 object-contain mx-auto animate-flicker">
                             <img src="${previewImgs[1] || ''}" class="w-8 h-8 object-contain mx-auto animate-flicker">
                             <img src="${previewImgs[2] || ''}" class="w-8 h-8 object-contain mx-auto animate-flicker">
                             <img src="${previewImgs[3] || ''}" class="w-8 h-8 object-contain mx-auto animate-flicker">
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i class="fas fa-dharmachakra text-indigo-400/20 text-8xl animate-spin-slow"></i>
                        </div>
                    </div>
                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-500 text-3xl z-20 drop-shadow-[0_0_10px_#f59e0b]">
                        <i class="fas fa-caret-down"></i>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <button id="btn-spin-free" onclick="SpinSystem.start('free')" class="w-full bg-indigo-600 text-white py-4 font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-white/10 group">
                        <span class="flex items-center justify-center gap-2">
                            <i class="fas fa-bolt group-hover:animate-pulse"></i> Execute Free Hack
                        </span>
                    </button>
                    <button id="btn-spin-paid" onclick="SpinSystem.start('paid')" class="w-full bg-black/40 hover:bg-white/5 text-white py-4 font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all border border-indigo-500/20">
                        <span class="flex items-center justify-center gap-2">
                            <i class="fas fa-bolt text-amber-500"></i> Inject 150 Credits
                        </span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.updateTimer();
    },

    start(type) {
        if (type === 'paid') {
            if (GameState.user.coins < 150) {
                UIEngine.showRewardPopup("INSUFFICIENT CREDITS", "Calibration requires 150 CRD.", null, "RETRY");
                return;
            }
            GameState.user.coins -= 150;
            UIEngine.updateHeader();
        }

        if (type === 'free') localStorage.setItem('spin_free_cooldown', Date.now());

        this.executeSpin(type);
    },

    executeSpin(type) {
        const wheel = document.getElementById('main-wheel');
        const btnFree = document.getElementById('btn-spin-free');
        const btnPaid = document.getElementById('btn-spin-paid');
        
        if(btnFree) btnFree.disabled = true;
        if(btnPaid) btnPaid.disabled = true;

        const deg = Math.floor(Math.random() * 360) + 3600; 
        if(wheel) wheel.style.transform = `rotate(${deg}deg)`;

        setTimeout(() => {
            this.showRewardSelection(type);
        }, 4500);
    },

    showRewardSelection(type) {
        const rewards = [];
        
        while (rewards.length < 4) {
            if (Math.random() > 0.3) {
                let key = DropEngine.roll();
                let data = window.HerbData[key];
                rewards.push({ type: 'herb', key: key, name: data.name, img: data.img, rarity: data.rarity });
            } else {
                const boosterPool = window.MarketSystem.shopItems;
                let b = boosterPool[Math.floor(Math.random() * boosterPool.length)];
                rewards.push({ type: 'booster', key: b.id, name: b.name, img: b.icon, rarity: 'Legacy', isIcon: true, data: b });
            }
        }

        const resOverlay = document.createElement('div');
        resOverlay.id = "reward-selection-popup";
        resOverlay.className = "fixed inset-0 bg-black/98 z-[1000] flex items-center justify-center p-6 backdrop-blur-3xl animate-in";
        
        resOverlay.innerHTML = `
            <div class="glass w-full max-w-xs p-6 border border-cyan-500/30 text-center relative shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                <div class="w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-sm flex items-center justify-center mx-auto mb-4 border-2 border-white/20 shadow-lg">
                    <i class="fas fa-microchip text-white text-2xl animate-pulse"></i>
                </div>

                <h3 class="text-xl font-black text-white mb-1 uppercase tracking-[0.1em] italic">Extraction Success</h3>
                <p class="text-[9px] text-cyan-500 mb-6 font-bold uppercase tracking-widest italic">Neural packets synthesized successfully</p>
                
                <div class="grid grid-cols-2 gap-3 mb-6">
                    ${rewards.map(r => `
                        <div class="bg-black/60 p-3 border border-white/5 flex flex-col items-center group">
                            <span class="text-[6px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-400 mb-2 tracking-tighter">${r.rarity}</span>
                            ${r.isIcon ? 
                                `<i class="fas ${r.img} text-2xl text-amber-500 mb-2"></i>` : 
                                `<img src="${r.img}" class="w-10 h-10 object-contain mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">`
                            }
                            <span class="text-[7px] font-black text-white uppercase truncate w-full">${r.name}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="flex flex-col gap-2">
                    <button id="claim-spin-btn" class="w-full py-4 bg-cyan-500 text-black font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-cyan-900/40">
                        ${type === 'free' ? '<i class="fas fa-satellite mr-1"></i> Sync Link (Ad-Proxy)' : 'Sync to Mainframe'}
                    </button>
                    <button onclick="SpinSystem.closeAll()" class="w-full py-2 text-gray-600 text-[8px] font-bold uppercase tracking-widest hover:text-[#ff0055] transition-colors italic">
                        Abort Extraction
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(resOverlay);

        document.getElementById('claim-spin-btn').onclick = () => {
            if (type === 'free') {
                UIEngine.showRewardPopup("PROXY ESTABLISHED", "Routing data through secure ad-server...", () => {
                    this.processClaim(rewards);
                }, "FINISH SYNC");
            } else {
                this.processClaim(rewards);
            }
        };
    },

    processClaim(rewards) {
        this.closeAll();

        rewards.forEach((item, index) => {
            setTimeout(() => {
                if (item.type === 'herb') {
                    GameState.warehouse[item.key] = (GameState.warehouse[item.key] || 0) + 1;
                } else if (item.type === 'booster') {
                    if (item.data.type === 'buff') {
                        if (!GameState.user.activeBuffs) GameState.user.activeBuffs = {};
                        GameState.user.activeBuffs[item.data.buffKey] = Date.now() + 86400000;
                    } else if (item.data.type === 'storage') {
                        GameState.user.extraStorage = (GameState.user.extraStorage || 0) + 20;
                    }
                }
                
                const icon = item.isIcon ? 'https://img.icons8.com/nolan/96/gift.png' : item.img;
                this.playFlyAnimation(icon);
            }, index * 200);
        });

        GameState.save();
        setTimeout(() => {
            UIEngine.showRewardPopup("UPLINK SUCCESS", "Neural buffer updated. Hardware and packets synced.", null, "CONFIRM");
        }, 1200);
    },

    playFlyAnimation(imgUrl) {
        const item = document.createElement('img');
        item.src = imgUrl;
        item.className = "fixed z-[9999] w-12 h-12 object-contain pointer-events-none transition-all duration-1000 cubic-bezier(0.2, 0.8, 0.2, 1)";
        item.style.left = "50%";
        item.style.top = "50%";
        item.style.transform = "translate(-50%, -50%) scale(1.5) filter(drop-shadow(0 0 10px white))";
        document.body.appendChild(item);
        
        setTimeout(() => {
            item.style.left = "80%";
            item.style.top = "40px"; 
            item.style.transform = "translate(-50%, -50%) scale(0.1) rotate(720deg)";
            item.style.opacity = "0";
        }, 50);
        setTimeout(() => item.remove(), 1100);
    },

    updateTimer() {
        const freeBtn = document.getElementById('btn-spin-free');
        const lastSpin = localStorage.getItem('spin_free_cooldown');
        if (!freeBtn || !lastSpin) return;

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const remaining = this.cooldownTime - (Date.now() - parseInt(lastSpin));
            if (remaining > 0) {
                freeBtn.disabled = true;
                freeBtn.classList.add('opacity-30', 'cursor-not-allowed', 'grayscale');
                const mins = Math.floor((remaining / 60000) % 60);
                const secs = Math.floor((remaining / 1000) % 60);
                freeBtn.innerHTML = `<i class="fas fa-history mr-2"></i> Rebooting: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            } else {
                freeBtn.disabled = false;
                freeBtn.classList.remove('opacity-30', 'cursor-not-allowed', 'grayscale');
                freeBtn.innerHTML = `<i class="fas fa-bolt mr-2"></i> Execute Free Hack`;
                clearInterval(this.timerInterval);
            }
        }, 1000);
    },

    closeAll() {
        document.getElementById('reward-selection-popup')?.remove();
        document.getElementById('spin-popup')?.remove();
        if (this.timerInterval) clearInterval(this.timerInterval);
    },

    close() { this.closeAll(); }
};

window.SpinSystem = SpinSystem;