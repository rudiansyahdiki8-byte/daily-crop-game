// js/market.js
const MarketSystem = {
    currentTab: 'sell', 
    
    // ============================================================
    // DATA ITEM SHOP (Mapping Harga ke Config.js)
    // ============================================================
    shopItems: [
        // --- PERMANENT UPGRADES ---
        { 
            id: 'land_2', type: 'land', tier: 1, 
            name: "Land Plot #2", 
            icon: "fa-map-location-dot", color: "text-emerald-400", 
            // Mengambil Harga dari Config
            price: window.GameConfig.ShopItems.LandPrice_2, 
            desc: "Unlock 2nd Farming Slot. Permanent.",
            category: "Asset"
        },
        { 
            id: 'land_3', type: 'land', tier: 2, 
            name: "Land Plot #3", 
            icon: "fa-certificate", color: "text-yellow-400", 
            price: window.GameConfig.ShopItems.LandPrice_3, 
            desc: "Unlock 3rd Farming Slot. Status Symbol.",
            category: "Asset"
        },
        { 
            id: 'storage_plus', type: 'storage', 
            name: "Warehouse +20", 
            icon: "fa-warehouse", color: "text-blue-400", 
            price: window.GameConfig.ShopItems.StoragePlus, 
            desc: "Add 20 Slots capacity. Stackable.",
            category: "Asset"
        },

        // --- CONSUMABLES (24 Hours) ---
        { 
            id: 'speed_soil', type: 'buff', buffKey: 'speed_soil', 
            name: "Speed Soil", 
            icon: "fa-bolt", color: "text-yellow-300", 
            price: window.GameConfig.ShopItems.BuffSpeed, 
            desc: "-10% Growth Time (24h)",
            category: "Consumable"
        },
        { 
            id: 'growth_fert', type: 'buff', buffKey: 'growth_speed', 
            name: "Growth Fertilizer", 
            icon: "fa-flask", color: "text-green-400", 
            price: window.GameConfig.ShopItems.BuffGrowth, 
            desc: "-20% Growth Time (24h)",
            category: "Consumable"
        },
        { 
            id: 'trade_permit', type: 'buff', buffKey: 'sell_bonus', 
            name: "Trade Permit", 
            icon: "fa-file-contract", color: "text-purple-400", 
            price: window.GameConfig.ShopItems.BuffTrade, 
            desc: "+20% Sell Price (24h)",
            category: "Consumable"
        },
        { 
            id: 'yield_boost', type: 'buff', buffKey: 'yield_bonus', 
            name: "Yield Booster", 
            icon: "fa-wheat", color: "text-amber-500", 
            price: window.GameConfig.ShopItems.BuffYield, 
            desc: "+25% Double Crop Chance",
            category: "Consumable"
        },
        { 
            id: 'rare_boost', type: 'buff', buffKey: 'rare_luck', 
            name: "Rare Essence", 
            icon: "fa-gem", color: "text-pink-400", 
            price: window.GameConfig.ShopItems.BuffRare, 
            desc: "+20% Rare Drop Luck (24h)",
            category: "Consumable"
        }
    ],

    init() {
        const shopContainer = document.getElementById('Shop');
        if (shopContainer) this.renderLayout(shopContainer);
        
        // Refresh harga jual tanaman saat init
        if(window.GameState && GameState.refreshMarketPrices) {
            GameState.refreshMarketPrices();
        }
        
        this.checkExpiredBuffs();
        this.switchTab(this.currentTab);
    },

    // --- LOGIC KOMISI AFFILIATE ---
    async triggerAffiliateCommission(totalSales) {
        if (!GameState.user) return;
        const commission = Math.floor(totalSales * 0.10);
        
        // 1. Aktivasi Akun (First Market Sell)
        if (GameState.user.referral_status === 'Pending') {
            GameState.user.referral_status = 'Active';
            console.log("[AFFILIATE] Account Activated via Market");
        }

        // 2. Logic Komisi Upline
        if (GameState.user.upline && commission > 0) {
            console.log(`[AFFILIATE] Commission ${commission} PTS for ${GameState.user.upline}`);
        }
    },

    // --- RENDER UTAMA ---
    renderLayout(container) {
        container.innerHTML = '';
        container.className = "h-full flex flex-col p-5 animate-in pb-28"; 
        
        // HEADER CANTIK
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 class="text-3xl font-black text-white italic uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Market</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global Trading Post</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-800 rounded-xl shadow-lg flex items-center justify-center border border-white/10 transform -rotate-3 hover:rotate-0 transition-transform">
                    <i class="fas fa-store text-white text-xl drop-shadow-md"></i>
                </div>
            </div>
        `;
        container.appendChild(header);

        // TAB SWITCHER
        const tabContainer = document.createElement('div');
        tabContainer.className = "flex gap-2 bg-black/30 p-1 rounded-2xl border border-white/5 mb-6 shrink-0 backdrop-blur-md";
        tabContainer.innerHTML = `
            <button id="tab-sell" onclick="MarketSystem.switchTab('sell')" class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 group">
                <i class="fas fa-sack-dollar text-sm group-hover:scale-110 transition-transform"></i> Sell Crops
            </button>
            <button id="tab-buy" onclick="MarketSystem.switchTab('buy')" class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 group">
                <i class="fas fa-cart-shopping text-sm group-hover:scale-110 transition-transform"></i> Buy Items
            </button>
        `;
        container.appendChild(tabContainer);

        // CONTENT AREA
        const contentArea = document.createElement('div');
        contentArea.className = "flex-1 relative overflow-hidden min-h-0";
        contentArea.innerHTML = `
            <div id="area-sell" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 overflow-y-auto no-scrollbar pb-10">
                <div class="glass p-5 rounded-[2rem] border border-white/10 relative overflow-hidden shrink-0 group">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>
                    <div class="relative z-10 flex justify-between items-end">
                        <div>
                            <p class="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-widest">Estimated Value</p>
                            <h3 id="preview-coins" class="text-3xl font-black text-white tracking-tight">0 <span class="text-xs text-emerald-500">PTS</span></h3>
                            <p class="text-[8px] text-emerald-400 mt-1 flex items-center gap-1"><i class="fas fa-chart-line"></i> Market is open</p>
                        </div>
                        <button id="price-booster-btn" onclick="MarketSystem.applyPriceBooster()" class="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-transform hover:bg-purple-500/30">
                            <i class="fas fa-ad"></i> Boost +20%
                        </button>
                    </div>
                </div>

                <div id="sell-inventory" class="grid grid-cols-2 gap-2 content-start"></div>
                
                <div class="fixed bottom-5 left-2 right-4 flex gap-3 z-100 w-full py-4">
                <button id="btn-sell-all" onclick="MarketSystem.sellAll()" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/30 active:scale-95 transition-all mt-auto shrink-0 flex items-center justify-center gap-2 border border-emerald-400/20">
                    <i class="fas fa-check-double"></i> Sell All Warehouse
                </button>
                </div>
            </div>

            <div id="area-buy" class="absolute inset-0 flex flex-col gap-4 transition-all duration-300 hidden overflow-y-auto no-scrollbar pb-10">
                <div id="shop-assets" class="flex flex-col gap-2"></div>
                <div class="w-full h-px bg-white/5 my-2"></div>
                <h3 class="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2">Daily Consumables</h3>
                <div id="shop-consumables" class="grid grid-cols-2 gap-2"></div>
            </div>`;
        container.appendChild(contentArea);
    },

    switchTab(tab) {
        this.currentTab = tab;
        const areaBuy = document.getElementById('area-buy');
        const areaSell = document.getElementById('area-sell');
        const btnSell = document.getElementById('tab-sell');
        const btnBuy = document.getElementById('tab-buy');
        if (!areaBuy || !areaSell) return;

        if (tab === 'buy') {
            areaBuy.classList.remove('hidden');
            areaSell.classList.add('hidden');
            
            btnBuy.className = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500 text-black shadow-lg";
            btnSell.className = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 text-gray-400 hover:text-white";
            
            this.renderShopItems();
        } else {
            areaSell.classList.remove('hidden');
            areaBuy.classList.add('hidden');
            btnSell.className = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500 text-black shadow-lg";
            btnBuy.className = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 text-gray-400 hover:text-white";

            this.renderSellInventory();
            this.calculatePreview();
            this.checkBoosterStatus();
        }
    },

// --- LOGIC JUAL (SECURE BACKEND VERSION) ---
    async processSell(key, qty, price) {
        // 1. Tampilkan Loading agar user tahu sistem sedang bekerja
        if(window.UIEngine) {
            UIEngine.showRewardPopup("PROCESSING", `Selling ${qty} ${key}...`, null, "...");
        }

        try {
            // 2. Panggil API Vercel
            const response = await fetch('/api/market/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId, // ID User Telegram
                    key: key,                      // Nama item (misal: 'ginger')
                    qty: qty                       // Jumlah
                })
            });

            const result = await response.json();

            // 3. Cek Hasil
            if (result.success) {
                // SUKSES: Kita harus update tampilan UI User secara manual
                // karena koin sudah bertambah di server, tapi di layar belum berubah.
                
                // Ambil harga total yang dihitung server (bisa jadi beda dikit sama preview, itu wajar)
                // Kita reload state agar sinkron total
                await GameState.load(); 

                // Jika ingin UI instan tanpa load (opsional, biar cepat):
                // GameState.warehouse[key] -= qty;
                // GameState.user.coins += (price * qty); // Estimasi sementara

                [cite_start]// Update UI Header (Koin & Nama) [cite: 284]
                UIEngine.updateHeader();
                
                [cite_start]// Render ulang inventory stok [cite: 47]
                this.renderSellInventory();
                
                [cite_start]// Update preview harga total [cite: 63]
                this.calculatePreview();

                // Trigger Affiliate (Opsional: Sebaiknya logic ini juga pindah ke backend nanti)
                // await this.triggerAffiliateCommission(...); 

                UIEngine.showRewardPopup("SOLD", `Transaction Successful!`, null, "OK");
            } else {
                // GAGAL (Misal: Stok server habis / Terdeteksi cheat)
                UIEngine.showRewardPopup("FAILED", `Error: ${result.error}`, null, "CLOSE");
            }

        } catch (error) {
            console.error("Sell Error:", error);
            UIEngine.showRewardPopup("ERROR", "Connection failed. Check internet.", null, "CLOSE");
        }
    },

    async sellAll() {
        const total = this.calculatePreview();
        if (total <= 0) return;

        UIEngine.showRewardPopup("CONFIRM SALE", `Sell everything for ${total.toLocaleString()} PTS?`, async () => {
            Object.keys(GameState.warehouse).forEach(k => { GameState.warehouse[k] = 0; });
            GameState.user.coins += total;
            GameState.user.totalSold += total;
            
            await this.triggerAffiliateCommission(total);
            await GameState.save(); 

            UIEngine.updateHeader();
            this.renderSellInventory();
            this.calculatePreview();
            UIEngine.showRewardPopup("SOLD!", `Total Earned: ${total.toLocaleString()} PTS!`, null, "AWESOME");
        }, "SELL ALL");
    },

renderSellInventory() {
        const container = document.getElementById('sell-inventory');
        if (!container) return;
        container.innerHTML = '';
        let isEmpty = true;
        
        Object.keys(GameState.warehouse).forEach(key => {
            const count = GameState.warehouse[key];
            if (count > 0) {
                isEmpty = false;
                const plantInfo = (window.HerbData && HerbData[key]) ? HerbData[key] : { img: '', name: key };
                const currentPrice = GameState.getPrice(key);
                
                // [TAMPILAN BARU: COMPACT LIST (POIN 7)]
                container.innerHTML += `
                    <div onclick="MarketSystem.openSellModal('${key}', ${count}, ${currentPrice})" class="market-row cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <img src="${plantInfo.img}" class="w-6 h-6 object-contain drop-shadow-sm group-hover:scale-110 transition-transform">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-white uppercase leading-tight">${plantInfo.name}</span>
                                <span class="text-[7px] text-gray-500">Stock: ${count}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                             <div class="text-right">
                                <span class="text-[9px] font-black text-emerald-400 block">${currentPrice} PTS</span>
                                <span class="text-[6px] text-gray-500 uppercase">Per Unit</span>
                             </div>
                             <i class="fas fa-chevron-right text-[8px] text-gray-600"></i>
                        </div>
                    </div>`;
            }
        });
        
        if (isEmpty) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 opacity-50 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <i class="fas fa-basket-shopping text-2xl text-gray-600 mb-2"></i>
                    <p class="text-[8px] uppercase font-bold text-gray-500">Warehouse Empty</p>
                </div>`;
        }
    },

    openSellModal(key, maxQty, price) {
        const plantName = (window.HerbData && HerbData[key]) ? HerbData[key].name : key;
        UIEngine.showRewardPopup("SELL ITEM", `
            <div class="text-center mb-4"><h3 class="text-lg font-black text-emerald-400 uppercase">${plantName}</h3><p class="text-[9px] text-gray-400">Price: ${price} PTS/unit</p></div>
            <div class="bg-black/40 p-3 rounded-xl mb-4 border border-white/10">
                <input type="range" id="sell-slider" min="1" max="${maxQty}" value="${maxQty}" class="w-full accent-emerald-500 mb-2 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" oninput="document.getElementById('sell-qty-display').innerText = this.value; document.getElementById('sell-total-display').innerText = (this.value * ${price}).toLocaleString();">
                <div class="flex justify-between text-[9px] font-bold text-white mt-2"><span>Qty: <span id="sell-qty-display" class="text-emerald-400">${maxQty}</span></span><span>Total: <span id="sell-total-display" class="text-yellow-400">${(maxQty * price).toLocaleString()}</span> PTS</span></div>
            </div>`, () => {
            const qtyToSell = parseInt(document.getElementById('sell-slider').value);
            this.processSell(key, qtyToSell, price);
        }, "CONFIRM SELL");
    },

    getSellMultiplier() {
        let multiplier = 1;
        if (GameState.user.adBoosterCooldown > Date.now()) multiplier += 0.2; 
        const activeBuffs = GameState.user.activeBuffs || {};
        // [FIX POIN 8] Turunkan jadi 0.15 (15%)
        if (activeBuffs['sell_bonus'] && activeBuffs['sell_bonus'] > Date.now()) multiplier += 0.15;
        return multiplier;
    },
    calculatePreview() {
        let total = 0;
        Object.keys(GameState.warehouse).forEach(item => {
            total += GameState.warehouse[item] * GameState.getPrice(item);
        });
        total = Math.floor(total * this.getSellMultiplier());
        const previewEl = document.getElementById('preview-coins');
        if (previewEl) previewEl.innerHTML = `${total.toLocaleString()} <span class="text-[10px] text-emerald-500 font-bold">PTS</span>`;
        return total;
    },

    // --- LOGIC SHOP (BUY) ---
    renderShopItems() {
       const assetContainer = document.getElementById('shop-assets');
       const consumContainer = document.getElementById('shop-consumables');
       if (!assetContainer || !consumContainer) return;

       assetContainer.innerHTML = '';
       consumContainer.innerHTML = '';

       const activeBuffs = GameState.user.activeBuffs || {};
       
       this.shopItems.forEach(item => {
            let disabled = false;
            let btnText = `${item.price.toLocaleString()} PTS`;
            let btnClass = "bg-white/5 text-white hover:bg-white/10 border-white/10";
            
            // LOGIC CEK STATUS ITEM
            if (item.type === 'land') {
                const purchased = GameState.user.landPurchasedCount || 0;
                // Jika Tier 1 (Slot 2) belum dibeli, disable Tier 2 (Slot 3)
                if (item.tier === 1 && purchased >= 1) { disabled = true; btnText = "OWNED"; btnClass = "bg-gray-800 text-gray-500 border-transparent"; }
                if (item.tier === 2 && purchased < 1) { disabled = true; btnText = "LOCKED"; btnClass = "bg-red-900/20 text-red-500 border-red-500/20 opacity-50"; }
                if (item.tier === 2 && purchased >= 2) { disabled = true; btnText = "OWNED"; btnClass = "bg-gray-800 text-gray-500 border-transparent"; }
            } 
            else if (item.type === 'buff') {
                if (activeBuffs[item.buffKey] > Date.now()) { 
                    disabled = true;
                    btnText = "ACTIVE"; 
                    btnClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse"; 
                } else {
                    btnClass = "bg-white/10 text-white hover:bg-white/20 border-white/5";
                }
            }
            else if (item.type === 'storage') {
                 btnClass = "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 border-transparent";
            }

            // HTML CARD
            const html = `
            <div class="glass p-3 rounded-2xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
                <div class="flex items-start justify-between mb-2">
                    <div class="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                        <i class="fas ${item.icon} ${item.color} text-sm"></i>
                    </div>
                    ${item.type === 'land' ? '<i class="fas fa-star text-[8px] text-yellow-500"></i>' : ''}
                </div>
                <div class="mb-2">
                    <h4 class="text-[9px] font-black uppercase text-white leading-tight mb-0.5">${item.name}</h4>
                    <p class="text-[7px] text-gray-400 leading-tight">${item.desc}</p>
                </div>
                <button onclick="MarketSystem.buyItem('${item.id}', ${item.price})" class="w-full py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${btnClass}" ${disabled ? 'disabled' : ''}>
                    ${btnText}
                </button>
            </div>`;
            
            if (item.category === 'Asset') {
                const assetHtml = `
                <div class="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 relative overflow-hidden">
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 shadow-inner">
                            <i class="fas ${item.icon} ${item.color} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-[10px] font-black uppercase text-white">${item.name}</h4>
                            <p class="text-[8px] text-gray-400 font-bold max-w-[120px]">${item.desc}</p>
                        </div>
                    </div>
                    <button onclick="MarketSystem.buyItem('${item.id}', ${item.price})" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all min-w-[80px] ${btnClass}" ${disabled ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>`;
                assetContainer.innerHTML += assetHtml;
            } else {
                consumContainer.innerHTML += html;
            }
       });
    },

    // --- LOGIC TRANSAKSI BELI ---
async buyItem(id, price) {
        // Validasi Awal UI (Cek saldo lokal dulu biar cepat, tapi server tetap cek lagi)
        if (GameState.user.coins < price) { 
            UIEngine.showRewardPopup("NO FUNDS", "Not enough PTS!", null, "CLOSE");
            return;
        }

        const item = this.shopItems.find(i => i.id === id);
        
        UIEngine.showRewardPopup("CONFIRM BUY", `Purchase ${item.name} for ${price.toLocaleString()} PTS?`, async () => {
            
            // Loading
            UIEngine.showRewardPopup("PROCESSING", "Purchasing...", null, "...");

            try {
                const response = await fetch('/api/shop/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: GameState.user.userId,
                        itemId: id // Mengirim ID item, misal: 'land_2'
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Update State Lokal dari Server
                    await GameState.load();
                    
                    UIEngine.updateHeader();
                    this.renderShopItems(); // Refresh tombol (agar berubah jadi OWNED/ACTIVE)
                    
                    // Khusus jika beli tanah, update juga tampilan kebun
                    if (id.includes('land') && window.FarmSystem) {
                        FarmSystem.renderFarmGrid();
                    }

                    UIEngine.showRewardPopup("SUCCESS", "Item Purchased Successfully!", null, "NICE");
                } else {
                    UIEngine.showRewardPopup("FAILED", result.error, null, "OK");
                }
            } catch (error) {
                console.error(error);
                UIEngine.showRewardPopup("ERROR", "Connection failed", null, "CLOSE");
            }

        }, "BUY NOW");
    },

    applyPriceBooster() {
        UIEngine.showRewardPopup("PRICE BOOSTER", "Watch Ad for +20% sell price?", async () => {
            
            // PANGGIL IKLAN
            AdsManager.showAd("Activate Booster", async () => {
                GameState.user.adBoosterCooldown = Date.now() + 86400000; 
                await GameState.save();
                this.checkBoosterStatus();
                this.calculatePreview();
                UIEngine.showRewardPopup("BOOST ACTIVE", "Sell prices increased by 20%!", null, "GO SELL");
            });

        }, "WATCH AD");
    },
    checkBoosterStatus() {
        const btn = document.getElementById('price-booster-btn');
        if(!btn) return;
        const now = Date.now();
        if (now < (GameState.user.adBoosterCooldown || 0)) {
            btn.innerHTML = `<i class="fas fa-clock"></i> Active`;
            btn.className = "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 cursor-default";
            btn.onclick = null;
        } else {
            btn.innerHTML = `<i class="fas fa-ad"></i> Boost +20%`;
            btn.className = "bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 active:scale-95 transition-transform hover:bg-purple-500/30 cursor-pointer";
            btn.onclick = () => this.applyPriceBooster();
        }
    },

    checkExpiredBuffs() {
        if (!GameState.user.activeBuffs) return;
        let changed = false;
        Object.keys(GameState.user.activeBuffs).forEach(k => {
            if(GameState.user.activeBuffs[k] < Date.now()) {
                delete GameState.user.activeBuffs[k];
                changed = true;
            }
        });
        if(changed) GameState.save();
    }
};


window.MarketSystem = MarketSystem;
