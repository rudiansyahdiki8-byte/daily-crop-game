// js/spin.js
// Flow Update: Spin First -> Result -> Watch Ad to Claim (Loss Aversion)
// Config Update: Semua angka diambil dari window.GameConfig.Spin

const SpinSystem = {
    // Cooldown dari Config (Default 1 Jam)
    cooldownTime: window.GameConfig.Spin.CooldownFree, 
    isSpinning: false,

    // DEFINISI 8 SEGMEN RODA (Visual Urut Jarum Jam)
    // Label dan Value sekarang dinamis mengikuti Config
    segments: [
        { id: 'coin_low', type: 'coin', val: window.GameConfig.Spin.RewardCoinLow, label: `${window.GameConfig.Spin.RewardCoinLow} PTS`, color: '#60a5fa', icon: 'fa-coins' },       
        { id: 'herb_common', type: 'herb', rarity: 'Common', label: 'Common', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 'coin_high', type: 'coin', val: window.GameConfig.Spin.RewardCoinHigh, label: `${window.GameConfig.Spin.RewardCoinHigh} PTS`, color: '#fbbf24', icon: 'fa-coins' },     
        { id: 'herb_common', type: 'herb', rarity: 'Common', label: 'Common', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 'coin_mid', type: 'coin', val: window.GameConfig.Spin.RewardCoinMid, label: `${window.GameConfig.Spin.RewardCoinMid} PTS`, color: '#60a5fa', icon: 'fa-coins' },     
        { id: 'herb_rare', type: 'herb', rarity: 'Rare', label: 'Rare', color: '#c084fc', icon: 'fa-star' },       
        { id: 'jackpot', type: 'jackpot', val: window.GameConfig.Spin.Jackpot, label: 'JACKPOT', color: '#f43f5e', icon: 'fa-gem' },    
        { id: 'coin_low', type: 'coin', val: window.GameConfig.Spin.RewardCoinLow, label: `${window.GameConfig.Spin.RewardCoinLow} PTS`, color: '#60a5fa', icon: 'fa-coins' }         
    ],

    show() {
        const overlay = document.createElement('div');
        overlay.id = "spin-popup";
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-4 animate-in";
        
        // CSS INJECTION UNTUK RODA
        const style = document.createElement('style');
        style.innerHTML = `
            .wheel-container { position: relative; width: 280px; height: 280px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 0 50px rgba(16,185,129,0.2); transition: transform 4s cubic-bezier(0.15, 0, 0.15, 1); }
            .pointer-arrow { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid #fbbf24; z-index: 50; filter: drop-shadow(0 4px 2px rgba(0,0,0,0.5)); }
        `;
        overlay.appendChild(style);

        // GENERATE VISUAL RODA
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
        
        // Perbaikan: Menampilkan Harga Spin Paid dari Config di Tombol
        const spinCost = window.GameConfig.Spin.CostPaid;

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

        try {
            const response = await fetch('/api/game/rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: window.Telegram.WebApp.initData,
                    action: 'SPIN',
                    payload: { type: type }
                })
            });

            const data = await response.json();
            if (data.success) {
                // Jalankan animasi visual ke index yang ditentukan server
                this.executeSpin(data.result.index, () => {
                    GameState.user.coins = data.newBalance;
                    UIEngine.updateHeader();
                    UIEngine.showRewardPopup("LUCKY!", data.rewardMsg, null, "AWESOME");
                });
            } else {
                UIEngine.showRewardPopup("DENIED", data.error, null, "OK");
            }
        } catch (e) {
            console.error("Spin error", e);
        }
    },
    executeSpin(type) {
        this.isSpinning = true;
        const wheel = document.getElementById('real-wheel');
        const btnFree = document.getElementById('btn-spin-free');
        const btnPaid = document.getElementById('btn-spin-paid');
        if(btnFree) btnFree.disabled = true;
        if(btnPaid) btnPaid.disabled = true;

        // --- ALGORITMA GACHA (Weighted) ---
        // Peluang tetap di sini (Hardcoded logic is fine for now)
        const rand = Math.random() * 100;
        let targetIndex = 0; 
        
        // 40% Koin Kecil, 30% Common, 20% Koin Sedang, 9% Rare, 1% Jackpot
        if (rand < 40) { const opts = [0, 4, 7]; targetIndex = opts[Math.floor(Math.random() * opts.length)]; } 
        else if (rand < 70) { const opts = [1, 3]; targetIndex = opts[Math.floor(Math.random() * opts.length)]; }
        else if (rand < 90) { targetIndex = 2; }
        else if (rand < 99) { targetIndex = 5; }
        else { targetIndex = 6; } // JACKPOT

        // Hitung Rotasi Visual
        const segmentAngle = 360 / 8;
        const randomOffset = Math.floor(Math.random() * 20) - 10; 
        const spinRounds = 5 * 360;
        const targetRotation = spinRounds + (360 - (targetIndex * segmentAngle)) + randomOffset;

        wheel.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
        wheel.style.transform = `rotate(${targetRotation}deg)`;

        // Selesai Muter -> Tampilkan Result Logic
        setTimeout(() => {
            this.handleResult(this.segments[targetIndex], type);
            this.isSpinning = false;
        }, 4000);
    },

    handleResult(prize, type) {
        // Tentukan nama hadiah (Jika Herb, pilih random dari rarity-nya)
        let finalPrizeName = prize.label;
        let finalPrizeKey = null;

        if (prize.type === 'herb') {
            // Ambil Data Tanaman yang sudah connect ke Config (via HerbData)
            const candidates = Object.keys(window.HerbData).filter(k => window.HerbData[k].rarity === prize.rarity);
            if(candidates.length > 0) {
                finalPrizeKey = candidates[Math.floor(Math.random() * candidates.length)];
                finalPrizeName = window.HerbData[finalPrizeKey].name;
            }
        }

        // --- LOGIC FREE VS PAID ---
        if (type === 'paid') {
            this.grantReward(prize, finalPrizeKey);
            UIEngine.showRewardPopup("CONGRATULATIONS", `You got ${finalPrizeName}!`, null, "AWESOME");
        } 
        else {
            // FREE: Tampilkan Popup "Claim with Ad"
            UIEngine.showRewardPopup(
                "YOU WON!", 
                `<div class="flex flex-col items-center gap-2">
                    <span class="text-3xl animate-bounce">${prize.icon ? `<i class="fas ${prize.icon}" style="color:${prize.color}"></i>` : '🎁'}</span>
                    <span class="text-lg font-black text-white uppercase">${finalPrizeName}</span>
                    <span class="text-[9px] text-gray-400">Watch Ad to claim this reward!</span>
                </div>`, 
                () => {
                    // PANGGIL IKLAN DI SINI
                    AdsManager.showHybridStack(2, () => {
                        this.grantReward(prize, finalPrizeKey);
                        UIEngine.showRewardPopup("CLAIMED", `${finalPrizeName} added to inventory!`, null, "NICE");
                    });
                }, 
                "WATCH AD & CLAIM"
            );
        }        
        document.getElementById('spin-popup')?.remove();
        if (this.timerInterval) clearInterval(this.timerInterval);
    },

    async grantReward(prize, herbKey) {
        if (prize.type === 'coin' || prize.type === 'jackpot') {
            GameState.user.coins += prize.val;
        } 
        else if (prize.type === 'herb' && herbKey) {
            GameState.warehouse[herbKey] = (GameState.warehouse[herbKey] || 0) + 1;
        }

        await GameState.save();
        if(window.UIEngine) UIEngine.updateHeader();
    }
};

SpinSystem.updateTimer = function() {
    const freeBtn = document.getElementById('btn-spin-free');
    const lastSpin = GameState.user.spin_free_cooldown || 0;
    if (!freeBtn) return;
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    // Timer pakai Cooldown dari Config
    const cdTime = this.cooldownTime; 

    this.timerInterval = setInterval(() => {
        const remaining = cdTime - (Date.now() - parseInt(lastSpin));
        if (remaining > 0) {
            freeBtn.disabled = true; 
            freeBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
            const mins = Math.floor((remaining / 60000) % 60); const secs = Math.floor((remaining / 1000) % 60);
            freeBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-clock"></i> Wait ${mins}:${secs < 10 ? '0' : ''}${secs}</span>`;
        } else {
            freeBtn.disabled = false; 
            freeBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
            freeBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-play-circle group-hover:rotate-12 transition-transform"></i> Spin Free</span>`;
            clearInterval(this.timerInterval);
        }
    }, 1000);
};

SpinSystem.close = function() { if(!this.isSpinning) { document.getElementById('spin-popup')?.remove(); if (this.timerInterval) clearInterval(this.timerInterval); } };


window.SpinSystem = SpinSystem;


