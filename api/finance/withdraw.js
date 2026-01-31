import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef, db } from '../_utils/firebase.js';
import { GAME_CONFIG } from '../../src/config/gameConstants.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    // Frontend sends this data
    const { userId, amount, address, method, currency } = req.body;

    // Convert string to number
    const withdrawAmount = parseInt(amount);

    // 0. GET FAUCETPAY KEY FROM SERVER (ENV)
    // Must be set in Vercel: FAUCETPAY_API_KEY
    const FP_API_KEY = process.env.FAUCETPAY_API_KEY;

    if (!withdrawAmount || withdrawAmount <= 0) return sendError(res, 400, "Invalid amount.");
    if (!address) return sendError(res, 400, "Wallet address is required.");

    // ============================================================
    // 🛡️ SECURITY 1: WALLET LOCK
    // Check if this wallet is already used by another account
    // ============================================================
    if (method === 'FAUCETPAY') {
      const duplicateCheck = await db.collection('users')
        .where('linkedWallet', '==', address)
        .get();

      if (!duplicateCheck.empty) {
        const owner = duplicateCheck.docs[0].data();
        // If wallet exists in DB, but not owned by this user -> REJECT
        if (String(owner.id) !== String(userId)) {
          throw new Error("⛔ REJECTED: This wallet is already linked to another Telegram account!");
        }
      }
    }

    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // 1. CHECK BALANCE
      if ((userData.balance || 0) < withdrawAmount) {
        throw new Error("Insufficient point balance.");
      }

      // 2. CHECK MINIMUM LIMIT (Config)
      const isBound = !!userData.linkedWallet; // Is old user?
      const minLimit = isBound ? GAME_CONFIG.WITHDRAW.MIN_WD_MEMBER : GAME_CONFIG.WITHDRAW.MIN_WD_NEW;

      if (withdrawAmount < minLimit) {
        throw new Error(`Minimum WD: ${minLimit} PTS`);
      }

      // 3. CALCULATE EXCHANGE RATE & FEE
      // Fee FaucetPay = 0%, Direct = 10%
      const feePct = method === 'FAUCETPAY' ? GAME_CONFIG.WITHDRAW.FEE_FAUCETPAY : GAME_CONFIG.WITHDRAW.FEE_DIRECT;
      const feeAmount = Math.floor(withdrawAmount * feePct);
      const netPts = withdrawAmount - feeAmount;

      // Convert PTS -> USD
      // Using WD.RATE as defined in config
      const usdAmount = netPts * GAME_CONFIG.WITHDRAW.RATE;

      // Variables for Log
      let txId = null;
      let status = 'PENDING';
      let apiNote = '';

      // ============================================================
      // 🚀 EXECUTE TRANSFER (FAUCETPAY API)
      // ============================================================
      if (method === 'FAUCETPAY') {
        if (!FP_API_KEY) throw new Error("Server Error: FaucetPay API Key not set.");

        // Prepare Data for FaucetPay
        const params = new URLSearchParams();
        params.append('api_key', FP_API_KEY);
        params.append('amount', usdAmount.toFixed(8)); // Send in USD/USDT
        params.append('to', address);
        params.append('currency', 'USDT'); // We use USDT (TRC20/BEP20) for stability

        console.log(`[WD] Sending $${usdAmount} USDT to ${address}...`);

        // --- CALL FAUCETPAY ---
        const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
          method: 'POST',
          body: params
        });
        const fpResult = await fpResponse.json();

        // Check Result
        if (fpResult.status === 200) {
          // SUCCESS
          status = 'SUCCESS';
          txId = fpResult.payout_id;
          apiNote = 'Auto-Transfer Success';
        } else {
          // FAILED (e.g., admin balance empty)
          throw new Error(`FaucetPay Error: ${fpResult.message}`);
        }
      }
      else {
        // DIRECT (Manual Transfer)
        status = 'PENDING'; // Waiting for Admin
        apiNote = 'Manual Transfer Request';
      }

      // 4. UPDATE DATABASE
      const updates = {
        balance: (userData.balance || 0) - withdrawAmount,
        totalWithdraw: (userData.totalWithdraw || 0) + usdAmount
      };

      // Lock Wallet to this User (Future Security)
      if (method === 'FAUCETPAY' && !userData.linkedWallet) {
        updates.linkedWallet = address;
      }

      // 5. SAVE HISTORY (LOG)
      const logData = {
        type: 'WITHDRAW',
        status: status,
        method: method,
        amount: -withdrawAmount, // Points reduced
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

    return sendSuccess(res, result, method === 'FAUCETPAY' ? "Withdrawal Successfully Sent!" : "Request Successful, Waiting for Admin.");

  } catch (error) {
    console.error("[WD ERROR]", error);
    return sendError(res, 400, error.message);
  }
}
