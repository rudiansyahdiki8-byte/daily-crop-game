// js/withdraw.js
// ==========================================
// FINANCE SYSTEM (REALTIME RATES + TON + SAFETY MARGIN)
// Fitur: Mengambil harga live dari CoinGecko.
// ==========================================

const WithdrawSystem = {
    selectedCurrency: 'USDT',
    selectedMethod: 'faucetpay', 
    currentTab: 'withdraw', 

    quickAmounts: [100, 1000, 5000, 10000, 50000],

    // SAFETY MARGIN 5% (Agar user senang dapat lebih, dan aman dari harga turun)
    SAFETY_MARGIN: 0.95, 

    // HARGA CADANGAN (Default) - Dipakai jika API Error/Loading
    rates: {
        USDT: window.GameConfig.Finance.RateUSDT || 0.001, // Base Rate (Misal 1 PTS = 0.001 USD)
        TON:  0.0002, 
        TRX:  0.06, 
        LTC:  0.00001,
        DOGE: 0.03,
        SOL:  0.00005,
        BTC:  0.00000002
    },

    // Mapping ID CoinGecko
    coinIds: {
        'TON': 'the-open-network',
        'TRX': 'tron',
        'LTC': 'litecoin',
        'DOGE': 'dogecoin',
        'SOL': 'solana',
        'BTC': 'bitcoin',
        'USDT': 'tether'
    },

    init() {
        this.selectedMethod = 'faucetpay';
        this.currentTab = 'withdraw';
        
        this.render();
        
        // LANGSUNG AMBIL HARGA ASLI SAAT MENU DIBUKA
        this.fetchLiveRates();
    },

    // --- FUNGSI BARU: AMBIL HARGA REALTIME ---
    async fetchLiveRates() {
        // Tampilkan indikator loading kecil di header atau console
        console.log("Fetching live crypto prices...");
        const updateStatus = document.getElementById('wd-rate-status');
        if(updateStatus) updateStatus.innerHTML = '<span class="animate-pulse text-yellow-400">Syncing Rates...</span>';

        try {
            // Panggil API CoinGecko (Gratis)
            const ids = Object.values(this.coinIds).join(',');
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            const data = await response.json();

            // Rumus: Rate Koin = (Nilai 1 PTS dalam USD) / (Harga Koin dalam USD)
            // Asumsi: GameConfig.Finance.RateUSDT adalah harga 1 PTS dalam Dollar.
            const baseValueUSD = window.GameConfig.Finance.RateUSDT || 0.001; 

            if (data) {
                // Update Rate TON
                if(data['the-open-network']) this.rates.TON = baseValueUSD / data['the-open-network'].usd;
                if(data['tron'])             this.rates.TRX = baseValueUSD / data['tron'].usd;
                if(data['litecoin'])         this.rates.LTC = baseValueUSD / data['litecoin'].usd;
                if(data['dogecoin'])         this.rates.DOGE = baseValueUSD / data['dogecoin'].usd;
                if(data['solana'])           this.rates.SOL = baseValueUSD / data['solana'].usd;
                if(data['bitcoin'])          this.rates.BTC = baseValueUSD / data['bitcoin'].usd;
                
                // Rate USDT biasanya tetap 1:1 dengan base config, tapi bisa diupdate juga
                // this.rates.USDT = baseValueUSD; 

                console.log("✅ Live Rates Updated!", this.rates);
                
                // Refresh Tampilan Preview
                this.updatePreview();
                
                if(updateStatus) updateStatus.innerHTML = '<span class="text-emerald-400">● Live Market Data</span>';
            }
        } catch (error) {
            console.warn("⚠️ Failed to fetch live rates, using defaults.", error);
            if(updateStatus) updateStatus.innerHTML = '<span class="text-gray-500">Using Standard Rates</span>';
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        this.render();
    },

    selectMethod(method) {
        this.selectedMethod = method;
        this.render();
    },

    selectCoin(symbol) {
        this.selectedCurrency = symbol;
        this.renderButtons(); // Refactor biar gak render ulang semua
        this.updatePreview();
    },

    // Helper render tombol koin biar smooth
    renderButtons() {
        Object.keys(this.rates).forEach(k => {
            const btn = document.getElementById(`btn-coin-${k}`);
            if(btn) {
                if (k === this.selectedCurrency) {
                    btn.className = "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95 transition-all";
                } else {
                    btn.className = "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-70 hover:bg-white/5 transition-all";
                }
            }
        });
    },

    render() {
        const wdArea = document.getElementById('withdraw-area');
        if (!wdArea) return;

        wdArea.className = "glass w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl";
        
        const headerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Financial Hub</h2>
                    <div class="flex items-center gap-2">
                        <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Secure Asset Management</p>
                        <p id="wd-rate-status" class="text-[8px] font-bold uppercase ml-2"></p>
                    </div>
                </div>
                <button onclick="UIEngine.closeWithdraw()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;

        const tabHTML = `
            <div class="flex gap-2 mb-6 bg-black/40 p-1 rounded-2xl border border-white/5">
                <button onclick="WithdrawSystem.switchTab('withdraw')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'withdraw' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Withdrawal</span>
                </button>
                <button onclick="WithdrawSystem.switchTab('deposit')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'deposit' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Deposit</span>
                </button>
            </div>
        `;

        let contentHTML = '';
        if (this.currentTab === 'deposit') {
            contentHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-center opacity-80 animate-in">
                    <div class="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <i class="fas fa-shield-alt text-3xl text-yellow-500 animate-pulse"></i>
                    </div>
                    <h3 class="text-lg font-black text-white uppercase mb-2">Security Update</h3>
                    <p class="text-[9px] text-gray-400 px-8 leading-relaxed">
                        The Deposit Gateway is currently undergoing security maintenance. Please check back shortly.
                    </p>
                </div>
            `;
        } else {
            const cfg = window.GameConfig.Finance;
            const hasHistory = GameState.user.has_withdrawn;
            const currentMin = hasHistory ? cfg.MinWdOld : cfg.MinWdNew;
            const limitLabel = hasHistory ? `Min ${currentMin.toLocaleString()}` : `🔥 First Time Min ${currentMin.toLocaleString()}`;
            const boundEmail = GameState.user.faucetpay_email || null;
            const currentBalance = GameState.user.coins.toLocaleString();
            const feePercent = (cfg.DirectFee * 100); 

            let feeLabel = "";
            let inputPlaceholder = "";
            let inputReadOnly = "";
            let inputValue = "";
            let helperText = "";

            if (this.selectedMethod === 'faucetpay') {
                feeLabel = "0 PTS (Fee Waived)";
                inputPlaceholder = "Bound FaucetPay Email";
                helperText = "Instant settlement. Account bound after first transaction.";
                if (boundEmail) {
                    inputValue = boundEmail;
                    inputReadOnly = "readonly disabled class='w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-[10px] font-bold text-gray-400 cursor-not-allowed'";
                    helperText = "<i class='fas fa-lock text-emerald-500'></i> Verified Account Bound.";
                } else {
                    inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
                }
            } else {
                feeLabel = `${feePercent}% (Gas Fee)`;
                inputPlaceholder = "Blockchain Address";
                inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
                helperText = "Standard network fees apply.";
            }

            // RENDER TOMBOL KOIN (DINAMIS DARI RATES)
            const coinGridHTML = Object.keys(this.rates).map(key => {
                const isActive = key === this.selectedCurrency;
                const activeClass = "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95 transition-all";
                const inactiveClass = "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-70 hover:bg-white/5 transition-all";
                
                let iconHtml = `<span class="text-[9px] font-black uppercase text-gray-300 group-hover:text-emerald-400">${key}</span>`;
                if(key === 'TON') {
                    iconHtml = `<span class="text-[9px] font-black uppercase text-blue-400 drop-shadow-md">💎 ${key}</span>`;
                }

                return `
                    <button id="btn-coin-${key}" onclick="WithdrawSystem.selectCoin('${key}')" class="${isActive ? activeClass : inactiveClass}">
                        ${iconHtml}
                    </button>
                `;
            }).join('');

            const quickAmtHTML = this.quickAmounts.map(amt => `
                <button onclick="WithdrawSystem.setAmount(${amt})" class="px-3 py-1.5 glass rounded-lg border border-white/10 text-[8px] font-bold text-gray-300 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500 transition-all active:scale-90 whitespace-nowrap">
                    ${amt >= 1000 ? (amt/1000)+'K' : amt}
                </button>
            `).join('');

            contentHTML = `
                <div class="flex gap-2 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5 animate-in">
                    <button onclick="WithdrawSystem.selectMethod('faucetpay')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'faucetpay' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                        <span class="text-[9px] font-black uppercase">FaucetPay</span>
                        <span class="text-[7px] opacity-80">Instant</span>
                    </button>
                    <button onclick="WithdrawSystem.selectMethod('direct')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'direct' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                        <span class="text-[9px] font-black uppercase">Direct Chain</span>
                        <span class="text-[7px] opacity-80">Fee ${feePercent}%</span>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto no-scrollbar pr-1 animate-in">
                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-2 tracking-widest">Select Asset</p>
                    <div id="wd-coin-grid" class="grid grid-cols-3 gap-2 mb-4">
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
                                ${quickAmtHTML}
                            </div>
                            <div>
                                <div class="flex justify-between px-1 mb-1">
                                    <span class="text-[8px] text-gray-500 font-bold uppercase">Amount (<span class="${hasHistory ? 'text-gray-400' : 'text-emerald-400 animate-pulse'}">${limitLabel}</span>)</span>
                                    <span class="text-[9px] text-white font-black uppercase flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5"><i class="fas fa-wallet text-emerald-500 text-xs"></i> ${currentBalance} PTS</span>
                                </div>
                                <div class="relative">
                                    <input type="number" id="wd-amount" oninput="WithdrawSystem.updatePreview()" class="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-16 py-3 text-sm font-black text-white outline-none focus:border-emerald-500/50 transition-all" placeholder="0">
                                    <button onclick="WithdrawSystem.setMax()" class="absolute right-2 top-1.5 bottom-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black text-[8px] font-black px-3 rounded-xl transition-all uppercase">MAX</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-xl p-3 border border-white/5 mb-4 space-y-1">
                        <div class="flex justify-between items-center text-[8px] text-gray-400"><span>Service Fee:</span><span class="font-bold text-white">${feeLabel}</span></div>
                        <div class="flex justify-between items-center text-[8px] text-gray-400">
                            <span>Estimated Receive (Min):</span>
                            <div class="text-right">
                                <p id="wd-preview-amount" class="text-sm font-black text-white leading-none">0.00</p>
                                <p id="wd-preview-symbol" class="text-[7px] font-bold text-emerald-500 uppercase">${this.selectedCurrency}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="WithdrawSystem.process()" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-[1.5rem] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-auto shrink-0 animate-in">Initiate Transfer <i class="fas fa-arrow-right"></i></button>
            `;
        }
        wdArea.innerHTML = headerHTML + tabHTML + contentHTML;
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

    // --- PREVIEW + SAFETY MARGIN ---
    updatePreview() {
        const inputAmt = document.getElementById('wd-amount');
        const previewAmt = document.getElementById('wd-preview-amount');
        const previewSym = document.getElementById('wd-preview-symbol');
        if (!inputAmt || !previewAmt || !previewSym) return;

        const amount = parseInt(inputAmt.value) || 0;
        const cfg = window.GameConfig.Finance; 
        
        let fee = (this.selectedMethod === 'direct') ? Math.floor(amount * cfg.DirectFee) : 0;
        const netAmount = Math.max(0, amount - fee);
        
        // AMBIL RATE DARI VARIABEL LIVE
        const rate = this.rates[this.selectedCurrency] || 0;
        
        // Kalkulasi Spread (Potongan 5%)
        const rawCrypto = netAmount * rate;
        const safeCrypto = rawCrypto * this.SAFETY_MARGIN;

        // Tampilkan 8 angka desimal
        previewAmt.innerText = safeCrypto.toFixed(8);
        previewSym.innerText = this.selectedCurrency;
    },

    async process() {
        const inputAmt = document.getElementById('wd-amount');
        const inputAddr = document.getElementById('wd-address');
        if(!inputAmt || !inputAddr) return;
        
        const amountPTS = parseInt(inputAmt.value);
        let rawAddress = inputAddr.value;
        const address = rawAddress.trim().toLowerCase().replace(/\s/g, '');
        if(rawAddress !== address) inputAddr.value = address;

        const cfg = window.GameConfig.Finance;
        const minLimit = GameState.user.has_withdrawn ? cfg.MinWdOld : cfg.MinWdNew;

        if (!amountPTS || amountPTS < minLimit) { UIEngine.showRewardPopup("VALIDATION ERROR", `Minimum required: ${minLimit} PTS`, null, "FIX"); return; }
        if (!address) { UIEngine.showRewardPopup("MISSING DATA", "Please provide a valid destination address.", null, "FIX"); return; }
        if (amountPTS > GameState.user.coins) { UIEngine.showRewardPopup("INSUFFICIENT FUNDS", "Balance too low for this transaction.", null, "CLOSE"); return; }
        
        if (GameState.user.faucetpay_email && address !== GameState.user.faucetpay_email) {
             UIEngine.showRewardPopup("SECURITY ALERT", "Address mismatch. Please use your bound wallet: " + GameState.user.faucetpay_email, null, "UNDERSTOOD");
             return;
        }

        // Estimasi untuk pesan konfirmasi
        let feePTS = (this.selectedMethod === 'direct') ? Math.floor(amountPTS * cfg.DirectFee) : 0;
        const netPTS = amountPTS - feePTS;
        const rate = this.rates[this.selectedCurrency] || 0;
        const estimatedCrypto = (netPTS * rate * this.SAFETY_MARGIN).toFixed(8);

        UIEngine.showRewardPopup("CONFIRM TRANSFER", `Initiate transfer of ~${estimatedCrypto} ${this.selectedCurrency} to ${address}?`, async () => {
            
            UIEngine.showRewardPopup("PROCESSING", "Contacting Payment Gateway...", null, "...");

            try {
                // KIRIM KE BACKEND (Nanti Backend hitung ulang pakai rate realtime dia sendiri untuk validasi)
                const response = await fetch('/api/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        address: address,
                        amount: amountPTS, // Kirim PTS (Bukan Crypto)
                        currency: this.selectedCurrency
                    })
                });

                const result = await response.json();

                if (result.success) {
                    GameState.user.coins -= amountPTS;
                    if (!GameState.user.has_withdrawn) {
                        GameState.user.has_withdrawn = true;
                        GameState.user.faucetpay_email = address;
                    }

                    const tx = { 
                        id: 'TX-' + result.payout_id, 
                        date: new Date().toLocaleDateString(), 
                        amount: amountPTS, 
                        method: 'FaucetPay Auto', 
                        destination: address, 
                        status: 'Success' 
                    };
                    
                    if(!GameState.user.history) GameState.user.history = [];
                    GameState.user.history.unshift(tx);

                    await GameState.save();
                    UIEngine.updateHeader();
                    UIEngine.closeWithdraw();
                    
                    UIEngine.showRewardPopup("TRANSFER SUCCESSFUL", "Funds have been sent instantly via FaucetPay.", null, "EXCELLENT");

                } else {
                    console.error("Payment Error:", result.message);
                    UIEngine.showRewardPopup("TRANSACTION FAILED", `Gateway Error: ${result.message}`, null, "CONTACT SUPPORT");
                }

            } catch (error) {
                console.error("API Error:", error);
                UIEngine.showRewardPopup("NETWORK ERROR", "Connection lost. Please check your internet.", null, "RETRY");
            }

        }, "AUTHORIZE");
    },
};

window.WithdrawSystem = WithdrawSystem;

