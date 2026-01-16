// api/market/buy.js
const { db, admin } = require('../../lib/firebase');
const GameConfig = require('../../lib/gameRules');
const crypto = require('crypto');

// (Include verifyTelegramWebAppData function here)
function verifyTelegramWebAppData(telegramInitData) { /* Copy logic validasi */
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, val]) => `${key}=${val}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash !== hash) throw new Error("Invalid Hash");
    return JSON.parse(urlParams.get('user'));
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { initData, itemId } = req.body;
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;
        
        // Cek apakah Item Valid di Server
        const itemConfig = GameConfig.ShopItems[itemId];
        if (!itemConfig) throw new Error("Item not found or invalid");

        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");
            const userData = doc.data();

            // 1. Cek Saldo
            if ((userData.coins || 0) < itemConfig.price) {
                throw new Error("Insufficient funds");
            }

            // 2. Logic Per Tipe Item
            let updates = {
                coins: userData.coins - itemConfig.price,
                totalSpent: admin.firestore.FieldValue.increment(itemConfig.price)
            };

            if (itemConfig.type === 'land') {
                const purchased = userData.landPurchasedCount || 0;
                // Validasi Tier (Harus urut)
                if (itemConfig.tier === 1 && purchased >= 1) throw new Error("Already owned");
                if (itemConfig.tier === 2 && purchased < 1) throw new Error("Must buy previous land first");
                
                updates.landPurchasedCount = purchased + 1;
            } 
            else if (itemConfig.type === 'storage') {
                updates.extraStorage = admin.firestore.FieldValue.increment(itemConfig.amount);
            } 
            else if (itemConfig.type === 'buff') {
                // Update map activeBuffs
                const currentBuffs = userData.activeBuffs || {};
                const now = Date.now();
                // Set waktu kadaluarsa baru (Now + Duration)
                currentBuffs[itemConfig.buffKey] = now + itemConfig.duration;
                updates.activeBuffs = currentBuffs;
            }

            // 3. Eksekusi Update
            t.update(userRef, updates);
        });

        return res.status(200).json({ success: true, message: "Purchase successful" });

    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};