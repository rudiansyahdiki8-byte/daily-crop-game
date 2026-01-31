import { PLANS, EXTRA_SLOT_PRICE } from '../config/gameConstants';

/**
 * Validates and determines the status of a specific farm slot.
 * @param {number} slotNum - The slot number to check
 * @param {object} user - The user object containing slots, plan, etc.
 * @returns {string} - 'ACTIVE', 'LOCKED_SHOP', or 'DISABLED'
 */
export const getSlotStatus = (slotNum, user) => {
    if (!user) return 'DISABLED';

    const userSlots = user.slots || [1];

    // Priority 1: Already Active
    if (userSlots.includes(slotNum)) return 'ACTIVE';

    // Priority 2: Check Layout Limits based on Plan
    const currentPlan = PLANS[user.plan || 'FREE'] || PLANS.FREE;
    const baseLimit = currentPlan.plots;
    const extraBought = user.extraSlotsPurchased || 0;

    // Priority 3: Shop Logic (Next available slot)
    const nextShopSlot = baseLimit + extraBought + 1;

    // Logic: If this slot is the immediate next one available for purchase, AND user hasn't maxed out extra slots
    // Note: Max extra slots is hardcoded as 2 in original logic
    if (slotNum === nextShopSlot && extraBought < 2) {
        return 'LOCKED_SHOP';
    }

    // Default: Locked by Plan
    return 'DISABLED';
};
