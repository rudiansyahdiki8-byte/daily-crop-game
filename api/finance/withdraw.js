import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { GAME_CONFIG } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    // Tambah parameter 'method' ('FAUCETPAY' atau 'DIRECT')
    const { userId, amount, address, method } = req.body; 
    const withdrawAmount = parseInt(amount);

    if (!withdrawAmount || withdrawAmount <= 0) return sendError(res, 400, "Jumlah tidak valid.");
    if (!address) return sendError(res, 400, "Alamat/Email wajib diisi.");
    if (!['FAUCETPAY', 'DIRECT'].includes(method)) return sendError(res, 400, "Metode tidak valid.");

    const userRef = getUserRef(userId);

    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. CEK SALDO
      if ((userData.balance || 0) < withdrawAmount) {
        throw new Error("Saldo tidak cukup.");
      }

      // 2. CEK STATUS USER (BARU vs LAMA) UNTUK MINIMUM WD
      // User Baru = Belum pernah ada history WITHDRAW sukses
      const history = userData.history || [];
      const hasWithdrawnBefore = history.some(h => h.type === 'WITHDRAW');
      
      const minLimit = hasWithdrawnBefore 
        ? (GAME_CONFIG.WITHDRAW.MIN_EXISTING_USER || 1000) 
        : (GAME_CONFIG.WITHDRAW.MIN_NEW_USER || 100);

      if (withdrawAmount < minLimit) {
        throw new Error(`Minimal WD: ${minLimit} PTS (${hasWithdrawnBefore ? 'User Lama' : 'User Baru'})`);
      }

      // 3. LOGIKA METODE (FEE & LOCKING)
      let feePct = 0;
      
      if (method === 'FAUCETPAY') {
        // Aturan: Fee 0%
        feePct = 0;
        
        // Aturan: Email Terkunci
        if (userData.lockedFaucetPayEmail) {
          if (userData.lockedFaucetPayEmail !== address) {
            throw new Error(`Akun terkunci ke email: ${userData.lockedFaucetPayEmail}. Tidak bisa ganti.`);
          }
        } else {
          // Jika belum terkunci, kita akan kunci saat update nanti
          t.update(userRef, { lockedFaucetPayEmail: address });
        }
      } 
      else if (method === 'DIRECT') {
        // Aturan: Fee 5%
        feePct = GAME_CONFIG.WITHDRAW.FEE_DIRECT || 0.05;
      }

      // 4. HITUNG FINAL
      const feeAmount = Math.floor(withdrawAmount * feePct);
      const netAmount = withdrawAmount - feeAmount;

      // 5. UPDATE DATA
      const newBalance = userData.balance - withdrawAmount;
      
      // Log History
      const logData = {
        type: 'WITHDRAW',
        amount: -withdrawAmount,
        desc: `${method} (${feePct*100}% Fee) ke ${address}`,
        date: Date.now()
      };
      const newHistory = [logData, ...history].slice(0, 50);

      t.update(userRef, {
        balance: newBalance,
        history: newHistory
      });
    });

    return sendSuccess(res, { amount: withdrawAmount, method }, "Permintaan Withdraw Berhasil!");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}