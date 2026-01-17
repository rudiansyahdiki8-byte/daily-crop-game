// api/buy.js
const { db, verifyUser } = require('../lib/firebase');
const { GameConfig } = require('../lib/game-config');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method error' });

    const { userId, itemId } = req.body;
    if (!userId || !itemId) return res.status(400).json({ message: 'Data missing' });

    try {
        const { ref, data } = await verifyUser(userId);

        // 1. Cari Item di Config Server (Agar harga tidak bisa dimanipulasi)
        // Kita cari manual di object ShopItems
        let item = null;
        for (const key in GameConfig.ShopItems) {
            // Mapping ID dari frontend ke Config
            // Frontend kirim 'land_2', Config punya 'LandPrice_2'
            // Kita cocokkan logic harganya
            if (itemId === 'land_2' && key === 'LandPrice_2') item = { type: 'land', price: GameConfig.ShopItems[key] };
            if (itemId === 'land_3' && key === 'LandPrice_3') item = { type: 'land', price: GameConfig.ShopItems[key] };
            if (itemId === 'storage_plus' && key === 'StoragePlus') item = { type: 'storage', price: GameConfig.ShopItems[key] };
            
            // Untuk Buffs (speed_soil -> BuffSpeed)
            if (itemId === 'speed_soil' && key === 'BuffSpeed') item = { type: 'buff', price: GameConfig.ShopItems[key], buffKey: 'speed_soil' };
            if (itemId === 'growth_fert' && key === 'BuffGrowth') item = { type: 'buff', price: GameConfig.ShopItems[key], buffKey: 'growth_speed' };
            if (itemId === 'trade_permit' && key === 'BuffTrade') item = { type: 'buff', price: GameConfig.ShopItems[key], buffKey: 'sell_bonus' };
            if (itemId === 'yield_boost' && key === 'BuffYield') item = { type: 'buff', price: GameConfig.ShopItems[key], buffKey: 'yield_bonus' };
            if (itemId === 'rare_boost' && key === 'BuffRare') item = { type: 'buff', price: GameConfig.ShopItems[key], buffKey: 'rare_luck' };
        }

        if (!item) return res.status(400).json({ success: false, message: 'Item tidak ditemukan di Config Server' });

        // 2. Cek Saldo User (Server Side Check)
        if ((data.user.coins || 0) < item.price) {
            return res.status(400).json({ success: false, message: 'Saldo tidak cukup!' });
        }

        // 3. Siapkan Update Data
        const updates = {
            "user.coins": FieldValue.increment(-item.price), // Kurangi Koin
            "user.totalSpent": FieldValue.increment(item.price) // Catat Pengeluaran
        };

        // 4. Berikan Item
        if (item.type === 'land') {
            updates["user.landPurchasedCount"] = FieldValue.increment(1);
        } 
        else if (item.type === 'storage') {
            updates["user.extraStorage"] = FieldValue.increment(20);
        }
        else if (item.type === 'buff') {
            // Set waktu aktif buff (24 jam dari sekarang)
            updates[`user.activeBuffs.${item.buffKey}`] = Date.now() + 86400000;
        }

        // 5. Eksekusi ke Database
        await ref.update(updates);

        return res.status(200).json({ success: true, message: 'Pembelian Berhasil' });

    } catch (error) {
        console.error("Buy Error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};