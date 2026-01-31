import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef, db } from '../_utils/firebase.js'; 
import { GAME_CONFIG } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    // Frontend mengirim data ini
    const { userId, amount, address, method, currency } = req.body; 
    
    // Konversi string ke angka
    const withdrawAmount = parseInt(amount);

    // 0. AMBIL KUNCI FAUCETPAY DARI SERVER (ENV)
    // Wajib disetting di Vercel: FAUCETPAY_API_KEY
    const FP_API_KEY = process.env.FAUCETPAY_API_KEY; 
    
    if (!withdrawAmount || withdrawAmount <= 0) return sendError(res, 400, "Jumlah tidak valid.");
    if (!address) return sendError(res, 400, "Alamat wallet wajib diisi.");

    // ============================================================
    // 🛡️ SECURITY 1: ANTI-TUYUL (LOCK WALLET)
    // Cek apakah wallet ini sudah dipakai akun lain?
    // ============================================================
    if (method === 'FAUCETPAY') {
        const duplicateCheck = await db.collection('users')
          .where('linkedWallet', '==', address)
          .get();

        if (!duplicateCheck.empty) {
            const owner = duplicateCheck.docs[0].data();
            // Jika wallet sudah ada di DB, tapi bukan milik user ini -> TOLAK
            if (String(owner.id) !== String(userId)) {
                throw new Error("⛔ REJECTED: Wallet ini sudah terikat ke akun Telegram lain!");
            }
        }
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. CEK SALDO
      if ((userData.balance || 0) < withdrawAmount) {
        throw new Error("Saldo poin tidak cukup.");
      }

      // 2. CEK LIMIT MINIMUM (Config)
      const isBound = !!userData.linkedWallet; // Apakah user lama?
      const minLimit = isBound ? GAME_CONFIG.WITHDRAW.MIN_WD_MEMBER : GAME_CONFIG.WITHDRAW.MIN_WD_NEW;

      if (withdrawAmount < minLimit) {
        throw new Error(`Minimal WD: ${minLimit} PTS`);
      }

      // 3. HITUNG NILAI TUKAR & FEE
      // Fee FaucetPay = 0%, Direct = 10%
      const feePct = method === 'FAUCETPAY' ? GAME_CONFIG.WITHDRAW.FEE_FAUCETPAY : GAME_CONFIG.WITHDRAW.FEE_DIRECT;
      const feeAmount = Math.floor(withdrawAmount * feePct);
      const netPts = withdrawAmount - feeAmount;
      
      // Konversi PTS -> USD
      const usdAmount = netPts * GAME_CONFIG.WITHDRAW.RATE;

      // Variabel untuk Log
      let txId = null;
      let status = 'PENDING';
      let apiNote = '';

      // ============================================================
      // 🚀 EKSEKUSI TRANSFER (FAUCETPAY API)
      // ============================================================
      if (method === 'FAUCETPAY') {
          if (!FP_API_KEY) throw new Error("Server Error: API Key FaucetPay belum disetting.");

          // Siapkan Data ke FaucetPay
          const params = new URLSearchParams();
          params.append('api_key', FP_API_KEY);
          params.append('amount', usdAmount.toFixed(8)); // Kirim dalam USD/USDT
          params.append('to', address);
          params.append('currency', 'USDT'); // Kita pakai USDT (TRC20/BEP20) agar stabil

          console.log(`[WD] Sending $${usdAmount} USDT to ${address}...`);

          // --- PANGGIL FAUCETPAY ---
          const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
              method: 'POST',
              body: params
          });
          const fpResult = await fpResponse.json();

          // Cek Hasil
          if (fpResult.status === 200) {
              // SUKSES
              status = 'SUCCESS';
              txId = fpResult.payout_id;
              apiNote = 'Auto-Transfer Success';
          } else {
              // GAGAL (Misal saldo admin habis)
              throw new Error(`FaucetPay Error: ${fpResult.message}`);
          }
      } 
      else {
          // DIRECT (Manual Transfer)
          status = 'PENDING'; // Menunggu Admin
          apiNote = 'Manual Transfer Request';
      }

      // 4. UPDATE DATABASE
      const updates = {
        balance: (userData.balance || 0) - withdrawAmount,
        totalWithdraw: (userData.totalWithdraw || 0) + usdAmount
      };

      // Kunci Wallet ke User ini (Anti-Tuyul masa depan)
      if (method === 'FAUCETPAY' && !userData.linkedWallet) {
        updates.linkedWallet = address;
      }

      // 5. SIMPAN RIWAYAT (LOG)
      const logData = {
        type: 'WITHDRAW',
        status: status,
        method: method,
        amount: -withdrawAmount, // Poin berkurang
        money: usdAmount,
        currency: 'USDT',
        txId: txId || '-',
        wallet: address,
        desc: `WD ${method}`,
        date: Date.now()
      };
      
      const currentHistory = userData.history || [];
      const newHistory = [logData, ...currentHistory].slice(0, 50);
      updates.history = newHistory;

      t.update(userRef, updates);

      return { 
          amount: withdrawAmount, 
          usd: usdAmount, 
          status, 
          txId 
      };
    });

    return sendSuccess(res, result, method === 'FAUCETPAY' ? "Withdraw Berhasil Terkirim!" : "Request Berhasil, Menunggu Admin.");

  } catch (error) {
    console.error("[WD ERROR]", error);
    return sendError(res, 400, error.message);
  }
}
