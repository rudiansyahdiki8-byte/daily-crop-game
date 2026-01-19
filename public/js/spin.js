// js/spin.js
// Logic: Visual & Animasi. Hasil ditentukan API.

const SpinSystem = {
    isSpinning: false,

    show() {
        const overlay = document.createElement('div');
        overlay.id = 'spin-modal';
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in";
        
        // Cek Cooldown untuk UI
        const now = Date.now();
        const lastFree = GameState.user.spin_free_cooldown || 0;
        const freeWait = (window.GameConfig?.Spin?.CooldownFree || 3600000);
        const isFreeReady = (now - lastFree) > freeWait;
        
        const cost = window.GameConfig?.Spin?.CostPaid || 150;

        overlay.innerHTML = `
            <div class="w-full max-w-sm flex flex-col items-center relative">
                <h2 class="text-3xl font-black text-white italic uppercase tracking-wider mb-8 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">Lucky Wheel</h2>
                
                <div class="relative w-72 h-72 mb-10">
                    <div class="absolute inset-0 rounded-full border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(255,215,0,0.2)]"></div>
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl text-white z-20 drop-shadow-xl">⬇</div>
                    
                    <div id="wheel-rotate" class="w-full h-full rounded-full relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.25, 1, 0.5, 1)" style="background: conic-gradient(
                        #fbbf24 0deg 45deg, 
                        #1f2937 45deg 90deg, 
                        #fbbf24 90deg 135deg, 
                        #1f2937 135deg 180deg, 
                        #fbbf24 180deg 225deg, 
                        #1f2937 225deg 270deg, 
                        #fbbf24 270deg 315deg, 
                        #1f2937 315deg 360deg
                    );">
                        <div class="absolute inset-0 flex justify-center pt-2"><span class="text-xs font-bold text-black rotate-0">50</span></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-45"><i class="fas fa-leaf text-white/50 text-xl"></i></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-90"><span class="text-xs font-bold text-black">1K</span></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-[135deg]"><i class="fas fa-leaf text-white/50 text-xl"></i></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-180"><span class="text-xs font-bold text-black">200</span></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-[225deg]"><i class="fas fa-star text-purple-400 text-xl"></i></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-[270deg]"><span class="text-xs font-bold text-black">10K</span></div>
                        <div class="absolute inset-0 flex justify-center pt-2 rotate-[315deg]"><span class="text-xs font-bold text-white">50</span></div>
                    </div>
                    
                    <div class="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full border-4 border-yellow-500 flex items-center justify-center shadow-lg">
                        <i class="fas fa-gem text-yellow-600"></i>
                    </div>
                </div>

                <div class="flex gap-4 w-full">
                    <button onclick="SpinSystem.spin('free')" class="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-2xl shadow-lg active:scale-95 transition-all ${!isFreeReady ? 'opacity-50 grayscale cursor-not-allowed' : ''}">
                        <div class="text-[10px] font-black text-white uppercase tracking-wider">Free Spin</div>
                        <div class="text-[8px] text-blue-200 mt-1">${isFreeReady ? 'READY' : 'COOLDOWN'}</div>
                    </button>
                    
                    <button onclick="SpinSystem.spin('paid')" class="flex-1 bg-gradient-to-br from-yellow-500 to-yellow-700 p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                        <div class="text-[10px] font-black text-white uppercase tracking-wider">Paid Spin</div>
                        <div class="text-[8px] text-yellow-100 mt-1 font-bold">-${cost} PTS</div>
                    </button>
                </div>

                <button onclick="document.getElementById('spin-modal').remove()" class="mt-6 text-gray-400 text-xs underline">Close</button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async spin(type) {
        if (this.isSpinning) return;
        
        // Frontend Check
        if (type === 'paid') {
            const cost = window.GameConfig?.Spin?.CostPaid || 150;
            if (GameState.user.coins < cost) {
                UIEngine.showRewardPopup("POOR", "Not enough coins!", null, "OK");
                return;
            }
        } else {
            const now = Date.now();
            const lastFree = GameState.user.spin_free_cooldown || 0;
            const freeWait = (window.GameConfig?.Spin?.CooldownFree || 3600000);
            if (now - lastFree < freeWait) {
                UIEngine.showRewardPopup("WAIT", "Free spin is cooling down.", null, "OK");
                return;
            }
        }

        this.isSpinning = true;
        const wheel = document.getElementById('wheel-rotate');
        
        // Efek putar awal (agar user tau sedang loading)
        wheel.style.transition = "transform 0.5s linear infinite";
        // Putar sedikit
        
        try {
            // PANGGIL API
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: GameState.user.userId, type: type })
            });
            const result = await response.json();

            if (result.success) {
                // Update State (Koin berkurang/bertambah)
                GameState.user = { ...GameState.user, ...result.user };
                if (result.warehouse) GameState.warehouse = result.warehouse;
                UIEngine.updateHeader();

                // HITUNG SUDUT BERHENTI
                // Ada 8 segmen, tiap segmen 45 derajat.
                // Index 0 ada di 0 derajat (atas).
                // Kita harus memutar roda BERLAWANAN arah target agar target jatuh di bawah panah (top).
                // Rumus: (360 - (targetIndex * 45)) + (Putaran Penuh * 360)
                const segmentAngle = 45;
                const targetAngle = 360 - (result.targetIndex * segmentAngle); 
                const totalRotation = 3600 + targetAngle; // 10x putaran + target

                wheel.style.transition = "transform 4s cubic-bezier(0.25, 1, 0.5, 1)";
                wheel.style.transform = `rotate(${totalRotation}deg)`;

                // Tunggu animasi selesai (4s)
                setTimeout(() => {
                    this.isSpinning = false;
                    let msg = result.reward.type === 'coin' ? `You won ${result.reward.val} PTS!` : `You got ${result.reward.name}!`;
                    UIEngine.showRewardPopup("JACKPOT!", msg, null, "CLAIM");
                    
                    // Refresh UI Cooldown jika Free Spin
                    if(type === 'free') {
                        document.getElementById('spin-modal').remove(); // Tutup & Buka lagi biar refresh status tombol
                        this.show(); 
                    }
                }, 4000);

            } else {
                this.isSpinning = false;
                wheel.style.transition = "none";
                wheel.style.transform = "rotate(0deg)";
                UIEngine.showRewardPopup("ERROR", result.error || "Spin Failed", null, "CLOSE");
            }

        } catch (e) {
            console.error(e);
            this.isSpinning = false;
            UIEngine.showRewardPopup("ERROR", "Connection Error", null, "CLOSE");
        }
    }
};

window.SpinSystem = SpinSystem;
