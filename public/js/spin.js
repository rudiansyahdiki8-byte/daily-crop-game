// js/spin.js
// Flow: (Free) Watch Ad -> Call Server -> Spin Animation -> Show Result
// Flow: (Paid) Call Server -> Spin Animation -> Show Result

const SpinSystem = {
    cooldownTime: window.GameConfig.Spin?.CooldownFree || 3600000, 
    isSpinning: false,

    // VISUAL SEGMEN (Harus urut sesuai logika API server 0-7)
    segments: [
        { id: 0, label: 'LOW', color: '#60a5fa', icon: 'fa-coins' },       
        { id: 1, label: 'HERB', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 2, label: 'HIGH', color: '#fbbf24', icon: 'fa-coins' },     
        { id: 3, label: 'HERB', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 4, label: 'MID', color: '#60a5fa', icon: 'fa-coins' },     
        { id: 5, label: 'RARE', color: '#c084fc', icon: 'fa-star' },       
        { id: 6, label: 'JACKPOT', color: '#f43f5e', icon: 'fa-gem' },    
        { id: 7, label: 'LOW', color: '#60a5fa', icon: 'fa-coins' }         
    ],

    show() {
        if(document.getElementById('spin-popup')) return;
        
        const overlay = document.createElement('div');
        overlay.id = "spin-popup";
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-4 animate-in";
        
        const style = document.createElement('style');
        style.innerHTML = `
            .wheel-container { position: relative; width: 280px; height: 280px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 0 50px rgba(16,185,129,0.2); transition: transform 4s cubic-bezier(0.15, 0, 0.15, 1); }
            .pointer-arrow { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid #fbbf24; z-index: 50; filter: drop-shadow(0 4px 2px rgba(0,0,0,0.5)); }
        `;
        overlay.appendChild(style);

        let wheelHTML = '';
        this.segments.forEach((seg, i) => {
            const rotation = i * 45; 
            wheelHTML += `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(${rotation}deg);">
                    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); height: 50%; width: 2px; transform-origin: bottom center;"></div>
                    <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); text-align: center;">
                        <div class="flex flex-col items-center gap-1">
                            <i class="fas ${seg.icon} text-lg drop-shadow-md" style="color: ${seg.color}"></i>
                            <span class="text-[8px] font-black uppercase text-white drop-shadow-md tracking-wider">${seg.label}</span>
                        </div>
                    </div>
                </div>`;
        });
        const gradientColors = this.segments.map((s, i) => `${s.color} ${i * 12.5}% ${(i + 1) * 12.5}%`).join(', ');
        const spinCost = window.GameConfig.Spin?.CostPaid || 1000;

        overlay.innerHTML = `
            <div class="glass w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 text-center relative overflow-hidden shadow-2xl flex flex-col items-center">
                <button onclick="SpinSystem.close()" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20"><i class="fas fa-times text-xs"></i></button>
                
                <h2 class="text-2xl font-black text-white mb-1 uppercase italic tracking-widest text-indigo-400 drop-shadow-lg">Lucky Spin</h2>
                <p class="text-[9px] text-gray-400 font-bold mb-6 uppercase tracking-widest">Test Your Luck!</p>

                <div class="relative mb-8">
                    <div class="pointer-arrow"></div>
                    <div id="real-wheel" class="wheel-container" style="background: conic-gradient(${gradientColors});">
                        ${wheelHTML}
                        <div class="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full border-4 border-indigo-500 shadow-lg flex items-center justify-center z-10">
                            <div class="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div class="w-full flex flex-col gap-3 relative z-20">
                    <button id="btn-spin-free" onclick="SpinSystem.start('free')" class="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg border border-white/10 group active:scale-95 transition-all">
                        <span class="flex items-center justify-center gap-2"><i class="fas fa-play-circle group-hover:rotate-12 transition-transform"></i> Spin Free</span>
                    </button>
                    <button id="btn-spin-paid" onclick="SpinSystem.start('paid')" class="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 active:scale-95 transition-all">
                        <span class="flex items-center justify-center gap-2"><i class="fas fa-coins text-amber-400"></i> Spin (${spinCost} PTS)</span>
                    </button>
                </div>
            </div>
        `;
        overlay.appendChild(style);
        document.body.appendChild(overlay);
        this.updateTimer();
    },

    async start(type) {
        if (this.isSpinning) return;
        
        // 1. Logic Free: Nonton Iklan Dulu
        if (type === 'free') {
            // Cek Timer Client Side (Pre-check)
            const lastSpin = GameState.user.spin_free_cooldown || 0;
            const remaining = this.cooldownTime - (Date.now() - parseInt(lastSpin));
            if (remaining > 0) {
                UIEngine.showRewardPopup("COOLDOWN", "Please wait before spinning again.", null, "OK");
                return;
            }

            // Panggil Iklan
            if(window.AdsManager) {
                AdsManager.showHybridStack(2, () => {
                    this.callServer(type); // Iklan Sukses -> Call Server
                });
            } else {
                this.callServer(type); // Fallback jika ads blocked
            }
        } 
        // 2. Logic Paid: Langsung Server
        else {
            const cost = window.GameConfig.Spin?.CostPaid || 1000;
            if (GameState.user.coins < cost) {
                UIEngine.showRewardPopup("NO COINS", `Need ${cost} PTS to spin.`, null, "CLOSE");
                return;
            }
            this.callServer(type);
        }
    },

    async callServer(type) {
        this.isSpinning = true;
        
        // Disable Tombol
        const btnFree = document.getElementById('btn-spin-free');
        const btnPaid = document.getElementById('btn-spin-paid');
        if(btnFree) btnFree.disabled = true;
        if(btnPaid) btnPaid.disabled = true;

        try {
            // REQUEST KE API
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: GameState.user.userId, type: type })
            });
            const result = await response.json();

            if (result.success) {
                // Update State (Koin berkurang/bertambah sudah diurus server)
                // Kita update lokal agar UI sinkron
                GameState.user.coins = result.userCoins;
                if(result.userCooldown) GameState.user.spin_free_cooldown = result.userCooldown;
                if(result.warehouse) GameState.warehouse = result.warehouse;

                // PUTAR RODA VISUAL SESUAI HASIL SERVER
                this.animateWheel(result.targetIndex, result.reward);
            } else {
                UIEngine.showRewardPopup("ERROR", result.error || "Spin Failed", null, "CLOSE");
                this.isSpinning = false;
                this.updateTimer();
            }

        } catch (e) {
            console.error(e);
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "RETRY");
            this.isSpinning = false;
            this.updateTimer();
        }
    },

    animateWheel(targetIndex, reward) {
        const wheel = document.getElementById('real-wheel');
        if(!wheel) return;

        // Hitung Rotasi
        // 0 derajat ada di atas (12 jam). Target index 0 ada di 0 derajat.
        // Kita perlu memutar papan agar index target mendarat di arah jarum (atas).
        const segmentAngle = 360 / 8;
        // Agar target ada di atas, rotasi harus negatif (berlawanan) atau 360 - target
        // Random offset agar tidak selalu tepat di tengah garis
        const randomOffset = Math.floor(Math.random() * 20) - 10; 
        const spinRounds = 5 * 360; // 5 putaran penuh
        const targetRotation = spinRounds + (360 - (targetIndex * segmentAngle)) + randomOffset;

        wheel.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
        wheel.style.transform = `rotate(${targetRotation}deg)`;

        // Setelah Animasi Selesai
        setTimeout(() => {
            this.isSpinning = false;
            UIEngine.updateHeader(); // Update koin di header
            UIEngine.showRewardPopup(
                "CONGRATULATIONS", 
                `<div class="flex flex-col items-center gap-2">
                    <span class="text-3xl animate-bounce">🎁</span>
                    <span class="text-lg font-black text-white uppercase">${reward.name}</span>
                    <span class="text-[9px] text-gray-400">Has been added to your account!</span>
                </div>`, 
                null, 
                "AWESOME"
            );
            this.updateTimer();
        }, 4000);
    },

    updateTimer: function() {
        const freeBtn = document.getElementById('btn-spin-free');
        const lastSpin = GameState.user.spin_free_cooldown || 0;
        if (!freeBtn) return;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const cdTime = this.cooldownTime; 

        this.timerInterval = setInterval(() => {
            const remaining = cdTime - (Date.now() - parseInt(lastSpin));
            if (remaining > 0) {
                freeBtn.disabled = true; 
                freeBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
                const mins = Math.floor((remaining / 60000) % 60); 
                const secs = Math.floor((remaining / 1000) % 60);
                freeBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-clock"></i> Wait ${mins}:${secs < 10 ? '0' : ''}${secs}</span>`;
            } else {
                freeBtn.disabled = false; 
                freeBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
                freeBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-play-circle group-hover:rotate-12 transition-transform"></i> Spin Free</span>`;
                clearInterval(this.timerInterval);
            }
        }, 1000);
    },

    close: function() { 
        if(!this.isSpinning) { 
            document.getElementById('spin-popup')?.remove(); 
            if (this.timerInterval) clearInterval(this.timerInterval); 
        } 
    }
};

window.SpinSystem = SpinSystem;
