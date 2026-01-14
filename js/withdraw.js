// js/withdraw.js
const WithdrawSystem = {
    // State Variables
    selectedCurrency: 'USDT',
    selectedMethod: 'faucetpay', 
    currentTab: 'withdraw', // Default tab

    // Konfigurasi Shortcut Amount
    quickAmounts: [100, 1000, 5000, 10000, 50000],

    // Rate Tukar (USDT dari Config, sisanya estimasi)
    get rates() {
        return {
            USDT: window.GameConfig.Finance.RateUSDT,
            TRX: 0.00006,       
            LTC: 0.0000001,
            DOGE: 0.00003,
            SOL: 0.00000005,
            BTC: 0.0000000001
        };
    },

    init() {
        // Reset state saat dibuka
        this.selectedMethod = 'faucetpay';
        this.currentTab = 'withdraw';
        this.render();
    },

    // --- NAVIGATION LOGIC ---
    switchTab(tabName) {
        this.currentTab = tabName;
        this.render();
    },

    selectMethod(method) {
        this.selectedMethod = method;
        this.render(); // Re-render untuk update form input sesuai metode
    },

    selectCoin(symbol) {
        this.selectedCurrency = symbol;
        // Update visual tombol coin tanpa re-render total agar smooth
        Object.keys(this.rates).forEach(k => {
            const btn = document.getElementById(`btn-coin-${k}`);
            if(btn) {
                if (k === symbol) {
                    btn.className = "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95 transition-all";
                } else {
                    btn.className = "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-70 hover:bg-white/5 transition-all";
                }
            }
        });
        this.updatePreview();
    },

    // --- RENDERING SYSTEM (JANTUNG UTAMA) ---
    render() {
        const wdArea = document.getElementById('withdraw-area');
        if (!wdArea) return;

        // 1. SETUP CONTAINER STYLE
        wdArea.className = "glass w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl";

        // 2. HEADER HTML (Judul & Tombol Close)
        const headerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-black text-white italic uppercase tracking-wider">Finance</h2>
                    <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Manage Your Funds</p>
                </div>
                <button onclick="UIEngine.closeWithdraw()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all z-20">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;

        // 3. TAB BUTTONS HTML (Withdraw & Deposit)
        const tabHTML = `
            <div class="flex gap-2 mb-6 bg-black/40 p-1 rounded-2xl border border-white/5">
                <button onclick="WithdrawSystem.switchTab('withdraw')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'withdraw' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Withdraw</span>
                </button>
                <button onclick="WithdrawSystem.switchTab('deposit')" class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${this.currentTab === 'deposit' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}">
                    <span class="text-[9px] font-black uppercase">Deposit</span>
                </button>
            </div>
        `;

        // 4. CONTENT HTML (Isi Tab)
        let contentHTML = '';

        if (this.currentTab === 'deposit') {
            // --- TAMPILAN DEPOSIT (MAINTENANCE) ---
            contentHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-center opacity-80 animate-in">
                    <div class="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <i class="fas fa-tools text-3xl text-yellow-500 animate-pulse"></i>
                    </div>
                    <h3 class="text-lg font-black text-white uppercase mb-2">Under Maintenance</h3>
                    <p class="text-[9px] text-gray-400 px-8 leading-relaxed">
                        Deposit system is currently being upgraded for better security. Please check back later.
                    </p>
                </div>
            `;
        } else {
            // --- TAMPILAN WITHDRAW (FORM LENGKAP) ---
            
            // Ambil Data Config
            const cfg = window.GameConfig.Finance;
            const hasHistory = GameState.user.has_withdrawn;
            const currentMin = hasHistory ? cfg.MinWdOld : cfg.MinWdNew;
            const limitLabel = hasHistory ? `Min ${currentMin.toLocaleString()}` : `🔥 Promo Min ${currentMin.toLocaleString()}`;
            const boundEmail = GameState.user.faucetpay_email || null;
            const currentBalance = GameState.user.coins.toLocaleString(); 
            const feePercent = (cfg.DirectFee * 100); 

            // Logic Tampilan Form Input
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
                feeLabel = `${feePercent}% (Network Fee)`;
                inputPlaceholder = "Enter Blockchain Address";
                inputReadOnly = "class='w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50'";
                helperText = "Direct transfer to blockchain. Fee applied.";
            }

            // Generate Grid Koin
            const coinGridHTML = Object.keys(this.rates).map(key => {
                const isActive = key === this.selectedCurrency;
                const activeClass = "p-2 glass rounded-2xl flex flex-col items-center border border-emerald-500/50 bg-emerald-500/10 scale-95 transition-all";
                const inactiveClass = "p-2 glass rounded-2xl flex flex-col items-center border border-white/5 opacity-70 hover:bg-white/5 transition-all";
                return `
                    <button id="btn-coin-${key}" onclick="WithdrawSystem.selectCoin('${key}')" class="${isActive ? activeClass : inactiveClass}">
                        <span class="text-[9px] font-black uppercase text-gray-300 group-hover:text-emerald-400">${key}</span>
                    </button>
                `;
            }).join('');

            // Generate Quick Amount Buttons
            const quickAmtHTML = this.quickAmounts.map(amt => `
                <button onclick="WithdrawSystem.setAmount(${amt})" class="px-3 py-1.5 glass rounded-lg border border-white/10 text-[8px] font-bold text-gray-300 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500 transition-all active:scale-90 whitespace-nowrap">
                    ${amt >= 1000 ? (amt/1000)+'K' : amt}
                </button>
            `).join('');

            contentHTML = `
                <div class="flex gap-2 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5 animate-in">
                    <button onclick="WithdrawSystem.selectMethod('faucetpay')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'faucetpay' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                        <span class="text-[9px] font-black uppercase">FaucetPay</span>
                        <span class="text-[7px] opacity-80">Fee 0%</span>
                    </button>
                    <button onclick="WithdrawSystem.selectMethod('direct')" class="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${this.selectedMethod === 'direct' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}">
                        <span class="text-[9px] font-black uppercase">Direct Wallet</span>
                        <span class="text-[7px] opacity-80">Fee ${feePercent}%</span>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto no-scrollbar pr-1 animate-in">
                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-2 tracking-widest">Select Currency</p>
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
                        <div class="flex justify-between items-center text-[8px] text-gray-400"><span>Admin Fee:</span><span class="font-bold text-white">${feeLabel}</span></div>
                        <div class="flex justify-between items-center text-[8px] text-gray-400">
                            <span>You Receive:</span>
                            <div class="text-right">
                                <p id="wd-preview-amount" class="text-sm font-black text-white leading-none">0.00</p>
                                <p id="wd-preview-symbol" class="text-[7px] font-bold text-emerald-500 uppercase">${this.selectedCurrency}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="WithdrawSystem.process()" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-[1.5rem] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-auto shrink-0 animate-in">Process <i class="fas fa-arrow-right"></i></button>
            `;
        }

        // 5. INJECT KE DOM
        wdArea.innerHTML = headerHTML + tabHTML + contentHTML;
    },

    // --- FORM LOGIC HELPER ---
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

    updatePreview() {
        const inputAmt = document.getElementById('wd-amount');
        const previewAmt = document.getElementById('wd-preview-amount');
        const previewSym = document.getElementById('wd-preview-symbol');
        if (!inputAmt || !previewAmt || !previewSym) return;

        const amount = parseInt(inputAmt.value) || 0;
        const cfg = window.GameConfig.Finance; 
        
        // Hitung Fee
        let fee = (this.selectedMethod === 'direct') ? Math.floor(amount * cfg.DirectFee) : 0;
        const netAmount = Math.max(0, amount - fee);
        
        // Konversi
        const rate = this.rates[this.selectedCurrency] || 0;
        const cryptoValue = (netAmount * rate).toFixed(8);

        previewAmt.innerText = cryptoValue;
        previewSym.innerText = this.selectedCurrency;
    },

async process() {
        const inputAmt = document.getElementById('wd-amount');
        const inputAddr = document.getElementById('wd-address');
        
        if(!inputAmt || !inputAddr) return;
        
        const amountPTS = parseInt(inputAmt.value);
        
        // [FIX ANTI-TUYUL] Sanitasi Input (Hapus spasi & huruf kecil)
        let rawAddress = inputAddr.value;
        const address = rawAddress.trim().toLowerCase().replace(/\s/g, '');
        // Update tampilan input biar user tau
        if(rawAddress !== address) inputAddr.value = address;

        const cfg = window.GameConfig.Finance;
        const minLimit = GameState.user.has_withdrawn ? cfg.MinWdOld : cfg.MinWdNew;

        // VALIDASI AWAL
        if (!amountPTS || amountPTS < minLimit) { UIEngine.showRewardPopup("LIMIT ERROR", `Min withdraw: ${minLimit} PTS`, null, "FIX"); return; }
        if (!address) { UIEngine.showRewardPopup("EMPTY DATA", "Fill destination address.", null, "FIX"); return; }
        if (amountPTS > GameState.user.coins) { UIEngine.showRewardPopup("NO FUNDS", "Not enough coins.", null, "CLOSE"); return; }
        
        // VALIDASI KEPEMILIKAN (ANTI TUYUL)
        if (GameState.user.faucetpay_email && address !== GameState.user.faucetpay_email) {
             UIEngine.showRewardPopup("SECURITY", "Use your bound wallet: " + GameState.user.faucetpay_email, null, "OK");
             return;
        }

        // KONFIRMASI (Hitung Estimasi Crypto)
        let feePTS = (this.selectedMethod === 'direct') ? Math.floor(amountPTS * cfg.DirectFee) : 0;
        const netPTS = amountPTS - feePTS;
        const cryptoAmount = (netPTS * this.rates[this.selectedCurrency]).toFixed(8);

        UIEngine.showRewardPopup("CONFIRM", `Send ${cryptoAmount} ${this.selectedCurrency} to ${address}?`, async () => {
            
            // TAMPILKAN LOADING
            UIEngine.showRewardPopup("PROCESSING", "Contacting FaucetPay...", null, "...");

            try {
                // 1. PANGGIL API VERCEL (JALUR BELAKANG)
                const response = await fetch('/api/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: address,
                        amount: cryptoAmount,   // Kirim jumlah Crypto
                        currency: this.selectedCurrency // USDT, TRX, dll
                    })
                });

                const result = await response.json();

                // 2. JIKA SUKSES DIKIRIM
                if (result.success) {
                    // Potong Saldo Game
                    GameState.user.coins -= amountPTS;
                    
                    // Bind Akun (Kunci Wallet)
                    if (!GameState.user.has_withdrawn) {
                        GameState.user.has_withdrawn = true;
                        GameState.user.faucetpay_email = address;
                    }

                    // Simpan History
                    const tx = { 
                        id: 'FP-' + result.payout_id, // ID Asli FaucetPay
                        date: new Date().toLocaleDateString(), 
                        amount: amountPTS, 
                        method: 'FaucetPay Auto', 
                        destination: address, 
                        status: 'Success' // Langsung Sukses!
                    };
                    
                    if(!GameState.user.history) GameState.user.history = [];
                    GameState.user.history.unshift(tx);

                    // Simpan ke Firebase
                    await GameState.save();

                    // Update UI
                    UIEngine.updateHeader();
                    UIEngine.closeWithdraw();
                    
                    UIEngine.showRewardPopup("SUCCESS", "Payment Sent Instantly via FaucetPay!", null, "AWESOME");

                } else {
                    // JIKA GAGAL DARI FAUCETPAY (Misal saldo server habis / Error)
                    console.error("FP Error:", result.message);
                    UIEngine.showRewardPopup("FAILED", `FaucetPay Error: ${result.message}`, null, "REPORT");
                }

            } catch (error) {
                console.error("API Error:", error);
                UIEngine.showRewardPopup("ERROR", "Connection failed. Try again.", null, "CLOSE");
            }

        }, "SEND NOW");
    },
};

window.WithdrawSystem = WithdrawSystem;

