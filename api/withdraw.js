import { db } from '../_utils/firebase.js';
import { verifyTelegramWebAppData } from '../_utils/auth.js';
import admin from 'firebase-admin';

// SERVER CONFIGURATION
const RULES = {
    RateUSDT: 0.00001,
    MinFpNew: 100,      // New User
    MinFpOld: 2500,     // Loyal User
    MinDirectUSD: 5.0,  // Direct Limit ($5)
    DirectFee: 0.10     // Fee 10%
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, address, amount, currency, method } = req.body;
    const API_KEY = process.env.FAUCETPAY_API_KEY;

    // 1. Check Server API Key
    if (!API_KEY && method === 'faucetpay') {
        return res.status(500).json({ error: 'Server Config Error: Missing API Key' });
    }

    // 2. Verify User
    const user = verifyTelegramWebAppData(initData);
    if (!user) return res.status(403).json({ error: 'Unauthorized' });

    const userId = "TG-" + user.id;
    const userRef = db.collection('users').doc(userId);
    const withdrawRef = db.collection('withdrawals').doc(); 

    let executionData = null;

    try {
        // --- STEP 1: VALIDATION & BALANCE DEDUCTION (DATABASE) ---
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");

            const userData = doc.data();
            const currentBalance = userData.user.coins || 0;
            const hasHistory = userData.user.has_withdrawn || false;
            const savedAddress = userData.user.wallet_address;

            // A. CHECK LOCK ADDRESS (Anti-Cheat)
            if (method === 'faucetpay') {
                if (savedAddress && savedAddress !== address) {
                    throw new Error(`LOCKED! You must use your registered email: ${savedAddress}`);
                }
            }

            // B. CHECK LIMITS & FEES
            let minLimit = 0;
            let feePTS = 0;

            if (method === 'faucetpay') {
                minLimit = hasHistory ? RULES.MinFpOld : RULES.MinFpNew;
                feePTS = 0; // Free for FaucetPay
            } else {
                // Direct
                minLimit = Math.ceil(RULES.MinDirectUSD / RULES.RateUSDT);
                feePTS = Math.floor(amount * RULES.DirectFee);
            }

            if (amount < minLimit) {
                throw new Error(`Minimum withdrawal amount is ${minLimit.toLocaleString()} PTS`);
            }
            if (currentBalance < amount) {
                throw new Error("Insufficient server balance.");
            }

            // C. UPDATE DATABASE (Deduct Balance)
            const updatePayload = {
                "user.coins": admin.firestore.FieldValue.increment(-amount),
                "user.has_withdrawn": true, 
                "user.last_active": Date.now()
            };

            // Lock address if this is the first successful FaucetPay attempt
            if (!savedAddress && method === 'faucetpay') {
                updatePayload["user.wallet_address"] = address;
            }

            t.update(userRef, updatePayload);

            // Save Transaction Record
            executionData = {
                userId: userId,
                username: user.username || "Unknown",
                amount_gross: amount,
                amount_net: amount - feePTS, 
                currency: currency || "USDT",
                address: address,
                method: method,
                status: (method === 'faucetpay') ? 'PROCESSING' : 'PENDING',
                createdAt: admin.firestore.Timestamp.now(),
                payout_id: null
            };
            
            t.set(withdrawRef, executionData);
        });

        // --- STEP 2: EXECUTE TRANSFER (FAUCETPAY ONLY) ---
        
        // IF DIRECT: Finish here (Pending Manual Approval)
        if (method !== 'faucetpay') {
            return res.json({ 
                success: true, 
                message: "Direct withdrawal submitted. Waiting for Admin approval." 
            });
        }

        // IF FAUCETPAY: Instant Transfer
        try {
            // Calculate Crypto Amount (PTS -> USDT)
            const usdtAmount = (executionData.amount_net * RULES.RateUSDT).toFixed(8);

            const params = new URLSearchParams();
            params.append('api_key', API_KEY);
            params.append('amount', usdtAmount); 
            params.append('to', address);
            params.append('currency', currency || "USDT"); 
            params.append('referral', 'false');

            const response = await fetch('https://faucetpay.io/api/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const fpData = await response.json();

            if (fpData.status === 200) {
                // --- SUCCESS ---
                await withdrawRef.update({
                    status: 'COMPLETED',
                    payout_id: fpData.payout_id,
                    completedAt: admin.firestore.Timestamp.now()
                });

                return res.json({ 
                    success: true, 
                    message: `Instant Payment Sent! ID: ${fpData.payout_id}` 
                });

            } else {
                // --- FAILED FROM FAUCETPAY ---
                throw new Error(fpData.message || "FaucetPay Gateway Error");
            }

        } catch (fpError) {
            // --- STEP 3: AUTO-REFUND (SAFETY NET) ---
            console.error("FaucetPay Failed, Refunding User...", fpError);

            // 1. Refund User Balance
            await userRef.update({
                "user.coins": admin.firestore.FieldValue.increment(amount)
            });

            // 2. Mark Transaction as Failed
            await withdrawRef.update({
                status: 'FAILED',
                error_reason: fpError.message
            });

            // 3. Return Error to Frontend (English)
            return res.status(400).json({ 
                success: false, 
                message: `Transfer Failed: ${fpError.message}. Your balance has been fully refunded.` 
            });
        }

    } catch (error) {
        console.error("System Error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}
