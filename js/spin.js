// js/spin.js
// Flow Update: Spin First -> Result -> Check Membership for Ad Bypass
// Config Update: Semua angka diambil dari window.GameConfig.Spin

const SpinSystem = {
    // Cooldown dari Config (Default 1 Jam)
    cooldownTime: window.GameConfig.Spin.CooldownFree || 3600000, 
    isSpinning: false,

    // DEFINISI 8 SEGMEN RODA (Visual Urut Jarum Jam)
    // Label dan Value sekarang dinamis mengikuti Config
    segments: [
        { id: 'coin_low', type: 'coin', val: window.GameConfig.Spin.RewardCoinLow, label: `${window.GameConfig.Spin.RewardCoinLow} PTS`, color: '#60a5fa', icon: 'fa-coins' },       
        { id: 'herb_common', type: 'herb', rarity: 'Common', label: 'Common', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 'coin_high', type: 'coin', val: window.GameConfig.Spin.RewardCoinHigh, label: `${window.GameConfig.Spin.RewardCoinHigh} PTS`, color: '#fbbf24', icon: 'fa-coins' },     
        { id: 'herb_common', type: 'herb', rarity: 'Common', label: 'Common', color: '#4ade80', icon: 'fa-leaf' }, 
        { id: 'coin_mid', type: 'coin', val: window.GameConfig.Spin.RewardCoinMid, label: `${window.GameConfig.Spin.RewardCoinMid} PTS`, color: '#fbbf24', icon: 'fa-coins' },       
        { id: 'herb_rare', type: 'herb', rarity: 'Rare', label: 'Rare', color: '#a78bfa', icon: 'fa-star' },       
        { id: 'jackpot', type: 'coin', val: window.GameConfig.Spin.Jackpot, label: 'JACKPOT', color: '#f472b6', icon: 'fa-gem' },     
        { id: 'herb_epic', type: 'herb', rarity: 'Epic', label: 'Epic', color: '#f87171', icon: 'fa-crown' }          
    ],

    show() {
        if (document.getElementById('spin-popup')) return;
        
        // Cek Cooldown untuk tombol Free
        const lastSpin = GameState.user.spin_free_cooldown || 0;
        const now = Date.now();
        const isFreeReady = (now - lastSpin) > this.cooldownTime;
        
        // Harga Spin Berbayar
        const cost = window.GameConfig.Spin.CostPaid || 150;

        const popup = document.createElement('div');
        popup.id = 'spin-popup';
        popup.className = "fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in";
        
        popup.innerHTML = `
            <div class="relative w-full max-w-sm mx-4">
                <div class="glass rounded-[2.5rem] p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    
                    <div class="text-center mb-6 relative z-10">
                        <h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-lg">Lucky Wheel</h2>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Spin to Win Prizes!</p>
                    </div>

                    <button onclick="document.getElementById('spin-popup').remove()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20"><i class="fas fa-times text-xs"></i></button>

                    <div class="relative w-64 h-64 mb-6">
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 text-red-500 text-3xl drop-shadow-lg"><i class="fas fa-caret-down"></i></div>
                        
                        <div id="wheel-inner" class="w-full h-full rounded-full border-[6px] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden relative transition-transform duration-[4000ms] cubic-bezier(0.25, 1, 0.5, 1)" style="transform: rotate(0deg)">
                            ${this.renderSegments()}
                        </div>
                        
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-4 border-emerald-500 flex items-center justify-center z-20">
                           <i class="fas fa-star text-emerald-500 text-xs"></i>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 w-full relative z-10">
                        <button id="btn-spin-free" onclick="SpinSystem.spin('free')" class="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/30 active:scale-95 transition-all group border border-white/10" ${!isFreeReady ? 'disabled' : ''}>
                            <span class="flex items-center justify-center gap-2">
                                ${isFreeReady ? '<i class="fas fa-play-circle group-hover:rotate-12 transition-transform"></i> Spin Free' : '<i class="fas fa-clock"></i> Cooldown'}
                            </span>
                        </button>

                        <button onclick="SpinSystem.spin('paid')" class="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-900/30 active:scale-95 transition-all group border border-white/10">
                            <span class="flex items-center justify-center gap-2">
                                <i class="fas fa-coins text-yellow-200"></i> ${cost} PTS
                            </span>
                        </button>
                    </div>

                    <p class="text-[8px] text-gray-500 font-bold uppercase mt-4 text-center">Tenant & Landlord: No Ads Required</p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        this.startCooldownTimer();
    },

    renderSegments() {
        let html = '';
        const count = this.segments.length; // 8
        const deg = 360 / count; // 45 derajat

        this.segments.forEach((seg, i) => {
            const rotation = i * deg;
            // Kita buat segitiga menggunakan conic-gradient atau clip-path
            // Cara paling mudah di HTML raw: Rotated divs
            html += `
                <div class="absolute top-0 left-0 w-full h-full flex justify-center pt-2" 
                     style="transform: rotate(${rotation}deg); clip-path: polygon(50% 50%, 0 0, 100% 0);">
                    <div class="w-full h-1/2 flex flex-col items-center pt-4 gap-1" style="background-color: ${seg.color}">
                       <i class="fas ${seg.icon} text-white text-lg drop-shadow-md transform rotate-[-${rotation}deg]"></i> <span class="text-[8px] font-black text-white uppercase drop-shadow-md transform rotate-[-${rotation}deg]">${seg.label}</span>
                    </div>
                </div>
            `;
            // Note: Metode CSS murni di atas agak tricky untuk clip-path presisi. 
            // Alternatif: Conic Gradient di parent container, lalu icon di posisikan absolute.
            // Agar simpel & pasti jalan, kita gunakan teknik standard Conic Gradient di bawah ini:
        });

        // REVISI RENDER: Menggunakan Conic Gradient untuk background warna-warni
        let gradient = 'conic-gradient(';
        this.segments.forEach((seg, i) => {
            gradient += `${seg.color} ${i * deg}deg ${(i + 1) * deg}deg,`;
        });
        gradient = gradient.slice(0, -1) + ')';

        // Kita return elemen dengan background gradient, lalu icon-icon di atasnya absolute
        let iconsHtml = '';
        this.segments.forEach((seg, i) => {
             // Hitung posisi tengah segmen
             const midDeg = (i * deg) + (deg / 2);
             iconsHtml += `
                <div class="absolute w-full h-full top-0 left-0 flex justify-center pt-4 pointer-events-none" style="transform: rotate(${midDeg}deg)">
                     <div class="flex flex-col items-center gap-1 mt-2">
                        <i class="fas ${seg.icon} text-white text-lg drop-shadow-md" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5)"></i>
                        <span class="text-[8px] font-black text-white uppercase drop-shadow-md" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5)">${seg.label}</span>
                     </div>
                </div>
             `;
        });

        return `<div class="w-full h-full rounded-full relative" style="background: ${gradient}">${iconsHtml}</div>`;
    },

    spin(type) {
        if (this.isSpinning) return;
        const user = GameState.user;
        const cost = window.GameConfig.Spin.CostPaid || 150;

        // Validasi
        if (type === 'free') {
            const lastSpin = user.spin_free_cooldown || 0;
            if (Date.now() - lastSpin < this.cooldownTime) return;
        } else {
            if (user.coins < cost) {
                UIEngine.showRewardPopup("INSUFFICIENT FUNDS", "Not enough PTS for paid spin.", null, "CLOSE");
                return;
            }
            user.coins -= cost; // Potong saldo langsung
            UIEngine.updateHeader();
        }

        this.isSpinning = true;
        
        // 1. Tentukan Hasil (Random Weighted) - Disederhanakan pure random
        const segmentIndex = Math.floor(Math.random() * this.segments.length);
        const winningSegment = this.segments[segmentIndex];
        
        // 2. Hitung Derajat Putaran
        // Index 0 ada di jam 12 (0 derajat). 
        // Agar Index X menang, kita harus putar wheel berlawanan arah jam 
        // sehingga Index X mendarat di posisi jam 12 (Top).
        // Tapi render kita: 0deg = Jam 12. Rotasi = Clockwise.
        // Segmen i ada di (i * 45) + 22.5 derajat.
        // Agar segmen i ada di atas (0 derajat) setelah diputar:
        // Target Rotasi = 360 - (Posisi Tengah Segmen i) + (Full Spin 360 * 5)
        
        const segmentDegree = 360 / this.segments.length;
        const targetSegmentAngle = (segmentIndex * segmentDegree) + (segmentDegree / 2);
        const totalRotation = (360 * 5) + (360 - targetSegmentAngle); 
        
        const wheel = document.getElementById('wheel-inner');
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        
        // Simpan cooldown jika free
        if (type === 'free') {
            user.spin_free_cooldown = Date.now();
            GameState.save();
        }

        // 3. Selesai Animasi (4 Detik)
        setTimeout(() => {
            this.isSpinning = false;
            this.handleResult(winningSegment, type);
        }, 4000);
    },

    handleResult(prize, type) {
        // Tentukan Item Spesifik jika hadiahnya Herb (Random sesuai rarity)
        let finalPrizeName = prize.label;
        let finalPrizeKey = null;
        
        if (prize.type === 'herb') {
            // Cari tanaman dengan rarity tersebut
            const candidates = Object.keys(window.HerbData || {}).filter(k => (window.HerbData[k].rarity || 'Common') === prize.rarity);
            if(candidates.length > 0) {
                finalPrizeKey = candidates[Math.floor(Math.random() * candidates.length)];
                finalPrizeName = window.HerbData[finalPrizeKey].name;
            } else {
                finalPrizeKey = 'ginger'; // Fallback
                finalPrizeName = 'Ginger';
            }
        }

        // --- LOGIKA UTAMA: CEK PLAN USER UNTUK IKLAN ---
        if (type === 'paid') {
            // Jika bayar pakai koin, langsung dapat
            this.grantReward(prize, finalPrizeKey);
            UIEngine.showRewardPopup("CONGRATULATIONS", `You got ${finalPrizeName}!`, null, "AWESOME");
        } 
        else {
            // Jika Free Spin
            const userPlan = GameState.user.plan || 'FREE';
            const config = window.GameConfig.Plans[userPlan];
            
            // Cek apakah plan ini bebas iklan Spin? (Tenant & Landlord)
            const noAds = (config.adsLevel === 'NoHarvestSpin' || config.adsLevel === 'FreeAds');

            if (noAds) {
                // BYPASS IKLAN (VIP)
                this.grantReward(prize, finalPrizeKey);
                UIEngine.showRewardPopup("VIP REWARD", `${finalPrizeName} added to your inventory.<br><span class='text-[8px] text-emerald-400'>(No Ad Required)</span>`, null, "THANKS");
            } else {
                // NONTON IKLAN (Free & Mortgage)
                UIEngine.showRewardPopup("YOU WON!", `To claim ${finalPrizeName}, watch a short ad.`, () => {
                    AdsManager.showHybridStack(3, () => {
                        this.grantReward(prize, finalPrizeKey);
                        UIEngine.showRewardPopup("CLAIMED", `${finalPrizeName} has been added!`, null, "NICE");
                    });
                }, "WATCH AD");
            }
        }
        
        // Cleanup Popup
        setTimeout(() => document.getElementById('spin-popup')?.remove(), 500);
    },

    grantReward(prize, specificKey) {
        if (prize.type === 'coin') {
            GameState.user.coins += prize.val;
        } else if (prize.type === 'herb' && specificKey) {
            GameState.warehouse[specificKey] = (GameState.warehouse[specificKey] || 0) + 1;
        }
        GameState.save();
        if(window.UIEngine) UIEngine.updateHeader();
    },

    startCooldownTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const updateBtn = () => {
            const freeBtn = document.getElementById('btn-spin-free');
            if (!freeBtn) return;
            
            const lastSpin = GameState.user.spin_free_cooldown || 0;
            const remaining = this.cooldownTime - (Date.now() - parseInt(lastSpin));
            
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
            }
        };

        updateBtn(); // Run once
        this.timerInterval = setInterval(updateBtn, 1000);
    }
};

window.SpinSystem = SpinSystem;