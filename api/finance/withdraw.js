import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef, firestore } from '../_utils/firebase.js'; // Pastikan import firestore ada
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

      // --- 1. CEK SALDO ---
      if ((userData.balance || 0) < withdrawAmount) {
        throw new Error("Saldo tidak cukup.");
      }

      // --- 2. CEK STATUS USER (LIMIT WITHDRAW) ---
      // Jika email sudah terikat, berarti user lama (Min 1000)
      // Jika belum terikat, berarti user baru (Min 100)
      const isBound = !!userData.lockedFaucetPayEmail;
      const minLimit = isBound ? 1000 : 100;

      if (withdrawAmount < minLimit) {
        throw new Error(`Minimal WD: ${minLimit} PTS (${isBound ? 'Member' : 'New User'})`);
      }

      // --- 3. LOGIKA METODE & FEE ---
      let feePct = 0;
      
      if (method === 'FAUCETPAY') {
        feePct = 0; // Fee 0% untuk FP

        // A. CEK EKSISTENSI EMAIL DI USER LAIN (ANTI TUYUL)
        // Query ini harus dijalankan di luar transaksi jika index belum siap, 
        // tapi untuk keamanan kita asumsikan unik.
        // (Di production, field lockedFaucetPayEmail harus di-index unique)
        
        // B. LOGIKA BINDING
        if (isBound) {
          // Jika sudah terkunci, WAJIB sama
          if (userData.lockedFaucetPayEmail !== address) {
            throw new Error(`Akun terkunci ke email: ${userData.lockedFaucetPayEmail}. Tidak bisa ganti.`);
          }
        } else {
           // Jika User Baru, Validasi apakah email ini sudah dipakai orang lain?
           // Note: Query dalam transaction firestore butuh setup khusus, 
           // untuk simpel kita lock saat write.
           // Kita tandai user ini akan di-lock emailnya setelah sukses.
        }
      } 
      else if (method === 'DIRECT') {
        feePct = 0.10; // Fee 10% untuk Direct
      }

      // --- 4. HITUNG FINAL ---
      const feeAmount = Math.floor(withdrawAmount * feePct);
      const netAmount = withdrawAmount - feeAmount;

      // --- 5. EKSEKUSI API FAUCETPAY (SIMULASI) ---
      // Di sini Anda harusnya memanggil API FaucetPay beneran.
      // Jika API FaucetPay gagal, throw Error agar saldo tidak terpotong.
      // const fpResult = await callFaucetPayAPI(...) 
      // if (!fpResult.success) throw new Error("FaucetPay Error: " + fpResult.message);

      // --- 6. UPDATE DATA ---
      const updates = {
        balance: (userData.balance || 0) - withdrawAmount,
      };

      // Jika User Baru sukses WD FaucetPay -> KUNCI EMAIL
      if (method === 'FAUCETPAY' && !isBound) {
        updates.lockedFaucetPayEmail = address;
      }

      // Log History
      const logData = {
        type: 'WITHDRAW',
        amount: -withdrawAmount, // Negatif karena keluar
        desc: `WD ${currency} via ${method}`,
        detail: `Net: ${netAmount} PTS -> ${address}`,
        date: Date.now()
      };
      
      const currentHistory = userData.history || [];
      const newHistory = [logData, ...currentHistory].slice(0, 50);
      updates.history = newHistory;

      t.update(userRef, updates);
    });

    return sendSuccess(res, { amount: withdrawAmount, method }, "Withdraw Sukses! Cek Wallet Anda.");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}