import { PLANS } from '../../src/config/gameConstants.js';

// Cek apakah gudang penuh [cite: 53, 55]
export const isStorageFull = (currentItemsCount, userPlanId, extraSlots = 0) => {
    const baseCap = PLANS[userPlanId]?.storage || 50; 
    const maxCap = baseCap + extraSlots;
    
    // Jika user OWNER, storage unlimited [cite: 21]
    if (userPlanId === 'OWNER') return false;

    return currentItemsCount >= maxCap;
};