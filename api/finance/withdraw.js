import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
// Import Config agar sinkron
import { GAME_CONFIG } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, amount, address, method, currency } = req.body; 
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

      // 2. CEK LIMIT (Ambil dari Config)
      // Jika email terkunci (Member Lama) vs User Baru
      const isBound = !!userData.lockedFaucetPayEmail;
      const minLimit = isBound ? GAME_CONFIG.WITHDRAW.MIN_WD_MEMBER : GAME_CONFIG.WITHDRAW.MIN_WD_NEW;

      if (withdrawAmount < minLimit) {
        throw new Error(`Minimal WD: ${minLimit} PTS (${isBound ? 'Member' : 'New User'})`);
      }

      // 3. LOGIKA FEE & STATUS
      let feePct = 0;
      let status = 'PENDING'; // Default Aman

      if (method === 'FAUCETPAY') {
        feePct = GAME_CONFIG.WITHDRAW.FEE_FAUCETPAY; // 0%
        
        // Validasi Kunci Email
        if (isBound && userData.lockedFaucetPayEmail !== address) {
            throw new Error(`Akun ini terkunci ke email: ${userData.lockedFaucetPayEmail}`);
        }

        // NOTE UNTUK ADMIN:
        // Di sini nanti tempat pasang API FaucetPay.
        // Jika API sukses -> set status = 'SUCCESS'
        // Karena sekarang belum ada API, kita set 'PENDING' agar Admin bayar manual.
      } 
      else if (method === 'DIRECT') {
        feePct = GAME_CONFIG.WITHDRAW.FEE_DIRECT; // 10%
        status = 'PENDING'; // Direct selalu Pending (Max 48 Jam)
      }

      // 4. HITUNG NET (Bersih diterima user)
      const feeAmount = Math.floor(withdrawAmount * feePct);
      const netAmount = withdrawAmount - feeAmount;
      const usdEstimate = (netAmount * GAME_CONFIG.WITHDRAW.RATE).toFixed(4);

      // 5. UPDATE DATA
      const updates = {
        balance: (userData.balance || 0) - withdrawAmount,
      };

      // Kunci email jika ini WD FaucetPay pertama user
      if (method === 'FAUCETPAY' && !isBound) {
        updates.lockedFaucetPayEmail = address;
      }

      // Log History (Simpan Status PENDING)
      const logData = {
        type: 'WITHDRAW',
        status: status, // PENDING or SUCCESS
        amount: -withdrawAmount,
        fee: feeAmount,
        net: netAmount,
        currency: currency || 'USD',
        method: method,
        desc: `WD ${method} (${status})`,
        detail: `${netAmount} PTS -> ${address} (~$${usdEstimate})`,
        date: Date.now()
      };
      
      const currentHistory = userData.history || [];
      // Simpan di history user (atau bisa juga buat collection terpisah 'withdrawals' untuk Admin Panel)
      const newHistory = [logData, ...currentHistory].slice(0, 50);
      updates.history = newHistory;

      t.update(userRef, updates);
    });

    return sendSuccess(res, { amount: withdrawAmount, method, status: 'PENDING' }, "Request Terkirim! Menunggu Konfirmasi Admin.");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}