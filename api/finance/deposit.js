import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, amount, txHash, method } = req.body; // method: 'USDT', 'TRX', 'DANA'

    if (!amount || amount <= 0) throw new Error("Jumlah tidak valid");
    if (!txHash) throw new Error("Bukti Transaksi (TxID) wajib diisi");

    const userRef = getUserRef(userId);

    // Kita simpan di collection terpisah 'deposits' atau di history user
    // Untuk simpel, kita taruh di history user dulu dengan status PENDING
    
    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      const logData = {
        id: `DEP-${Date.now()}`,
        type: 'DEPOSIT_REQUEST',
        status: 'PENDING', // <--- PENTING: Perlu Approval Admin
        amount: parseInt(amount),
        method: method || 'USDT',
        txHash: txHash,
        desc: `Req Deposit ${amount} via ${method}`,
        date: Date.now()
      };

      // Masukkan ke history paling atas
      const newHistory = [logData, ...(userData.history || [])].slice(0, 50);

      t.update(userRef, {
        history: newHistory
        // Saldo JANGAN ditambah dulu! Nunggu admin approve.
      });
    });

    return sendSuccess(res, { status: 'PENDING' }, "Deposit diproses! Tunggu konfirmasi Admin.");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}