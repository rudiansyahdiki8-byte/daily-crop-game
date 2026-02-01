import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';

export default async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { userId, uplineId } = req.body;

    // Check Self-Invite
    if (String(userId) === String(uplineId)) throw new Error("Self-invite not allowed.");

    const userRef = getUserRef(userId);
    const uplineRef = getUserRef(uplineId);

    await userRef.firestore.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const uplineDoc = await t.get(uplineRef);

      if (!uplineDoc.exists) throw new Error("Upline not found.");
      if (!userDoc.exists) throw new Error("User not found.");

      const userData = userDoc.data();
      const uplineData = uplineDoc.data();

      // Check if already has upline
      if (userData.uplineId) throw new Error("Already bound.");

      // 1. Update User (Downline)
      t.update(userRef, { uplineId: uplineId });

      // 2. Update Upline (Inviter)
      const currentFriendsCount = uplineData.friendsCount || 0;

      const newReferralData = {
        username: userData.username || 'Farmer',
        totalBonusGiven: 0,
        joinDate: Date.now()
      };

      // [CRITICAL FIX] Check if 'referrals' container exists?
      // If not exists (old user), use SET with MERGE to create the field.
      if (!uplineData.referrals) {
        t.set(uplineRef, {
          friendsCount: currentFriendsCount + 1,
          referrals: {
            [userId]: newReferralData
          }
        }, { merge: true });
      } else {
        // If exists, use normal UPDATE
        t.update(uplineRef, {
          friendsCount: currentFriendsCount + 1,
          [`referrals.${userId}`]: newReferralData
        });
      }
    });

    return sendSuccess(res, { uplineId }, "Bind Success");

  } catch (error) {
    // Silent Error to avoid disrupting user game flow
    console.log("Bind Skipped:", error.message);
    return sendError(res, 400, error.message);
  }
}
