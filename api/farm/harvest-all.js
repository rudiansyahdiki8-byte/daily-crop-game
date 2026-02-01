import { sendSuccess, sendError, allowMethod } from '../_utils/response.js';
import { getUserRef } from '../_utils/firebase.js';
import { rollCropData, calculateYield } from '../_services/farmService.js';
import { isStorageFull } from '../_services/inventoryService.js';

export default async function handler(req, res) {
    if (!allowMethod(req, res, 'POST')) return;

    try {
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

            // 2. Validate Storage (for all harvests)
            const inventory = userData.inventory || {};
            const currentTotal = Object.values(inventory).reduce((a, b) => a + b, 0);
            const limit = userData.storageLimit || 50;

            // Assume worst case: all crops give 2x yield
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

                // Update inventory
                newInventory[slot.cropName] = (newInventory[slot.cropName] || 0) + amount;

                // Auto-replant
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

    } catch (error) {
        return sendError(res, 400, error.message);
    }
}
