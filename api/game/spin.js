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
        const { initData, type } = req.body; // type: 'free' or 'paid'
        const tgUser = verifyTelegramWebAppData(initData);
        const userId = "TG-" + tgUser.id;

        const userRef = db.collection('users').doc(userId);

        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");
            const userData = doc.data();
            const now = Date.now();

            // 1. VALIDASI BIAYA / COOLDOWN
            if (type === 'free') {
                const lastSpin = userData.spin_free_cooldown || 0;
                if (now - lastSpin < GameConfig.Spin.CooldownFree) {
                    throw new Error("Cooldown active");
                }
            } else if (type === 'paid') {
                if ((userData.coins || 0) < GameConfig.Spin.CostPaid) {
                    throw new Error("Insufficient funds");
                }
            } else {
                throw new Error("Invalid spin type");
            }

            // 2. GACHA DI SERVER
            const prize = GameConfig.rollSpin();
            
            // Logic Hadiah Spesifik (Herb Rarity)
            let prizeDetail = { ...prize };
            if (prize.type === 'herb') {
                // Pilih tanaman acak berdasarkan rarity
                // (Sederhananya kita kirim rarity-nya, client mapping gambarnya, 
                // tapi logic inventory harus di server sini)
                
                // Cari key tanaman yang sesuai rarity di GameConfig.Crops
                const candidates = Object.keys(GameConfig.Crops).filter(k => 
                    (GameConfig.Crops[k].rarity || 'Common') === prize.rarity
                );
                const winKey = candidates[Math.floor(Math.random() * candidates.length)] || 'ginger';
                prizeDetail.key = winKey;
            }

            // 3. UPDATE DB
            let updates = {
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            };

            // Update Cooldown / Koin
            if (type === 'free') updates.spin_free_cooldown = now;
            if (type === 'paid') updates.coins = userData.coins - GameConfig.Spin.CostPaid;

            // Berikan Hadiah Langsung
            if (prizeDetail.type === 'coin' || prizeDetail.type === 'jackpot') {
                updates.coins = (updates.coins !== undefined ? updates.coins : userData.coins) + prizeDetail.val;
            } else if (prizeDetail.type === 'herb') {
                const wh = userData.warehouse || {};
                wh[prizeDetail.key] = (wh[prizeDetail.key] || 0) + 1;
                updates.warehouse = wh;
            }

            t.update(userRef, updates);
            
            return { prize: prizeDetail, newBalance: updates.coins };
        });

        return res.status(200).json({ success: true, data: result });

    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};