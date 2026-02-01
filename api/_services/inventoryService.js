import { PLANS } from '../../src/config/gameConstants.js';

/**
 * Check if storage is full
 * @param {number} currentItemsCount - Current total items in inventory
 * @param {string} userPlanId - User's current plan
 * @param {number} storageLimit - User's storage limit (base + upgrades)
 * @returns {boolean} - True if storage is full
 */
export const isStorageFull = (currentItemsCount, userPlanId, storageLimit) => {
    // OWNER plan has unlimited storage
    if (userPlanId === 'OWNER') return false;

    // Use provided storageLimit directly (already includes base + upgrades)
    const maxCap = storageLimit || PLANS[userPlanId]?.storage || 50;

    return currentItemsCount >= maxCap;
};