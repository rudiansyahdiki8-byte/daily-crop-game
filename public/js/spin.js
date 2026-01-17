// js/spin.js
// ==========================================
// SPIN SYSTEM (SERVER-SIDE INTEGRATED)
// Logika hadiah ditentukan server, frontend hanya animasi.
// ==========================================

const SpinSystem = {
    // Ambil Config dari Window (File config.js)
    cooldownTime: window.GameConfig.Spin.CooldownFree || 3600000, 
    isSpinning: false,
    pendingResult: null, // Tempat simpan hasil server sementara
    spinType: null,

    // DEFINISI 8 SEGMEN RODA (Visual Urut Jarum Jam)
    // Urutan ini HARUS sama dengan logika di api/spin.js agar gambarnya pas
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

    // --- 1. TAMPILKAN POPUP RODA (Visual) ---
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

    // --- 2. MULAI SPIN (LOGIK SERVER) ---
    async start(type) {
        if (this.isSpinning) return;

        // Validasi Awal Client-Side (Visual Only)
        if (type === 'paid') {
            const cost = window.GameConfig.Spin.CostPaid;
            if (GameState.user.coins < cost) {
                UIEngine.showRewardPopup("NO COINS", `Need ${cost} PTS to spin.`, null, "CLOSE");
                return;
            }
        }

        this.isSpinning = true;
        const btnFree = document.getElementById('btn-spin-free');
        const btnPaid = document.getElementById('btn-spin-paid');
        if(btnFree) btnFree.disabled = true;
        if(btnPaid) btnPaid.disabled = true;

        try {
            // --- PANGGIL SERVER ---
            // "Halo Server, tolong putarkan roda untuk saya"
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    type: type
                })
            });

            const result = await response.json();

            if (!result.success) {
                // Gagal (Misal cooldown belum beres)
                UIEngine.showRewardPopup("FAILED", result.message, null, "OK");
                this.isSpinning = false;
                if(btnFree) btnFree.disabled = false;
                if(btnPaid) btnPaid.disabled = false;
                return;
            }

            // --- SUKSES: JALANKAN ANIMASI ---
            const targetIndex = result.targetIndex; // Server menentukan posisi berhenti
            
            // Simpan hasil server untuk ditampilkan nanti
            this.pendingResult = result; 
            this.spinType = type;

            // Update Cooldown Lokal (Agar timer langsung jalan)
            if (type === 'free') {
                GameState.user.spin_free_cooldown = Date.now();
                this.updateTimer();
            } else {
                // Update Koin Lokal sementara (Visual only, data asli ada di server)
                GameState.user.coins -= window.GameConfig.Spin.CostPaid;
                UIEngine.updateHeader();
            }

            // LOGIKA ROTASI CSS
            const wheel = document.getElementById('real-wheel');
            const segmentAngle = 360 / 8;
            const randomOffset = Math.floor(Math.random() * 20) - 10; 
            const spinRounds = 5 * 360; 
            // Rumus posisi berhenti
            const targetRotation = spinRounds + (360 - (targetIndex * segmentAngle)) + randomOffset;

            wheel.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
            wheel.style.transform = `rotate(${targetRotation}deg)`;

            // TUNGGU ANIMASI SELESAI (4 Detik)
            setTimeout(() => {
                this.finishSpin();
            }, 4000);

        } catch (error) {
            console.error("Spin API Error:", error);
            UIEngine.showRewardPopup("ERROR", "Connection failed.", null, "RETRY");
            this.isSpinning = false;
        }
    },

    // --- 3. SELESAI SPIN (KLAIM HADIAH) ---
    finishSpin() {
        const result = this.pendingResult;
        if (!result) return;

        // Ambil Data Visual Segmen Hadiah
        const prizeSegment = this.segments[result.targetIndex]; 
        
        // --- LOGIC FREE VS PAID ---
        if (this.spinType === 'paid') {
            // Berbayar: Langsung masuk inventory
            this.applyResultToState(result);
            UIEngine.showRewardPopup("CONGRATULATIONS", `You got ${result.rewardName || prizeSegment.label}!`, null, "AWESOME");
        } 
        else {
            // Gratis: Harus nonton iklan dulu
            UIEngine.showRewardPopup(
                "YOU WON!", 
                `<div class="flex flex-col items-center gap-2">
                    <span class="text-3xl animate-bounce">${prizeSegment.icon ? `<i class="fas ${prizeSegment.icon}" style="color:${prizeSegment.color}"></i>` : '🎁'}</span>
                    <span class="text-lg font-black text-white uppercase">${result.rewardName || prizeSegment.label}</span>
                    <span class="text-[9px] text-gray-400">Watch Ad to claim this reward!</span>
                </div>`, 
                () => {
                    // PANGGIL IKLAN
                    AdsManager.showHybridStack(2, async () => {
                        this.applyResultToState(result);
                        UIEngine.showRewardPopup("CLAIMED", "Reward added to inventory!", null, "NICE");
                    });
                }, 
                "WATCH AD & CLAIM"
            );
        }

        this.isSpinning = false;
        // Tombol akan diupdate oleh updateTimer
    },

    // --- 4. UPDATE STATE LOKAL ---
    async applyResultToState(result) {
        // Sinkronisasi data lokal dengan hasil server
        if (result.rewardType === 'coin' || result.rewardType === 'jackpot') {
            GameState.user.coins += result.rewardValue; 
        } 
        else if (result.rewardType === 'herb') {
            const key = result.rewardKey;
            GameState.warehouse[key] = (GameState.warehouse[key] || 0) + 1;
        }

        await GameState.save();
        if(window.UIEngine) UIEngine.updateHeader();
    },

    // --- 5. TIMER COOLDOWN ---
    updateTimer() {
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

    close() { 
        if(!this.isSpinning) { 
            document.getElementById('spin-popup')?.remove(); 
            if (this.timerInterval) clearInterval(this.timerInterval); 
        } 
    }
};

window.SpinSystem = SpinSystem;