import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { PLANS, CROPS } from '../../src/config/gameConstants.js';

// Helper Harga (Random per Jam - Tidak terpengaruh supply/demand)
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
    // TAMBAHAN: qty (jumlah yang mau dijual, opsional)
    const { userId, useAdBooster, itemName, qty } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      const inventory = userData.inventory || {};
      const currentHourSeed = Math.floor(Date.now() / 3600000); 
      
      let itemsToSell = {}; 

      // 1. TENTUKAN APA YANG DIJUAL
      if (itemName) {
         // Cek Stok
         const currentStock = inventory[itemName] || 0;
         if (currentStock <= 0) throw new Error(`Stok ${itemName} kosong!`);

         // LOGIC JUAL SATUAN / JUMLAH TERTENTU
         let sellQty = currentStock; // Default jual semua stok item ini
         if (qty && qty > 0) {
             if (qty > currentStock) throw new Error("Stok tidak cukup!");
             sellQty = parseInt(qty);
         }
         
         itemsToSell[itemName] = sellQty;
      } else {
         // JUAL SEMUA ISI GUDANG (Wholesale)
         itemsToSell = inventory;
      }

      // 2. HITUNG PENDAPATAN
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

      // 3. LOGIC BONUS
      const userPlan = PLANS[userData.plan || 'FREE'];
      let bonusPct = userPlan.bonusSell || 0;
      
      const buffs = userData.buffs || {};
      if (buffs['TRADE_PERMIT'] && buffs['TRADE_PERMIT'] > Date.now()) {
         bonusPct += 0.10;
      }

      if (useAdBooster) {
         const lastBoost = userData.lastAdBoost || 0;
         const oneDay = 24 * 60 * 60 * 1000;
         if (Date.now() - lastBoost < oneDay) {
            throw new Error("Booster Iklan cooldown (24h)!");
         }
         bonusPct += 0.20;
         t.update(userRef, { lastAdBoost: Date.now() });
      }

      const bonusAmount = Math.floor(totalRevenue * bonusPct);
      const finalRevenue = totalRevenue + bonusAmount;

      // 4. UPDATE DATA
      const newInventory = { ...userData.inventory };
      
      // Update stok inventory
      for (const [item, count] of Object.entries(itemsToSell)) {
          newInventory[item] = (newInventory[item] || 0) - count;
          if (newInventory[item] <= 0) delete newInventory[item]; // Hapus jika 0
      }
      
      t.update(userRef, {
        inventory: newInventory, 
        balance: (userData.balance || 0) + finalRevenue,
        totalSales: (userData.totalSales || 0) + finalRevenue
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