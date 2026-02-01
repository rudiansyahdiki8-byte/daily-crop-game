import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData, calculateYield } from '../_services/farmService.js';
import { isStorageFull } from '../_services/inventoryService.js';

// =============================================================================
// CONSOLIDATED FARM API - Handles: start, harvest, harvest-all
// =============================================================================

// --- START: Plant a crop in empty slot ---
async function handleStart(req, res) {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new Error("User not found");
        const userData = doc.data();

        // 1. Validate Slot Ownership
        const slotNum = parseInt(slotId.replace('slot', ''));
        if (!userData.slots || !userData.slots.includes(slotNum)) {
            throw new Error("Slot not available! Upgrade your plan.");
        }

        // 2. Validate Slot is Empty
        if (userData.farm?.[slotId]) throw new Error("Slot is occupied!");

        // 3. Validate Storage (Predictive Check)
        const inventory = userData.inventory || {};
        const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
        const limit = userData.storageLimit || 50;

        if (isStorageFull(currentTotal, userData.plan, limit)) {
            throw new Error("Storage Full! Sell items first.");
        }

        // 4. Roll new crop with buffs
        const newCrop = rollCropData(userData.buffs || {});

        // 5. Update DB
        t.update(userRef, {
            [`farm.${slotId}`]: newCrop
        });

        return { slotId, ...newCrop };
    });

    return sendSuccess(res, result, "Farming Started!");
}

// --- HARVEST: Harvest single slot and auto-replant ---
async function handleHarvest(req, res) {
    const { userId, slotId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new Error("User not found");
        const userData = doc.data();

        // 1. Validate Crop (Ready?)
        const slotData = userData.farm?.[slotId];
        if (!slotData) throw new Error("Slot is empty!");
        if (Date.now() < slotData.harvestAt) throw new Error("Crop not ready to harvest!");

        // 2. Validate Storage
        const inventory = userData.inventory || {};
        const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
        const limit = userData.storageLimit || 50;

        if (isStorageFull(currentTotal, userData.plan, limit)) {
            const storageStats = userData.storageStats || { maxReached: 0, timesFull: 0, upgradesPurchased: 0 };
            storageStats.timesFull = (storageStats.timesFull || 0) + 1;
            t.update(userRef, { storageStats });
            throw new Error("Storage Full! Sell items first.");
        }

        // 3. Calculate yield
        const { amount, isDouble } = calculateYield(userData.buffs || {});

        // 4. Auto-replant
        const nextCrop = rollCropData(userData.buffs || {});

        // 5. Update DB
        const cropName = slotData.cropName;
        const newQty = (inventory[cropName] || 0) + amount;

        const cropStats = userData.cropStats || {
            totalHarvests: 0,
            byRarity: { COMMON: 0, UNCOMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 },
            totalEarnings: 0
        };
        cropStats.totalHarvests += 1;
        cropStats.byRarity[slotData.rarity] = (cropStats.byRarity[slotData.rarity] || 0) + 1;

        t.update(userRef, {
            [`inventory.${cropName}`]: newQty,
            [`farm.${slotId}`]: nextCrop,
            cropStats: cropStats
        });

        return { harvested: cropName, amount, isDouble, nextCrop };
    });

    return sendSuccess(res, result, `Harvested ${result.amount}x ${result.harvested}!`);
}

// --- HARVEST-ALL: Harvest all ready crops at once ---
async function handleHarvestAll(req, res) {
    const { userId } = req.body;
    const userRef = getUserRef(userId);

    const result = await userRef.firestore.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new Error("User not found");
        const userData = doc.data();

        const farm = userData.farm || {};
        const readySlots = [];
        const now = Date.now();

        // 1. Find all ready crops
        Object.keys(farm).forEach(slotId => {
            const slotData = farm[slotId];
            if (slotData && now >= slotData.harvestAt) {
                readySlots.push({ slotId, cropName: slotData.cropName });
            }
        });

        if (readySlots.length === 0) {
            throw new Error("No crops ready to harvest!");
        }

        // 2. Validate Storage
        const inventory = userData.inventory || {};
        const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
        const limit = userData.storageLimit || 50;
        const maxNewItems = readySlots.length * 2;

        if (userData.plan !== 'OWNER' && (currentTotal + maxNewItems) > limit) {
            throw new Error("Storage will be full! Sell items first.");
        }

        // 3. Harvest all ready crops
        const harvested = [];
        const newInventory = { ...inventory };
        const newFarm = { ...farm };

        for (const slot of readySlots) {
            const { amount, isDouble } = calculateYield(userData.buffs || {});
            const nextCrop = rollCropData(userData.buffs || {});

            newInventory[slot.cropName] = (newInventory[slot.cropName] || 0) + amount;
            newFarm[slot.slotId] = nextCrop;

            harvested.push({
                slotId: slot.slotId,
                cropName: slot.cropName,
                amount,
                isDouble
            });
        }

        // 4. Update database
        t.update(userRef, {
            inventory: newInventory,
            farm: newFarm
        });

        return {
            harvested,
            totalCrops: readySlots.length,
            totalItems: harvested.reduce((sum, h) => sum + h.amount, 0)
        };
    });

    return sendSuccess(res, result, `Harvested ${result.totalCrops} crops (${result.totalItems} items)!`);
}

// =============================================================================
// MAIN ROUTER
// =============================================================================
export default async function handler(req, res) {
    if (!allowMethod(req, res, 'POST')) return;

    try {
        // Extract action from URL: /api/farm/start -> ['start']
        const { action } = req.query;
        const actionName = Array.isArray(action) ? action[0] : action;

        switch (actionName) {
            case 'start':
                return await handleStart(req, res);
            case 'harvest':
                return await handleHarvest(req, res);
            case 'harvest-all':
                return await handleHarvestAll(req, res);
            default:
                return sendError(res, 404, `Unknown farm action: ${actionName}`);
        }
    } catch (error) {
        return sendError(res, 400, error.message);
    }
}
