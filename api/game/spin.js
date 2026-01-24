import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

// --- CONFIG INTERNAL (Hardcoded agar tidak Error Path) ---
const SPIN_CONFIG = {
  COST_PAID: 150,
  COOLDOWN_FREE: 3600 // 1 Jam (dalam detik)
};

const REWARDS = [
  { id: 'COIN_50', type: 'COIN', val: 50, weight: 40 },
  { id: 'COIN_100', type: 'COIN', val: 100, weight: 25 },
  { id: 'COIN_200', type: 'COIN', val: 200, weight: 10 },
  { id: 'JACKPOT', type: 'COIN', val: 1000, weight: 1 },
  // Kita sederhanakan Item agar tidak butuh file CROPS
  { id: 'ITEM_SPINACH', type: 'ITEM', itemName: 'Spinach', weight: 8 },
  { id: 'ITEM_CORN', type: 'ITEM', itemName: 'Corn', weight: 8 },
  { id: 'ITEM_TOMATO', type: 'ITEM', itemName: 'Tomato', weight: 5 },
  { id: 'ITEM_BROCCOLI', type: 'ITEM', itemName: 'Broccoli', weight: 3 },
];

const getRandomReward = () => {
  const totalWeight = REWARDS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const reward of REWARDS) {
    if (random < reward.weight) return reward;
    random -= reward.weight;
  }
  return REWARDS[0];
};

export default async function handler(req, res) {
  // Debug Log: Cek apakah request masuk
  console.log("SPIN REQUEST:", req.body);

  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, mode } = req.body; 
    
    if (!userId) throw new Error("User ID hilang");
    
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found di Database");
      
      const userData = doc.data();
      const now = Date.now();

      // 1. Validasi Mode
      if (mode === 'FREE') {
        const lastSpin = userData.lastFreeSpin || 0;
        const cooldownMs = SPIN_CONFIG.COOLDOWN_FREE * 1000;
        
        if (now - lastSpin < cooldownMs) {
          const sisaDetik = Math.ceil((lastSpin + cooldownMs - now) / 1000);
          const menit = Math.floor(sisaDetik / 60);
          const detik = sisaDetik % 60;
          throw new Error(`Cooldown! Tunggu ${menit}m ${detik}s lagi.`);
        }
        // Update waktu spin
        t.update(userRef, { lastFreeSpin: now });
      
      } else if (mode === 'PAID') {
        const cost = SPIN_CONFIG.COST_PAID;
        const currentBalance = userData.balance || 0;
        
        if (currentBalance < cost) {
          throw new Error(`Saldo tidak cukup. Butuh ${cost} PTS, Anda punya ${currentBalance}.`);
        }
        // Potong saldo
        t.update(userRef, { balance: currentBalance - cost });
      } else {
        throw new Error("Mode Spin tidak valid (Harus FREE atau PAID)");
      }

      // 2. Kocok Hadiah
      const reward = getRandomReward();
      
      // 3. Update Hadiah ke User
      // (Kita baca ulang data 'balance' untuk amannya jika pakai PAID, atau pakai logic increment)
      if (reward.type === 'COIN') {
        const existingBalance = (mode === 'PAID') ? (userData.balance - SPIN_CONFIG.COST_PAID) : (userData.balance || 0);
        t.update(userRef, { balance: existingBalance + reward.val });
      } 
      else if (reward.type === 'ITEM') {
        const inv = userData.inventory || {};
        const currentQty = inv[reward.itemName] || 0;
        t.update(userRef, { [`inventory.${reward.itemName}`]: currentQty + 1 });
      }

      return { reward, mode };
    });

    console.log("SPIN SUCCESS:", result);
    return sendSuccess(res, result, "Spin Berhasil!");

  } catch (error) {
    console.error("SPIN ERROR:", error.message);
    return sendError(res, 400, error.message);
  }
}