// js/withdraw.js
const WithdrawSystem = {
    selectedCurrency: 'USDT',
    selectedMethod: 'faucetpay', 
    
    // Pilihan Cepat sesuai Ekonomi Baru (100 untuk tes, 1000 standar)
    quickAmounts: [100, 1000, 5000, 10000, 50000],

    // Rate: 100.000 PTS = 1 USDT (1 PTS = 0.00001)
    rates: {
        USDT: 0.00001,
        TRX: 0.00006,       // Estimasi relatif terhadap USDT
        LTC: 0.0000001,
        DOGE: 0.00003,
        SOL: 0.00000005,
        BTC: 0.0000000001
    },

    init() {
        this.renderForm();
        this.switchTab('withdraw');
        this.selectMethod('faucetpay');
    },

    selectMethod(method) {
        this.selectedMethod = method;
        this.renderForm();
    },

    getBindingStatus() {
        return GameState.user.faucetpay_email || null;
    },

    setAmount(val) {
        if (val === 'MAX') {
            this.setMax();
        } else {
            const input = document.getElementById('wd-amount');
            if (input) {
                input.value = val;
                this.updatePreview();
            }
        }
    },

    // --- LOGIC UTAMA RENDER FORM ---
    renderForm() {
        const wdArea = document.getElementById('withdraw-area');
        if (!wdArea) return;

        // LOGIC LIMIT DINAMIS (Sesuai Request: 100 untuk user baru, 1000 user lama)
        const hasHistory = GameState.user.has_withdrawn;
        const currentMin = hasHistory ? 1000 : 100;
        const limitLabel = hasHistory ? "Min 1,000" : "🔥 Promo Min 100";
        
        const boundEmail = this.getBindingStatus();
        const currentBalance = GameState.user.coins.toLocaleString(); 
        
        let feeLabel = "";
        let inputPlaceholder = "";
        let inputReadOnly = "";
        let inputValue = "";
        let helperText = "";

        if (this.selectedMethod === 'faucetpay') {
            feeLabel = "0 PTS (Free)";
            inputPlaceholder = "Enter FaucetPay Email";
            helperText = "Instant & No Fee. Email locked after success.";
            if (boundEmail) {
                inputValue = boundEmail;
                inputReadOnly = "readonly disabled class='w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-[10px] font-bold text-gray-400 cursor-not-allowed'";
                helperText = "<i class='fas fa-lock text-emerald-500'></i> Account Bound.";
            } else {
                inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
            }
        } else {
            feeLabel = "5% (Network Fee)";
            inputPlaceholder = "Enter Blockchain Address";
            inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
            helperText = "Direct transfer to blockchain. Fee applied.";
        }

        wdArea.innerHTML = `
            <div class="flex gap-2 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5">
                <button onclick="WithdrawSystem.selectMethod('faucetpay')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'faucetpay' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">FaucetPay</span>
                    <span class="text-[7px] opacity-80">Fee 0%</span>
                </button>
                <button onclick="WithdrawSystem.selectMethod('direct')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'direct' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Direct Wallet</span>
                    <span class="text-[7px] opacity-80">Fee 5%</span>
                </button>
            </div>

            <p class="text-[9px] text-gray-400 font-bold uppercase mb-2 tracking-widest">Select Currency</p>
            <div id="wd-coin-grid" class="grid grid-cols-3 gap-2 mb-4">
                ${Object.keys(this.rates).map(key => `
                    <button id="btn-coin-${key}" onclick="WithdrawSystem.select('${key}')" class="p-2 glass rounded-2xl flex flex-col items-center border border-white/5 active:scale-95 transition-all hover:bg-white/5 group">
                        <span class="text-[9px] font-black uppercase text-gray-300 group-hover:text-emerald-400">${key}</span>
                    </button>
                `).join('')}
            </div>

            <div class="flex flex-col gap-4 mb-4">
                <div class="space-y-1">
                    <label class="text-[8px] text-gray-500 font-bold uppercase ml-1">Destination</label>
                    <input type="text" id="wd-address" value="${inputValue}" ${inputReadOnly} placeholder="${inputPlaceholder}">
                    <p class="text-[7px] text-gray-400 px-2">${helperText}</p>
                </div>

                <div class="space-y-2">
                    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        ${this.quickAmounts.map(amt => `
                            <button onclick="WithdrawSystem.setAmount(${amt})" class="px-3 py-1.5 glass rounded-lg border border-white/10 text-[8px] font-bold text-gray-300 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500 transition-all active:scale-90 whitespace-nowrap">
                                ${amt >= 1000 ? (amt/1000)+'K' : amt}
                            </button>
                        `).join('')}
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
                <div class="flex justify-between items-center text-[8px] text-gray-400"><span>Admin Fee:</span><span class="font-bold text-white">${feeLabel}</span></div>
                <div class="flex justify-between items-center text-[8px] text-gray-400">
                    <span>You Receive:</span>
                    <div class="text-right">
                        <p id="wd-preview-amount" class="text-sm font-black text-white leading-none">0.00</p>
                        <p id="wd-preview-symbol" class="text-[7px] font-bold text-emerald-500 uppercase">${this.selectedCurrency}</p>
                    </div>
                </div>
            </div>

            <button onclick="WithdrawSystem.process()" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-[1.5rem] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">Process <i class="fas fa-arrow-right"></i></button>
        `;
        this.select(this.selectedCurrency);
    },

    select(symbol) {
        this.selectedCurrency = symbol;
        Object.keys(this.rates).forEach(k => {
            const btn = document.getElementById(`btn-coin-${k}`);
            if(btn) btn.className = k === symbol ? "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95" : "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-70";
        });
        this.updatePreview();
    },

    setMax() {
        if (!GameState.user) return;
        const input = document.getElementById('wd-amount');
        if (input) {
            input.value = GameState.user.coins;
            this.updatePreview();
        }
    },

    updatePreview() {
        const inputAmt = document.getElementById('wd-amount');
        const previewAmt = document.getElementById('wd-preview-amount');
        const previewSym = document.getElementById('wd-preview-symbol');
        if (!inputAmt || !previewAmt) return;

        const amount = parseInt(inputAmt.value) || 0;
        let fee = (this.selectedMethod === 'direct') ? Math.floor(amount * 0.05) : 0;
        const netAmount = Math.max(0, amount - fee);
        const cryptoValue = (netAmount * this.rates[this.selectedCurrency]).toFixed(8);

        previewAmt.innerText = cryptoValue;
        previewSym.innerText = this.selectedCurrency;
    },

    async process() {
        const inputAmt = document.getElementById('wd-amount');
        const inputAddr = document.getElementById('wd-address');
        const amount = parseInt(inputAmt.value);
        const address = inputAddr.value.trim();
        
        // VALIDASI LIMIT BARU (100 / 1000)
        const minLimit = GameState.user.has_withdrawn ? 1000 : 100;

        if (!amount || amount < minLimit) { UIEngine.showRewardPopup("LIMIT ERROR", `Minimum withdrawal is ${minLimit} PTS.`, null, "FIX"); return; }
        if (!address) { UIEngine.showRewardPopup("EMPTY DATA", "Please fill in the destination.", null, "FIX"); return; }
        if (amount > GameState.user.coins) { UIEngine.showRewardPopup("NO FUNDS", "Not enough coins.", null, "CLOSE"); return; }

        if (this.selectedMethod === 'faucetpay') {
            if (!address.includes('@')) { UIEngine.showRewardPopup("INVALID EMAIL", "FaucetPay requires a valid Email.", null, "FIX"); return; }
            if (GameState.user.faucetpay_email && address !== GameState.user.faucetpay_email) {
                UIEngine.showRewardPopup("ACCOUNT LOCKED", "Account bound to: " + GameState.user.faucetpay_email, null, "OK");
                return;
            }
        }

        let fee = (this.selectedMethod === 'direct') ? Math.floor(amount * 0.05) : 0;
        const cryptoVal = ((amount - fee) * this.rates[this.selectedCurrency]).toFixed(8);
        
        UIEngine.showRewardPopup("CONFIRM", `Withdraw ${amount - fee} PTS (${cryptoVal} ${this.selectedCurrency})?`, async () => {
            // 1. Potong Saldo & Update Status
            GameState.user.coins -= amount;
            if (!GameState.user.has_withdrawn) GameState.user.has_withdrawn = true;
            if (this.selectedMethod === 'faucetpay' && !GameState.user.faucetpay_email) GameState.user.faucetpay_email = address;

            // 2. Simpan Riwayat
            const tx = { id: 'TX-' + Math.floor(Math.random() * 999999), date: new Date().toLocaleDateString(), amount, method: this.selectedMethod, destination: address, status: 'Pending' };
            if(!GameState.user.history) GameState.user.history = [];
            GameState.user.history.unshift(tx);

            // 3. Simpan ke Cloud (The Chain)
            await GameState.save();

            UIEngine.updateHeader();
            UIEngine.closeWithdraw();
            setTimeout(() => { UIEngine.showRewardPopup("SUCCESS", "Request submitted!", null, "OK"); }, 500);
        }, "WITHDRAW");
    },

    switchTab(tab) {
        const wdArea = document.getElementById('withdraw-area');
        const depArea = document.getElementById('deposit-area');
        const btnWd = document.getElementById('tab-wd-btn');
        const btnDep = document.getElementById('tab-dep-btn');
        if (!wdArea || !depArea) return;
        if (tab === 'withdraw') {
            wdArea.classList.remove('hidden'); depArea.classList.add('hidden');
            if(btnWd) { btnWd.classList.add('bg-emerald-500', 'text-black', 'shadow-lg'); btnWd.classList.remove('text-gray-400'); }
            if(btnDep) { btnDep.classList.remove('bg-emerald-500', 'text-black', 'shadow-lg'); btnDep.classList.add('text-gray-400'); }
        } else {
            wdArea.classList.add('hidden'); depArea.classList.remove('hidden');
            if(btnDep) { btnDep.classList.add('bg-emerald-500', 'text-black', 'shadow-lg'); btnDep.classList.remove('text-gray-400'); }
            if(btnWd) { btnWd.classList.remove('bg-emerald-500', 'text-black', 'shadow-lg'); btnWd.classList.add('text-gray-400'); }
        }
    }
};
window.WithdrawSystem = WithdrawSystem;