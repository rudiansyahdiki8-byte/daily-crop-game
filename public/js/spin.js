// js/spin.js
// FIXED: Ads Restore, Correct Titles, No Spam

const SpinSystem = {
    isSpinning: false,

    show() {
        // ... (Render UI Overlay HTML sama seperti sebelumnya) ...
        // Gunakan kode HTML render yang sama, saya persingkat di sini agar fokus ke Logic
        const overlay = document.createElement('div');
        overlay.id = 'spin-modal';
        overlay.className = "fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in";
        
        // Cek Waktu
        const now = Date.now();
        const lastFree = GameState.user.spin_free_cooldown || 0;
        const freeWait = (window.GameConfig?.Spin?.CooldownFree || 3600000);
        const isFreeReady = (now - lastFree) > freeWait;
        const cost = window.GameConfig?.Spin?.CostPaid || 150;

        overlay.innerHTML = `
            <div class="w-full max-w-sm flex flex-col items-center relative">
                <h2 class="text-3xl font-black text-white italic uppercase tracking-wider mb-8">Lucky Wheel</h2>
                
                <div class="relative w-72 h-72 mb-10">
                    <div class="absolute inset-0 rounded-full border-4 border-yellow-500/50"></div>
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl text-white z-20">⬇</div>
                    <div id="wheel-rotate" class="w-full h-full rounded-full relative overflow-hidden" style="background: conic-gradient(#fbbf24 0deg 45deg, #1f2937 45deg 90deg, #fbbf24 90deg 135deg, #1f2937 135deg 180deg, #fbbf24 180deg 225deg, #1f2937 225deg 270deg, #fbbf24 270deg 315deg, #1f2937 315deg 360deg);"></div>
                </div>

                <div class="flex gap-4 w-full">
                    <button onclick="SpinSystem.handleSpinClick('free')" class="flex-1 bg-blue-600 p-4 rounded-2xl shadow-lg ${!isFreeReady ? 'opacity-50 cursor-not-allowed' : ''}">
                        <div class="text-[10px] font-black text-white uppercase">Free Spin</div>
                        <div class="text-[8px] text-blue-200 mt-1">${isFreeReady ? 'WATCH AD' : 'COOLDOWN'}</div>
                    </button>
                    
                    <button onclick="SpinSystem.handleSpinClick('paid')" class="flex-1 bg-yellow-600 p-4 rounded-2xl shadow-lg">
                        <div class="text-[10px] font-black text-white uppercase">Paid Spin</div>
                        <div class="text-[8px] text-yellow-100 mt-1">-${cost} PTS</div>
                    </button>
                </div>
                <button onclick="document.getElementById('spin-modal').remove()" class="mt-6 text-gray-400 text-xs">Close</button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // [FIX] Handler Klik dengan IKLAN
    handleSpinClick(type) {
        if (this.isSpinning) return;

        if (type === 'free') {
            const now = Date.now();
            const lastFree = GameState.user.spin_free_cooldown || 0;
            const freeWait = (window.GameConfig?.Spin?.CooldownFree || 3600000);
            
            // Cek Cooldown di Frontend
            if (now - lastFree < freeWait) {
                UIEngine.showRewardPopup("WAIT", "Please wait for cooldown.", null, "OK");
                return;
            }

            // [FIX] Panggil Iklan Dulu!
            if (window.AdsManager && window.AdsManager.showHybridStack) {
                AdsManager.showHybridStack(4, () => {
                    // Jika iklan selesai, baru putar
                    this.runSpinAPI('free');
                });
            } else {
                // Fallback jika ads block/error
                this.runSpinAPI('free');
            }
        } 
        else if (type === 'paid') {
            const cost = window.GameConfig?.Spin?.CostPaid || 150;
            if (GameState.user.coins < cost) {
                UIEngine.showRewardPopup("POOR", "Not enough coins!", null, "OK");
                return;
            }
            this.runSpinAPI('paid');
        }
    },

    async runSpinAPI(type) {
        this.isSpinning = true;
        const wheel = document.getElementById('wheel-rotate');
        if(wheel) wheel.style.transition = "transform 0.2s linear infinite"; // Putar cepat loading
        
        try {
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: GameState.user.userId, type: type })
            });
            const result = await response.json();

            if (result.success) {
                // Update State
                GameState.user = { ...GameState.user, ...result.user }; 
                if (result.warehouse) GameState.warehouse = result.warehouse;
                UIEngine.updateHeader();

                // Animasi Putar ke Target
                const segmentAngle = 45;
                const targetAngle = 360 - (result.targetIndex * segmentAngle); 
                const totalRotation = 3600 + targetAngle; 

                if(wheel) {
                    wheel.style.transition = "transform 4s cubic-bezier(0.25, 1, 0.5, 1)";
                    wheel.style.transform = `rotate(${totalRotation}deg)`;
                }

                setTimeout(() => {
                    this.isSpinning = false;
                    
                    // [FIX] Judul Popup Dinamis (Bukan Jackpot Semua)
                    let title = "CONGRATS";
                    let btnText = "CLAIM";
                    
                    if (result.reward.val >= 1000) { title = "JACKPOT!"; btnText = "RICH!"; }
                    else if (result.reward.type === 'herb') { title = "ITEM GET"; }
                    else if (result.reward.val <= 50) { title = "NICE"; btnText = "OK"; }

                    let msg = result.reward.type === 'coin' ? `You won ${result.reward.val} PTS!` : `You got ${result.reward.name}!`;
                    
                    UIEngine.showRewardPopup(title, msg, null, btnText);
                    
                    // Refresh UI agar tombol Free jadi Cooldown
                    const modal = document.getElementById('spin-modal');
                    if(modal) { modal.remove(); this.show(); }

                }, 4000);
            } else {
                this.isSpinning = false;
                UIEngine.showRewardPopup("ERROR", result.error || "Failed", null, "CLOSE");
            }
        } catch (e) {
            this.isSpinning = false;
            console.error(e);
        }
    }
};

window.SpinSystem = SpinSystem;
