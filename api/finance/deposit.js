import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, amount, txHash, method } = req.body;

    // Basic Validation
    if (!amount || amount <= 0) throw new Error("Invalid deposit amount.");
    if (!txHash || txHash.length < 5) throw new Error("TxID proof is required.");

    const userRef = getUserRef(userId);

    await userRef.firestore.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("User not found");
      const userData = doc.data();

      // Create Request Log
      const logData = {
        id: `DEP-${Date.now()}`,
        type: 'DEPOSIT_REQUEST',
        status: 'PENDING', // Requires Admin Approval
        amount: parseInt(amount),
        method: method || 'USDT',
        txHash: txHash,
        desc: `Request Deposit ${parseInt(amount).toLocaleString()} PTS`,
        detail: `Via ${method || 'USDT'} | TxID: ${txHash}`,
        date: Date.now()
      };

      // Save to User History (Top)
      const currentHistory = userData.history || [];
      const newHistory = [logData, ...currentHistory].slice(0, 50);

      t.update(userRef, {
        history: newHistory
        // IMPORTANT: 'balance' is NOT added here.
        // Balance is added manually by Admin via Database after checking mutation.
      });
    });

    return sendSuccess(res, { status: 'PENDING', txHash }, "Deposit Request Sent! Please wait for Admin confirmation.");

  } catch (error) {
    return sendError(res, 400, error.message);
  }
}