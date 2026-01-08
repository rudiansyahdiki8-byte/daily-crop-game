// market.js
// MARKET & WAREHOUSE LOGIC

const Market = {
  prices: {
    leaf: 30,
    carrot: 40,
    corn: 50,
    chili: 60
  },

  init() {
    this.updateWarehouseUI();
    this.updatePreview();
  },

  /* =========================
     WAREHOUSE UI
  ========================= */
  updateWarehouseUI() {
    const inv = GameState.data.inventory;

    if (document.getElementById("inv-leaf"))
      document.getElementById("inv-leaf").innerText = inv.leaf || 0;

    if (document.getElementById("inv-carrot"))
      document.getElementById("inv-carrot").innerText = inv.carrot || 0;

    if (document.getElementById("inv-corn"))
      document.getElementById("inv-corn").innerText = inv.corn || 0;

    if (document.getElementById("inv-chili"))
      document.getElementById("inv-chili").innerText = inv.chili || 0;
  },

  /* =========================
     PREVIEW SELL
  ========================= */
  updatePreview() {
    let total = 0;

    ["leaf", "carrot", "corn", "chili"].forEach(type => {
      const input = document.getElementById("input-" + type);
      if (!input) return;

      const qty = parseInt(input.value) || 0;
      total += qty * this.prices[type];
    });

    const el = document.getElementById("sell-preview");
    if (el) el.innerText = total.toLocaleString() + " Pts";
  },

  /* =========================
     SET MAX
  ========================= */
  setMax(type) {
    const inv = GameState.data.inventory;
    const input = document.getElementById("input-" + type);
    if (!input) return;

    input.value = inv[type] || 0;
    this.updatePreview();
  },

  /* =========================
     SELL MANUAL
  ========================= */
  sellManual() {
    const inv = GameState.data.inventory;
    let total = 0;

    ["leaf", "carrot", "corn", "chili"].forEach(type => {
      const input = document.getElementById("input-" + type);
      if (!input) return;

      const qty = parseInt(input.value) || 0;
      if (qty > inv[type]) return;

      inv[type] -= qty;
      total += qty * this.prices[type];
      input.value = "";
    });

    if (total <= 0) {
      alert("Nothing to sell");
      return;
    }

    GameState.data.wallet.coin += total;
    GameState.data.wallet.totalEarned += total;

    GameState.save();
    this.updateWarehouseUI();
    this.updatePreview();
  },

  /* =========================
     SELL ALL
  ========================= */
  sellAll() {
    const inv = GameState.data.inventory;
    let total = 0;

    Object.keys(this.prices).forEach(type => {
      total += (inv[type] || 0) * this.prices[type];
      inv[type] = 0;
    });

    if (total <= 0) {
      alert("Warehouse is empty");
      return;
    }

    GameState.data.wallet.coin += total;
    GameState.data.wallet.totalEarned += total;

    GameState.save();
    this.updateWarehouseUI();
    this.updatePreview();
  }
};

window.Market = Market;

