const WithdrawSystem = {
    selectedCurrency: 'USDT',
    selectedMethod: 'faucetpay', 
    
    // Quick Extract Chips
    quickAmounts: [1000, 2500, 5000, 10000, 50000],

    // Exchange Matrix (100,000 CRD = 1 USDT)
    rates: {
        USDT: 0.00001,
        TRX: 0.00006,
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

    renderForm() {
        const wdArea = document.getElementById('withdraw-area');
        if (!wdArea) return;

        const currentMin = GameState.user.has_withdrawn ? 2500 : 100;
        const limitLabel = GameState.user.has_withdrawn ? "Min 2.5K CRD" : "Promo: 100 CRD";
        const boundEmail = this.getBindingStatus();
        const currentBalance = GameState.user.coins.toLocaleString(); 
        
        let feeLabel = "";
        let inputPlaceholder = "";
        let inputReadOnly = "";
        let inputValue = "";
        let helperText = "";

        if (this.selectedMethod === 'faucetpay') {
            feeLabel = "0% (Secure Tunnel)";
            inputPlaceholder = "Enter FaucetPay Email";
            helperText = "Direct Neural Link. Locked after first sync.";
            
            if (boundEmail) {
                inputValue = boundEmail;
                inputReadOnly = "readonly disabled class='w-full bg-cyan-950/30 border border-cyan-900/50 rounded-xl px-4 py-3 text-[10px] font-bold text-cyan-700 cursor-not-allowed'";
                helperText = "<i class='fas fa-fingerprint text-cyan-500'></i> Biometric Link Bound.";
            } else {
                inputReadOnly = "class='w-full bg-black border border-cyan-500/30 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-cyan-500/60'";
            }
        } else {
            feeLabel = "5% (Network Friction)";
            inputPlaceholder = "Enter External Node Address";
            inputReadOnly = "class='w-full bg-black border border-[#ff0055]/30 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-[#ff0055]/60'";
            helperText = "Encrypted transfer to blockchain. Higher friction.";
        }

        wdArea.innerHTML = `
            <div class="flex gap-2 mb-6 bg-black/60 p-1 border border-white/5 rounded-sm">
                <button onclick="WithdrawSystem.selectMethod('faucetpay')" class="flex-1 py-3 rounded-sm flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'faucetpay' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-gray-600 hover:text-cyan-400'}">
                    <span class="text-[9px] font-black uppercase tracking-widest">Micro-Uplink</span>
                    <span class="text-[7px] font-bold opacity-70 italic">NO FEE</span>
                </button>
                <button onclick="WithdrawSystem.selectMethod('direct')" class="flex-1 py-3 rounded-sm flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'direct' ? 'bg-[#ff0055] text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]' : 'text-gray-600 hover:text-[#ff0055]'}">
                    <span class="text-[9px] font-black uppercase tracking-widest">Cold Storage</span>
                    <span class="text-[7px] font-bold opacity-70 italic">5% TAX</span>
                </button>
            </div>

            <p class="text-[9px] text-cyan-500 font-bold uppercase mb-2 tracking-[0.2em] italic">Select Currency Module</p>
            <div id="wd-coin-grid" class="grid grid-cols-3 gap-2 mb-6">
                ${Object.keys(this.rates).map(key => `
                    <button id="btn-coin-${key}" onclick="WithdrawSystem.select('${key}')" class="p-2 bg-black border border-white/5 rounded-lg flex flex-col items-center active:scale-95 transition-all hover:border-cyan-500/40 group">
                        <span class="text-[9px] font-black uppercase text-gray-500 group-hover:text-cyan-400">${key}</span>
                    </button>
                `).join('')}
            </div>

            <div class="flex flex-col gap-4 mb-6">
                <div class="space-y-1">
                    <label class="text-[8px] text-gray-500 font-bold uppercase ml-1 italic">Target Node Address</label>
                    <input type="text" id="wd-address" value="${inputValue}" ${inputReadOnly} placeholder="${inputPlaceholder}">
                    <p class="text-[7px] text-gray-500 px-2 italic uppercase tracking-tighter">${helperText}</p>
                </div>

                <div class="space-y-3">
                    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        ${this.quickAmounts.map(amt => `
                            <button onclick="WithdrawSystem.setAmount(${amt})" class="px-3 py-1.5 bg-black border border-white/10 rounded-sm text-[8px] font-black text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-all active:scale-90">
                                ${amt >= 1000 ? (amt/1000)+'K' : amt} CRD
                            </button>
                        `).join('')}
                    </div>

                    <div>
                        <div class="flex justify-between px-1 mb-1 items-end">
                            <span class="text-[8px] text-gray-500 font-bold uppercase italic">Data Volume (${limitLabel})</span>
                            <span class="text-[10px] text-white font-black uppercase flex items-center gap-1">
                                <i class="fas fa-bolt text-cyan-500"></i> 
                                ${currentBalance} <span class="text-cyan-500">CRD</span>
                            </span>
                        </div>
                        
                        <div class="relative">
                            <input type="number" id="wd-amount" oninput="WithdrawSystem.updatePreview()" class="w-full bg-black border border-white/10 rounded-sm pl-4 pr-16 py-3 text-sm font-black text-white outline-none focus:border-cyan-500 shadow-inner transition-all" placeholder="0">
                            <button onclick="WithdrawSystem.setMax()" class="absolute right-2 top-2 bottom-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black text-[8px] font-black px-3 transition-all uppercase italic">Full Sync</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-black border-l-2 border-cyan-500 p-4 mb-6 space-y-2 shadow-lg">
                <div class="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest">
                    <span class="text-gray-500">Network Friction:</span>
                    <span class="text-white">${feeLabel}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-[8px] font-bold uppercase tracking-widest text-gray-500">Neural Estimate:</span>
                    <div class="text-right">
                        <p id="wd-preview-amount" class="text-xl font-black text-white tracking-tighter leading-none shadow-[0_0_10px_rgba(255,255,255,0.2)]">0.00</p>
                        <p id="wd-preview-symbol" class="text-[8px] font-black text-cyan-500 uppercase italic tracking-[0.2em] mt-1">${this.selectedCurrency}</p>
                    </div>
                </div>
            </div>

            <button onclick="WithdrawSystem.process()" class="w-full bg-[#ff0055] text-white py-5 font-black uppercase text-[10px] shadow-[0_0_20px_rgba(255,0,85,0.4)] active:scale-95 transition-all tracking-[0.4em] flex items-center justify-center gap-2">
                Initiate Extraction <i class="fas fa-bolt"></i>
            </button>
        `;

        this.select(this.selectedCurrency);
    },

    select(symbol) {
        this.selectedCurrency = symbol;
        Object.keys(this.rates).forEach(k => {
            const btn = document.getElementById(`btn-coin-${k}`);
            if(btn) {
                if(k === symbol) {
                    btn.className = "p-2 bg-cyan-900/20 rounded-lg flex flex-col items-center border border-cyan-500 shadow-[0_0_10px_rgba(0,242,255,0.2)] scale-95 transition-all";
                    btn.querySelector('span').className = "text-[9px] font-black uppercase text-cyan-400";
                } else {
                    btn.className = "p-2 bg-black border border-white/5 rounded-lg flex flex-col items-center opacity-60 grayscale hover:opacity-100 transition-all";
                    btn.querySelector('span').className = "text-[9px] font-black uppercase text-gray-500";
                }
            }
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
        let fee = 0;
        if (this.selectedMethod === 'direct') fee = Math.floor(amount * 0.05);

        const netAmount = Math.max(0, amount - fee);
        const rate = this.rates[this.selectedCurrency];
        const cryptoValue = (netAmount * rate).toFixed(8);

        previewAmt.innerText = cryptoValue;
        previewSym.innerText = this.selectedCurrency;
    },

    process() {
        const inputAmt = document.getElementById('wd-amount');
        const inputAddr = document.getElementById('wd-address');
        const amount = parseInt(inputAmt.value);
        const address = inputAddr.value.trim();
        const minLimit = GameState.user.has_withdrawn ? 2500 : 100;

        if (!amount || amount < minLimit) {
            UIEngine.showRewardPopup("PROTOCOL ERROR", `Extraction requires min. ${minLimit} CRD.`, null, "RETRY");
            return;
        }
        if (!address) {
            UIEngine.showRewardPopup("UPLINK MISSING", "Target Node address is required.", null, "FIX");
            return;
        }
        if (amount > GameState.user.coins) {
            UIEngine.showRewardPopup("SYNC FAILED", "Insufficient credits in neural buffer.", null, "ABORT");
            return;
        }

        if (this.selectedMethod === 'faucetpay') {
            if (!address.includes('@')) {
                UIEngine.showRewardPopup("ENCRYPTION ERROR", "Valid FaucetPay ID (Email) required.", null, "RETRY");
                return;
            }
            if (GameState.user.faucetpay_email && address !== GameState.user.faucetpay_email) {
                UIEngine.showRewardPopup("BIOMETRIC LOCK", "Uplink restricted to bound node: " + GameState.user.faucetpay_email, null, "OK");
                return;
            }
        }

        let fee = 0;
        if (this.selectedMethod === 'direct') fee = Math.floor(amount * 0.05);
        
        const netAmount = amount - fee;
        const cryptoVal = (netAmount * this.rates[this.selectedCurrency]).toFixed(8);

        UIEngine.showRewardPopup("CONFIRM EXTRACTION", `Finalizing transfer of ${netAmount} CRD (${cryptoVal} ${this.selectedCurrency}). \nTarget: ${this.selectedMethod.toUpperCase()}`, () => {
            
            GameState.user.coins -= amount;
            if (!GameState.user.has_withdrawn) GameState.user.has_withdrawn = true;
            if (this.selectedMethod === 'faucetpay' && !GameState.user.faucetpay_email) {
                GameState.user.faucetpay_email = address;
            }

            const tx = {
                id: 'TX-' + Math.floor(Math.random() * 999999),
                date: new Date().toLocaleDateString(),
                amount: amount,
                fee: fee,
                method: this.selectedMethod,
                destination: address,
                status: 'Routing...'
            };
            
            if(!GameState.history) GameState.history = [];
            GameState.history.unshift(tx);
            GameState.save();

            UIEngine.updateHeader();
            UIEngine.closeWithdraw();
            
            setTimeout(() => {
                UIEngine.showRewardPopup("UPLINK ACTIVE", "Extraction request sent to Syndicate. Wait for sync.", null, "EXIT");
            }, 500);

        }, "AUTHORIZE");
    },
    
    switchTab(tab) {
        const wdArea = document.getElementById('withdraw-area');
        const depArea = document.getElementById('deposit-area');
        const btnWd = document.getElementById('tab-wd-btn');
        const btnDep = document.getElementById('tab-dep-btn');
        if (!wdArea || !depArea) return;

        if (tab === 'withdraw') {
            wdArea.classList.remove('hidden');
            depArea.classList.add('hidden');
            if(btnWd) {
                btnWd.classList.add('bg-cyan-600', 'text-white', 'shadow-lg');
                btnWd.classList.remove('text-gray-500');
            }
            if(btnDep) {
                btnDep.classList.remove('bg-cyan-600', 'text-white', 'shadow-lg');
                btnDep.classList.add('text-gray-500');
            }
        } else {
            wdArea.classList.add('hidden');
            depArea.classList.remove('hidden');
            if(btnDep) {
                btnDep.classList.add('bg-cyan-600', 'text-white', 'shadow-lg');
                btnDep.classList.remove('text-gray-500');
            }
            if(btnWd) {
                btnWd.classList.remove('bg-cyan-600', 'text-white', 'shadow-lg');
                btnWd.classList.add('text-gray-500');
            }
        }
    }
};

window.WithdrawSystem = WithdrawSystem;