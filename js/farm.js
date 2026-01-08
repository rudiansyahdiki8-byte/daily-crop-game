// farm.js
// FARM CORE LOGIC (PLANT • TIMER • HARVEST)

const Farm = {
  /* =========================
     INIT
  ========================= */
  init() {
    this.grid = document.getElementById("garden-grid");
    if (!this.grid) return;

    this.render();
    this.startTimer();
  },

  /* =========================
     RENDER
  ========================= */
  render() {
    this.grid.innerHTML = "";

    GameState.data.farm.slots.forEach(slot => {
      const el = document.createElement("div");
      el.className =
        "glass aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-b-4 border-emerald-500 btn-press";

      // EMPTY SLOT
      if (!slot.crop) {
        el.innerHTML = `
          <span class="text-3xl">➕</span>
          <span class="text-[8px] font-black uppercase text-emerald-400">Plant</span>
        `;
        el.onclick = () => this.plant(slot.id);
      }

      // GROWING
      else if (!slot.isReady) {
        const remain = Math.max(
          0,
          Math.floor((slot.harvestAt - Date.now()) / 1000)
        );

        el.innerHTML = `
          <span class="text-3xl">🌱</span>
          <span class="text-[8px] text-gray-400">${this.formatTime(remain)}</span>
        `;
      }

      // READY
      else {
        el.innerHTML = `
          <span class="text-4xl animate-bounce">🥬</span>
          <span class="text-[8px] font-black text-emerald-400 uppercase">Harvest</span>
        `;
        el.onclick = () => this.harvest(slot.id);
      }

      this.grid.appendChild(el);
    });
  },

  /* =========================
     PLANT
  ========================= */
  plant(slotId) {
    const slot = GameState.data.farm.slots.find(s => s.id === slotId);
    if (!slot || slot.crop) return;

    const growTime = GameState.data.farm.baseGrowTime * 1000;

    slot.crop = "leaf";
    slot.plantedAt = Date.now();
    slot.harvestAt = Date.now() + growTime;
    slot.isReady = false;

    GameState.save();
    this.render();
  },

  /* =========================
     HARVEST
  ========================= */
  harvest(slotId) {
    const slot = GameState.data.farm.slots.find(s => s.id === slotId);
    if (!slot || !slot.isReady) return;

    // Anti spam
    const now = Date.now();
    if (now - GameState.data.security.lastHarvest < 1500) return;

    GameState.data.inventory.leaf += 1;
    GameState.data.security.lastHarvest = now;

    slot.crop = null;
    slot.plantedAt = 0;
    slot.harvestAt = 0;
    slot.isReady = false;

    GameState.save();
    this.render();
  },

  /* =========================
     TIMER LOOP
  ========================= */
  startTimer() {
    setInterval(() => {
      let updated = false;

      GameState.data.farm.slots.forEach(slot => {
        if (slot.crop && !slot.isReady && Date.now() >= slot.harvestAt) {
          slot.isReady = true;
          updated = true;
        }
      });

      if (updated) {
        GameState.save();
        this.render();
      }
    }, 1000);
  },

  /* =========================
     UTIL
  ========================= */
  formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  }
};

window.Farm = Farm;
