import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS, CROPS } from '../../src/config/gameConstants.js'; // Import CROPS

// Helper: Cari Range Harga berdasarkan Nama Item
const getPriceRange = (itemName) => {
  // Loop semua kategori (Common, Rare, dll)
  for (const group of Object.values(CROPS)) {
    if (group.items.includes(itemName)) {
      return group.priceRange; // Ketemu! Return [min, max]
    }
  }
  return [10, 20]; // Default jika item tidak dikenal
};

// Logic Harga Per Jam (Tetap sama, tapi pakai range dinamis)
const getHourlyPrice = (itemName, hourSeed) => {
  const [min, max] = getPriceRange(itemName); // <--- Ambil dari Config

  // Pseudo-random generator
  const seedString = `${hourSeed}-${itemName}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }
  const rand01 = Math.abs(hash) / 2147483647;

  return Math.floor(min + (rand01 * (max - min)));
};

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, useAdBooster } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      const inventory = userData.inventory || {};
      let totalItems = 0;
      let totalRevenue = 0;
      
      const currentHourSeed = Math.floor(Date.now() / 3600000); 

      const soldItems = [];
      for (const [item, qty] of Object.entries(inventory)) {
        if (qty > 0) {
          const price = getHourlyPrice(item, currentHourSeed);
          totalRevenue += price * qty;
          totalItems += qty;
          soldItems.push({ name: item, qty, price });
        }
      }

      if (totalItems === 0) throw new Error("Gudang kosong!");

      // --- LOGIC BONUS (Tetap Sama) ---
      const userPlan = PLANS[userData.plan || 'FREE'];
      let bonusPct = userPlan.bonusSell || 0;

      const buffs = userData.buffs || {};
      if (buffs.TRADE_PERMIT > Date.now()) {
         bonusPct += 0.10;
      }

      if (useAdBooster) {
         const lastBoost = userData.lastAdBoost || 0;
         const oneDay = 24 * 60 * 60 * 1000;
         if (Date.now() - lastBoost < oneDay) {
            throw new Error("Booster Iklan hanya bisa 1x per 24 Jam!");
         }
         bonusPct += 0.20;
         t.update(userRef, { lastAdBoost: Date.now() });
      }

      const bonusAmount = Math.floor(totalRevenue * bonusPct);
      const finalRevenue = totalRevenue + bonusAmount;

      // --- AFFILIATE & HISTORY (Tetap Sama) ---
      let commissionLog = null;
      if (userData.uplineId) {
        const commission = Math.floor(finalRevenue * 0.10);
        if (commission > 0) {
            const uplineRef = getUserRef(userData.uplineId);
            // Note: Idealnya dipisah dari transaksi ini untuk performa/safety
            uplineRef.get().then(uDoc => {
                if(uDoc.exists) {
                    const uData = uDoc.data();
                    uplineRef.update({
                        balance: (uData.balance || 0) + commission,
                        affiliateEarnings: (uData.affiliateEarnings || 0) + commission
                    });
                }
            });
            commissionLog = `Sent ${commission} to Upline`;
        }
      }

      const logData = {
        type: 'SELL',
        amount: finalRevenue,
        desc: `Jual ${totalItems} item (Bonus ${(bonusPct*100).toFixed(0)}%)`,
        date: Date.now()
      };
      const newHistory = [logData, ...(userData.history || [])].slice(0, 50);

      t.update(userRef, {
        inventory: {}, 
        balance: (userData.balance || 0) + finalRevenue,
        totalSales: (userData.totalSales || 0) + finalRevenue,
        history: newHistory
      });

      return { 
        totalReceived: finalRevenue, 
        itemsSold: totalItems, 
        baseRevenue: totalRevenue,
        bonusPct: (bonusPct*100).toFixed(0),
        soldDetails: soldItems 
      };
    });

    return sendSuccess(res, result, "Penjualan Sukses!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}