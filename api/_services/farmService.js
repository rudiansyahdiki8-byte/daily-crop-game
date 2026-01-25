import { CROPS, GAME_CONFIG } from '../../src/config/gameConstants.js';
import { getUserRef } from '../_utils/firebase.js';

// --- HELPER: RNG System (Weighted Random / Anti-Zonk) ---
const rollCropRarity = () => {
  // Kita pakai angka dokumen sebagai "Bobot" agar total 100% selalu dapat hasil
  const rarities = [
    { type: 'COMMON', ...CROPS.COMMON },       // Weight 0.10
    { type: 'UNCOMMON', ...CROPS.UNCOMMON },   // Weight 0.06
    { type: 'RARE', ...CROPS.RARE },           // Weight 0.02
    { type: 'EPIC', ...CROPS.EPIC },           // Weight 0.005
    { type: 'LEGENDARY', ...CROPS.LEGENDARY }  // Weight 0.001
  ];

  const totalWeight = rarities.reduce((sum, r) => sum + r.chance, 0);
  let randomNum = Math.random() * totalWeight;

  for (const rarity of rarities) {
    if (randomNum < rarity.chance) {
      return rarity;
    }
    randomNum -= rarity.chance;
  }
  return rarities[0]; // Fallback aman
};

const getRandomItem = (itemsArray) => {
  return itemsArray[Math.floor(Math.random() * itemsArray.length)];
};

// --- LOGIC: MENANAM (Dipanggil saat Tutorial & Auto Replant) ---
export const plantSeed = (slotId) => {
  const rarityConfig = rollCropRarity();
  const cropName = getRandomItem(rarityConfig.items);
  
  const now = Date.now();
  // Konversi detik ke milidetik
  const harvestTime = now + (rarityConfig.growthTime * 1000); 

  return {
    slotId,
    cropName,
    rarity: rarityConfig.type,
    plantedAt: now,
    harvestAt: harvestTime,
    isReady: false
  };
};

// --- LOGIC: MEMANEN (Harvest + Auto Replant) ---
export const processHarvest = async (userId, slotId) => {
  const userRef = getUserRef(userId);
  
  // Transaksi Database (Atomic)
  return await userRef.firestore.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    if (!doc.exists) throw new Error("User not found");
    
    const userData = doc.data();
    
    // 1. Validasi Slot (Apakah ada tanaman?)
    const slotData = userData.farm?.[slotId];
    if (!slotData) throw new Error("Slot kosong. Tanam dulu (Tutorial).");

    // 2. Validasi Waktu Panen
    if (Date.now() < slotData.harvestAt) {
      const timeLeft = Math.ceil((slotData.harvestAt - Date.now()) / 1000);
      throw new Error(`Belum matang. Tunggu ${timeLeft} detik lagi.`);
    }

    // 3. Validasi Gudang Penuh (Kecuali Owner)
    // Hitung total item yang dimiliki user saat ini
    const currentInventory = userData.inventory || {};
    const totalItems = Object.values(currentInventory).reduce((a, b) => a + b, 0);
    const maxStorage = userData.storageLimit || 50;
    
    if (totalItems >= maxStorage && userData.plan !== 'OWNER') {
      throw new Error("Gudang Penuh! Jual panen dulu.");
    }

    // 4. Hitung Hasil Panen (Yield)
    const yieldAmount = 1; // Nanti bisa ditambah logic Yield Booster [cite: 35]
    
    // 5. Update Inventory User
    const currentItemQty = currentInventory[slotData.cropName] || 0;
    const newInventory = {
      ...currentInventory,
      [slotData.cropName]: currentItemQty + yieldAmount
    };
    
    // 6. AUTO REPLANT SYSTEM 
    // Langsung tanam benih baru di slot yang sama
    const newCrop = plantSeed(slotId);

    // Update ke Firebase
    t.update(userRef, {
      inventory: newInventory,
      [`farm.${slotId}`]: newCrop, // Slot langsung terisi lagi
      // Opsional: Tambah XP atau stats di sini
    });

    return {
      harvested: { 
        name: slotData.cropName, 
        amount: yieldAmount, 
        rarity: slotData.rarity 
      },
      replanted: newCrop // Data tanaman baru untuk update UI Frontend
    };
  });
};