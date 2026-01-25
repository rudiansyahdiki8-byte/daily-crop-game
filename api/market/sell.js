import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS, CROPS } from '../../src/config/gameConstants.js';

// --- HELPER HARGA (RANDOM) ---
const getPriceRange = (itemName) => {
  for (const group of Object.values(CROPS)) {
    if (group.items.includes(itemName)) return group.priceRange;
  }
  return [10, 20];
};

const getHourlyPrice = (itemName, hourSeed) => {
  const [min, max] = getPriceRange(itemName); 
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
    const { userId, useAdBooster, itemName, qty } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      // 1. AMBIL DATA USER
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      const inventory = userData.inventory || {};
      const currentHourSeed = Math.floor(Date.now() / 3600000); 
      
      // 2. TENTUKAN ITEM YANG DIJUAL
      let itemsToSell = {}; 
      if (itemName) {
         // Jual Eceran
         const currentStock = inventory[itemName] || 0;
         if (currentStock <= 0) throw new Error(`Stok ${itemName} kosong!`);

         let sellQty = currentStock; 
         if (qty && qty > 0) {
             if (qty > currentStock) throw new Error("Stok tidak cukup!");
             sellQty = parseInt(qty);
         }
         itemsToSell[itemName] = sellQty;
      } else {
         // Jual Semua
         itemsToSell = inventory;
      }

      // 3. HITUNG PENDAPATAN
      let totalItems = 0;
      let totalRevenue = 0;
      const soldDetails = [];

      for (const [item, count] of Object.entries(itemsToSell)) {
        if (count > 0) {
          const price = getHourlyPrice(item, currentHourSeed);
          totalRevenue += price * count;
          totalItems += count;
          soldDetails.push({ name: item, qty: count, price });
        }
      }

      if (totalItems === 0) throw new Error("Tidak ada item untuk dijual.");

      // 4. HITUNG BONUS (Plan + Buff + Ads)
      const userPlan = PLANS[userData.plan || 'FREE'];
      let bonusPct = userPlan.bonusSell || 0;
      
      const buffs = userData.buffs || {};
      if (buffs['TRADE_PERMIT'] && buffs['TRADE_PERMIT'] > Date.now()) {
         bonusPct += 0.10; // +10% dari Item Toko
      }

      if (useAdBooster) {
         const lastBoost = userData.lastAdBoost || 0;
         const oneDay = 24 * 60 * 60 * 1000;
         if (Date.now() - lastBoost < oneDay) {
            throw new Error("Booster Iklan cooldown (24h)!");
         }
         bonusPct += 0.20; // +20% dari Iklan
         t.update(userRef, { lastAdBoost: Date.now() });
      }

      const bonusAmount = Math.floor(totalRevenue * bonusPct);
      const finalRevenue = totalRevenue + bonusAmount;

      // ============================================
      // 5. LOGIC AFFILIATE (SISTEM UPLINE) - [RESTORED]
      // ============================================
      if (userData.uplineId) {
          // Kita harus baca doc Upline di dalam transaksi agar aman
          const uplineRef = getUserRef(userData.uplineId);
          const uplineDoc = await t.get(uplineRef);
          
          if (uplineDoc.exists) {
              const commission = Math.floor(finalRevenue * 0.10); // 10% Komisi
              if (commission > 0) {
                  const uData = uplineDoc.data();
                  t.update(uplineRef, {
                      balance: (uData.balance || 0) + commission,
                      affiliateEarnings: (uData.affiliateEarnings || 0) + commission
                  });
              }
          }
      }

      // ============================================
      // 6. UPDATE DATA USER & HISTORY LOG
      // ============================================
      
      // Update Inventory (Kurangi Stok)
      const newInventory = { ...userData.inventory };
      for (const [item, count] of Object.entries(itemsToSell)) {
          newInventory[item] = (newInventory[item] || 0) - count;
          if (newInventory[item] <= 0) delete newInventory[item];
      }

      // Buat Log History Baru (Untuk Profile Tab)
      const logEntry = {
          type: 'SELL',
          amount: finalRevenue,
          desc: `Jual ${totalItems} item (+Bonus ${(bonusPct*100).toFixed(0)}%)`,
          date: Date.now()
      };
      
      // Gabungkan dengan history lama (Max simpan 50 terakhir biar hemat DB)
      const currentHistory = userData.history || [];
      const newHistory = [logEntry, ...currentHistory].slice(0, 50);

      t.update(userRef, {
        inventory: newInventory, 
        balance: (userData.balance || 0) + finalRevenue,
        totalSales: (userData.totalSales || 0) + finalRevenue,
        history: newHistory // <--- Simpan History
      });

      return { 
        totalReceived: finalRevenue, 
        itemsSold: totalItems, 
        bonusPct: (bonusPct*100).toFixed(0),
        soldDetails 
      };
    });

    return sendSuccess(res, result, `Terjual! +${result.totalReceived} PTS`);

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}