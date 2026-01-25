import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// KITA DEFINISIKAN ULANG DISINI AGAR BACKEND TIDAK ERROR IMPORT
// (Copy Paste isi SPIN_PRIZES dari gameConstants.js ke sini agar aman di server Vercel)
const SPIN_PRIZES = [
{ id: 'COIN_50',      type: 'COIN', val: 50,    label: '50 PTS',      color: '#B0BEC5', weight: 300 }, // 30% (Sangat Mudah)
  { id: 'COMMON_CROP',  type: 'ITEM', val: 'Cabbage', label: 'Cabbage', color: '#4CAF50', weight: 200 }, // 20% (Mudah)
  { id: 'BOOSTER_1',    type: 'ITEM', val: 'SPEED_SOIL', label: 'Speed Soil', color: '#03A9F4', weight: 150 }, // 15% (Lumayan)
  { id: 'COIN_100',     type: 'COIN', val: 100,   label: '100 PTS',     color: '#81D4FA', weight: 120 }, // 12%
  { id: 'RARE_CROP',    type: 'ITEM', val: 'Bell Pepper', label: 'Pepper', color: '#2196F3', weight: 80 },  // 8% (Jarang)
  { id: 'BOOSTER_2',    type: 'ITEM', val: 'GROWTH_FERT', label: 'Fertilizer', color: '#00BCD4', weight: 60 },  // 6%
  { id: 'COIN_200',     type: 'COIN', val: 200,   label: '200 PTS',     color: '#FF9800', weight: 40 },  // 4% (Susah)
  { id: 'EPIC_CROP',    type: 'ITEM', val: 'Shiitake Mushroom', label: 'Shiitake', color: '#9C27B0', weight: 25 },  // 2.5% (Sangat Susah)
  { id: 'BOOSTER_3',    type: 'ITEM', val: 'TRADE_PERMIT', label: 'Permit', color: '#673AB7', weight: 15 },  // 1.5%
  { id: 'LEGENDARY',    type: 'ITEM', val: 'Wasabi', label: 'WASABI',   color: '#FFD700', weight: 5 },   // 0.5% (Extrem)
  { id: 'BOOSTER_4',    type: 'ITEM', val: 'RARE_ESSENCE', label: 'Essence', color: '#E91E63', weight: 4 },   // 0.4%
  { id: 'JACKPOT',      type: 'COIN', val: 1000,  label: 'JACKPOT',     color: '#FF1744', weight: 1 }    // 0.1% (Hampir Mustahil)
  ];

const SPIN_CONFIG = {
  COST_PAID: 150,
  COOLDOWN_FREE: 3600 
};

// Logic Pengacak Berdasarkan Bobot (Weighted Random)
const getRandomReward = () => {
  const totalWeight = SPIN_PRIZES.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const reward of SPIN_PRIZES) {
    if (random < reward.weight) return reward;
    random -= reward.weight;
  }
  return SPIN_PRIZES[0]; // Fallback ke hadiah terendah (Coin 50)
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, mode } = req.body; 
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      
      const userData = doc.data();
      const now = Date.now();

      // 1. Validasi Pembayaran / Cooldown
      if (mode === 'FREE') {
        const lastSpin = userData.lastFreeSpin || 0;
        const cooldownMs = SPIN_CONFIG.COOLDOWN_FREE * 1000;
        if (now - lastSpin < cooldownMs) {
           throw new Error("Cooldown! Silakan tunggu.");
        }
        t.update(userRef, { lastFreeSpin: now });
      } else if (mode === 'PAID') {
        if ((userData.balance || 0) < SPIN_CONFIG.COST_PAID) {
          throw new Error("Saldo tidak cukup!");
        }
        t.update(userRef, { balance: (userData.balance || 0) - SPIN_CONFIG.COST_PAID });
      }

      // 2. Tentukan Hadiah
      const reward = getRandomReward();

      // 3. Berikan Hadiah
      if (reward.type === 'COIN') {
        // Ambil balance terbaru (karena mungkin baru dipotong bayar spin)
        const currentBal = (mode === 'PAID') ? (userData.balance - SPIN_CONFIG.COST_PAID) : (userData.balance || 0);
        t.update(userRef, { balance: currentBal + reward.val });
      } 
      else if (reward.type === 'ITEM') {
        // Hadiah Item / Booster masuk ke Inventory
        const itemName = reward.val;
        const currentQty = (userData.inventory && userData.inventory[itemName]) || 0;
        t.update(userRef, { [`inventory.${itemName}`]: currentQty + 1 });
      }

      return { rewardId: reward.id, rewardName: reward.val, type: reward.type };
    });

    return sendSuccess(res, result, "Spin Berhasil!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}