// js/withdraw.js
// ==========================================
// FINANCE SYSTEM (5 COINS + DEPOSIT TAB + SECURITY LOCK)
// ==========================================

const WithdrawSystem = {
    selectedCurrency: 'USDT',
    selectedMethod: 'faucetpay', 
    currentTab: 'withdraw', // withdraw | deposit

    // Quick Amount Buttons
    quickAmounts: [100, 2500, 10000, 50000, 100000],

    // Safety Margin 5%
    SAFETY_MARGIN: 0.95, 

    // HANYA 5 KOIN
    rates: {
        USDT: window.GameConfig.Finance.RateUSDT || 0.00001, 
        TON:  0.0002, 
        TRX:  0.06, 
        LTC:  0.00001,
        DOGE: 0.03
    },

    // Mapping ID CoinGecko
    coinIds: {
        'TON': 'the-open-network',
        'TRX': 'tron',
        'LTC': 'litecoin',
        'DOGE': 'dogecoin',
        'USDT': 'tether'
    },

    init() {
        this.selectedMethod = 'faucetpay';
        this.currentTab = 'withdraw';
        this.render();
        this.fetchLiveRates();
    },

    async fetchLiveRates() {
        const updateStatus = document.getElementById('wd-rate-status');
        if(updateStatus) updateStatus.innerHTML = '<span class="animate-pulse text-yellow-400">Syncing...</span>';

        try {
            const ids = Object.values(this.coinIds).join(',');
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            const data = await response.json();
            const baseValueUSD = window.GameConfig.Finance.RateUSDT; 

            if (data) {
                if(data['the-open-network']) this.rates.TON = baseValueUSD / data['the-open-network'].usd;
                if(data['tron'])             this.rates.TRX = baseValueUSD / data['tron'].usd;
                if(data['litecoin'])         this.rates.LTC = baseValueUSD / data['litecoin'].usd;
                if(data['dogecoin'])         this.rates.DOGE = baseValueUSD / data['dogecoin'].usd;
                
                this.updatePreview();
                if(updateStatus) updateStatus.innerHTML = '<span class="text-emerald-400">● Live Data</span>';
            }
        } catch (error) {
            console.warn("Using Standard Rates");
            if(updateStatus) updateStatus.innerHTML = '<span class="text-gray-500">Standard Rates</span>';
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        this.render(); // Render ulang total saat pindah tab utama
    },

    selectMethod(method) {
        this.selectedMethod = method;
        this.render(); // Render ulang saat ganti metode withdraw
    },

    selectCoin(symbol) {
        this.selectedCurrency = symbol;
        this.render(); 
    },

    setAmount(val) {
        const input = document.getElementById('wd-amount');
        if (input) {
            input.value = val;
            this.updatePreview();
        }
    },

    setMax() {
        if (!GameState.user) return;
        this.setAmount(GameState.user.coins);
    },

    // --- RENDER VISUAL ---
    render() {
        const wdArea = document.getElementById('withdraw-area');
        if (!wdArea) return;

        // Container Utama
        wdArea.className = "glass w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl";
        
        // 1. HEADER UMUM
        const headerHTML = `
            <div class="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Financial Hub</h2>
                    <div class="flex items-center gap-2">
                        <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Secure Asset Management</p>
                        <p id="wd-rate-status" class="text-[8px] font-bold uppercase ml-2"></p>
                    </div>
                </div>
                <button onclick="UIEngine.closeWithdraw()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20"><i class="fas fa-times text-xs"></i></button>
            </div>
        `;

        // 2. TAB UTAMA (WITHDRAW vs DEPOSIT)
        const mainTabsHTML = `
            <div class="flex gap-2 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5 shrink-0">
                <button onclick="WithdrawSystem.switchTab('withdraw')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'withdraw' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Withdrawal</span>
                </button>
                <button onclick="WithdrawSystem.switchTab('deposit')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'deposit' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Deposit</span>
                </button>
            </div>
        `;

        let contentHTML = "";

        // --- KONTEN: JIKA TAB DEPOSIT ---
        if (this.currentTab === 'deposit') {
            contentHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-center opacity-80 animate-in">
                    <div class="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <i class="fas fa-shield-alt text-3xl text-yellow-500 animate-pulse"></i>
                    </div>
                    <h3 class="text-lg font-black text-white uppercase mb-2">Maintenance</h3>
                    <p class="text-[9px] text-gray-400 px-8 leading-relaxed">
                        The Deposit Gateway is currently undergoing security upgrades. Please check back shortly.
                    </p>
                </div>
            `;
        } 
        // --- KONTEN: JIKA TAB WITHDRAW ---
        else {
            const cfg = window.GameConfig.Finance;
            const user = GameState.user;
            const hasHistory = user.has_withdrawn || false;

            // Logika Tampilan Berdasarkan Metode (FaucetPay vs Direct)
            let minLimitPTS = 0;
            let limitLabel = "";
            let feeLabel = "";
            let inputPlaceholder = "";
            let inputReadOnly = "";
            let inputValue = "";
            let helperText = "";

            if (this.selectedMethod === 'faucetpay') {
                // FAUCETPAY
                minLimitPTS = hasHistory ? cfg.MinFpOld : cfg.MinFpNew;
                limitLabel = hasHistory ? `Min ${minLimitPTS}` : `🔥 Promo Min ${minLimitPTS}`;
                feeLabel = "NO FEE (Instant)";
                inputPlaceholder = "FaucetPay Email";
                
                // Logic Lock Address
                const savedEmail = user.faucetpay_email || user.wallet_address;
                if (hasHistory && savedEmail && savedEmail.includes('@')) {
                    inputValue = savedEmail;
                    inputReadOnly = "readonly disabled class='w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-[10px] font-bold text-gray-500 cursor-not-allowed'";
                    helperText = "<i class='fas fa-lock text-yellow-500'></i> Account Locked.";
                } else {
                    inputValue = "";
                    inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
                    helperText = "Enter FaucetPay Email. Locked after success.";
                }

            } else {
                // DIRECT
                minLimitPTS = Math.ceil(cfg.MinDirectUSD / cfg.RateUSDT);
                limitLabel = `Min $${cfg.MinDirectUSD} (~${(minLimitPTS/1000).toFixed(1)}k PTS)`;
                const feePercent = (cfg.DirectFee * 100);
                feeLabel = `${feePercent}% Service Fee`;
                inputPlaceholder = `Your ${this.selectedCurrency} Address`;
                inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
                helperText = "Double check network (BEP20/TRC20).";
            }

            // Render Grid Koin
            const coinGridHTML = Object.keys(this.rates).map(key => {
                const isActive = key === this.selectedCurrency;
                const activeClass = "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]";
                const inactiveClass = "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5 transition-all grayscale hover:grayscale-0";
                
                let iconColor = "text-gray-300";
                if (key === 'USDT') iconColor = "text-emerald-400";
                if (key === 'TON') iconColor = "text-blue-400";
                if (key === 'TRX') iconColor = "text-red-400";
                if (key === 'DOGE') iconColor = "text-yellow-400";

                return `
                    <button onclick="WithdrawSystem.selectCoin('${key}')" class="${isActive ? activeClass : inactiveClass}">
                        <span class="text-[9px] font-black uppercase ${iconColor}">${key}</span>
                    </button>
                `;
            }).join('');

            contentHTML = `
                <div class="flex gap-2 mb-4 px-1 animate-in">
                    <button onclick="WithdrawSystem.selectMethod('faucetpay')" class="flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 border transition-all ${this.selectedMethod === 'faucetpay' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'border-white/5 text-gray-500 hover:bg-white/5'}">
                        <span class="text-[9px] font-black uppercase"><i class="fas fa-faucet mr-1"></i> FaucetPay</span>
                        <span class="text-[7px] opacity-70">Instant • No Fee</span>
                    </button>
                    <button onclick="WithdrawSystem.selectMethod('direct')" class="flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 border transition-all ${this.selectedMethod === 'direct' ? 'bg-orange-600/20 border-orange-500 text-orange-300' : 'border-white/5 text-gray-500 hover:bg-white/5'}">
                        <span class="text-[9px] font-black uppercase"><i class="fas fa-wallet mr-1"></i> Direct</span>
                        <span class="text-[7px] opacity-70">High Limit • 10% Fee</span>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto no-scrollbar pr-1 animate-in min-h-0">
                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-2 tracking-widest pl-1">Select Asset</p>
                    <div class="grid grid-cols-5 gap-2 mb-4">
                        ${coinGridHTML}
                    </div>

                    <div class="flex flex-col gap-4 mb-4">
                        <div class="space-y-1">
                            <label class="text-[8px] text-gray-500 font-bold uppercase ml-1">Destination</label>
                            <input type="text" id="wd-address" value="${inputValue}" ${inputReadOnly} placeholder="${inputPlaceholder}">
                            <p class="text-[7px] text-gray-400 px-2">${helperText}</p>
                        </div>

                        <div class="space-y-2">
                            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                ${this.quickAmounts.map(amt => `<button onclick="WithdrawSystem.setAmount(${amt})" class="px-3 py-1.5 glass rounded-lg border border-white/10 text-[8px] font-bold text-gray-300 hover:bg-emerald-500/20 hover:text-white transition-all whitespace-nowrap">${amt >= 1000 ? (amt/1000)+'K' : amt}</button>`).join('')}
                            </div>
                            
                            <div>
                                <div class="flex justify-between px-1 mb-1">
                                    <span class="text-[8px] text-gray-500 font-bold uppercase">Amount (<span class="text-emerald-400">${limitLabel}</span>)</span>
                                    <span class="text-[9px] text-white font-black uppercase">Bal: ${user.coins.toLocaleString()}</span>
                                </div>
                                <div class="relative">
                                    <input type="number" id="wd-amount" oninput="WithdrawSystem.updatePreview()" class="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-16 py-3 text-sm font-black text-white outline-none focus:border-emerald-500/50 transition-all" placeholder="0">
                                    <button onclick="WithdrawSystem.setMax()" class="absolute right-2 top-1.5 bottom-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black text-[8px] font-black px-3 rounded-xl transition-all uppercase">MAX</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-xl p-3 border border-white/5 mb-2 space-y-1">
                        <div class="flex justify-between items-center text-[8px] text-gray-400"><span>Network Fee:</span><span class="font-bold text-white">${feeLabel}</span></div>
                        <div class="flex justify-between items-center text-[8px] text-gray-400">
                            <span>Est. Receive:</span>
                            <div class="text-right">
                                <p id="wd-preview-amount" class="text-sm font-black text-white leading-none">0.00</p>
                                <p id="wd-preview-symbol" class="text-[7px] font-bold text-emerald-500 uppercase">${this.selectedCurrency}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="WithdrawSystem.process()" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-[1.5rem] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-auto shrink-0 animate-in">
                    Confirm Withdraw <i class="fas fa-arrow-right"></i>
                </button>
            `;
        }

        // Render Akhir
        wdArea.innerHTML = headerHTML + mainTabsHTML + contentHTML;
    },

    updatePreview() {
        const inputAmt = document.getElementById('wd-amount');
        const previewAmt = document.getElementById('wd-preview-amount');
        const previewSym = document.getElementById('wd-preview-symbol');
        if (!inputAmt || !previewAmt || !previewSym) return;

        const amount = parseInt(inputAmt.value) || 0;
        const cfg = window.GameConfig.Finance; 
        
        // Hitung Fee (Hanya Direct)
        let fee = (this.selectedMethod === 'direct') ? Math.floor(amount * cfg.DirectFee) : 0;
        const netAmount = Math.max(0, amount - fee);
        
        const rate = this.rates[this.selectedCurrency] || 0;
        const safeCrypto = netAmount * rate * this.SAFETY_MARGIN;

        previewAmt.innerText = safeCrypto.toFixed(8);
        previewSym.innerText = this.selectedCurrency;
    },

    // --- PROSES VALIDASI ---
    async process() {
        const inputAmt = document.getElementById('wd-amount');
        const inputAddr = document.getElementById('wd-address');
        if (!inputAmt || !inputAddr) return; 

        const amountPTS = parseInt(inputAmt.value);
        const address = inputAddr.value.trim().replace(/\s/g, ''); 
        
        const cfg = window.GameConfig.Finance;
        const user = GameState.user;

        // 1. Validasi Input
        if (!amountPTS || amountPTS <= 0) {
            UIEngine.showRewardPopup("INVALID AMOUNT", "Enter valid amount.", null, "FIX");
            return;
        }
        if (!address) {
            UIEngine.showRewardPopup("MISSING ADDRESS", "Enter destination address.", null, "FIX");
            return;
        }

        // 2. Validasi Min Limit
        let minLimit = 0;
        if (this.selectedMethod === 'faucetpay') {
            minLimit = user.has_withdrawn ? cfg.MinFpOld : cfg.MinFpNew;
        } else {
            minLimit = Math.ceil(cfg.MinDirectUSD / cfg.RateUSDT);
        }

        if (amountPTS < minLimit) {
            UIEngine.showRewardPopup("LIMIT ERROR", `Minimum withdraw is ${minLimit.toLocaleString()} PTS.`, null, "OK");
            return;
        }

        // 3. Validasi Saldo
        if (amountPTS > user.coins) {
            UIEngine.showRewardPopup("INSUFFICIENT FUNDS", "Balance too low.", null, "CLOSE");
            return;
        }

        // 4. Validasi Format Email (FaucetPay)
        if (this.selectedMethod === 'faucetpay' && !address.includes('@')) {
            UIEngine.showRewardPopup("INVALID EMAIL", "FaucetPay needs a valid email.", null, "FIX");
            return;
        }

        // 5. Konfirmasi
        UIEngine.showRewardPopup("CONFIRMATION", 
            `Withdraw <b>${amountPTS.toLocaleString()} PTS</b> via <b>${this.selectedMethod.toUpperCase()}</b>?<br><span class="text-[8px] text-gray-400">${address}</span>`, 
            async () => {
                UIEngine.showRewardPopup("PROCESSING", "Contacting Gateway...", null, "...");
                try {
                    const response = await fetch('/api/withdraw', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            initData: window.Telegram.WebApp.initData,
                            userId: user.userId,
                            address: address, 
                            amount: amountPTS, 
                            currency: this.selectedCurrency,
                            method: this.selectedMethod
                        })
                    });

                    const result = await response.json(); 

                    if (result.success) {
                        await GameState.load();
                        UIEngine.updateHeader(); 
                        UIEngine.closeWithdraw(); 
                        UIEngine.showRewardPopup("SUCCESS", result.message || "Request submitted.", null, "GREAT"); 
                    } else {
                        UIEngine.showRewardPopup("FAILED", result.error || "Denied.", null, "RETRY"); 
                    }
                } catch (error) {
                    UIEngine.showRewardPopup("NETWORK ERROR", "Connection failed.", null, "CLOSE"); 
                }
            }, 
        "PROCEED");
    }
};

window.WithdrawSystem = WithdrawSystem;
