// state.js
// SINGLE SOURCE OF TRUTH — DO NOT DUPLICATE STATE

const GameState = {
  data: {
    user: {
      telegramId: null,
      username: "Guest",
      level: 1,
      license: "FREE", // FREE | BASIC | PRO | MASTER
      createdAt: Date.now()
    },

    wallet: {
      coin: 0,
      totalEarned: 0,
      totalWithdrawn: 0
    },

    inventory: {
      leaf: 0,
      carrot: 0,
      corn: 0,
      chili: 0
    },

    farm: {
      slots: [],
      maxSlots: 1,
      baseGrowTime: 6 * 60 * 60 // 6 hours (seconds)
    },

    boosters: {
      speed: {
        level: 0,
        expiresAt: 0
      },
      yield: {
        level: 0,
        expiresAt: 0
      }
    },

    security: {
      lastHarvest: 0,
      harvestCountToday: 0,
      adsUsedToday: 0
    }
  },

  /* =========================
     INIT
  ========================= */
  init(telegramUser) {
    if (telegramUser) {
      this.data.user.telegramId = telegramUser.id;
      this.data.user.username = telegramUser.username || telegramUser.first_name;
    }

    this.load();
    this.ensureFarmSlots();
    this.save();
  },

  /* =========================
     FARM SLOT SETUP
  ========================= */
  ensureFarmSlots() {
    while (this.data.farm.slots.length < this.data.farm.maxSlots) {
      this.data.farm.slots.push({
        id: this.data.farm.slots.length + 1,
        crop: null,
        plantedAt: 0,
        harvestAt: 0,
        isReady: false
      });
    }
  },

  /* =========================
     STORAGE
  ========================= */
  save() {
    localStorage.setItem("DAILYCROP_STATE", JSON.stringify(this.data));
  },

  load() {
    const saved = localStorage.getItem("DAILYCROP_STATE");
    if (!saved) return;

    try {
      this.data = JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load saved state");
    }
  },

  reset() {
    localStorage.removeItem("DAILYCROP_STATE");
    location.reload();
  }
};

window.GameState = GameState;
