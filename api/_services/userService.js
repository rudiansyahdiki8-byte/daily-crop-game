import { getUserRef } from '../_utils/firebase.js';
import { PLANS } from '../../src/config/gameConstants.js'; // Shared Config

/**
 * Mencari user, jika tidak ada -> buat baru (Register)
 * Sesuai Dokumen:
 * -  Default Plan: FREE [cite: 18]
 * -  Slot 1: Otomatis terbuka [cite: 25]
 * - Mata Uang: 0 PTS
 */
export const findOrCreateUser = async (telegramUser, referralCode = null) => {
  const { id, first_name, username } = telegramUser;
  const userRef = getUserRef(id);
  
  const doc = await userRef.get();

  // A. Jika User Sudah Ada -> Return Data
  if (doc.exists) {
    // Update last login
    await userRef.update({ lastLogin: new Date().toISOString() });
    return { isNew: false, ...doc.data() };
  }

  // B. Jika User Baru -> Buat Data Default (Register)
  const newUserState = {
    userId: id,
    username: username || first_name,
    balance: 0,           // Start 0 PTS
     plan: 'FREE',         // Default Plan [cite: 18]
     storageLimit: PLANS.FREE.storage, // Base 50 [cite: 18]
     slots: [1],           // Slot 1 Open [cite: 25]
    inventory: {},        // Kosong
    
     // System Affiliate [cite: 74]
    uplineId: referralCode || null, 
    referralEarnings: 0,
    
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  await userRef.set(newUserState);
  return { isNew: true, ...newUserState };
};

/**
 * Mengambil data user untuk refresh state di frontend
 */
export const getUserData = async (userId) => {
  const doc = await getUserRef(userId).get();
  if (!doc.exists) throw new Error("User not found");
  return doc.data();
};