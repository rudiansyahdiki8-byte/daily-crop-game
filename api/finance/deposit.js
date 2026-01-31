import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, amount, txHash, method } = req.body; 

    // Validasi Dasar
    if (!amount || amount <= 0) throw new Error("Jumlah deposit tidak valid.");
    if (!txHash || txHash.length < 5) throw new Error("Bukti TxID wajib diisi dengan benar.");

    const userRef = getUserRef(userId);

    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // Buat Log Request
      const logData = {
        id: `DEP-${Date.now()}`,
        type: 'DEPOSIT_REQUEST',
        status: 'PENDING', // Wajib Approval Admin
        amount: parseInt(amount),
        method: method || 'USDT',
        txHash: txHash,
        desc: `Request Deposit ${parseInt(amount).toLocaleString()} PTS`,
        detail: `Via ${method || 'USDT'} | TxID: ${txHash}`,
        date: Date.now()
      };

      // Simpan di History User (Paling Atas)
      const currentHistory = userData.history || [];
      const newHistory = [logData, ...currentHistory].slice(0, 50);

      t.update(userRef, {
        history: newHistory
        // PENTING: Saldo 'balance' JANGAN ditambah di sini.
        // Saldo ditambah manual oleh Admin via Database setelah cek mutasi.
      });
    });

    return sendSuccess(res, { status: 'PENDING', txHash }, "Permintaan Deposit Terkirim! Mohon tunggu konfirmasi Admin.");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}