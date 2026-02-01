/**
 * Simple in-memory rate limiter for Vercel Serverless Functions
 * Note: This works per-instance. For distributed apps, use Redis.
 */

const rateLimits = new Map();

// Clean old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimits.entries()) {
        if (now - data.windowStart > 60000) {
            rateLimits.delete(key);
        }
    }
}, 300000);

/**
 * Check if user has exceeded rate limit
 * @param {string} userId - User identifier
 * @param {string} action - Action type (e.g., 'withdraw', 'spin')
 * @param {number} maxPerMinute - Max requests allowed per minute
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export const checkRateLimit = (userId, action, maxPerMinute = 30) => {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    let data = rateLimits.get(key);

    // New window or expired
    if (!data || now - data.windowStart > windowMs) {
        data = { count: 1, windowStart: now };
        rateLimits.set(key, data);
        return { allowed: true, remaining: maxPerMinute - 1, resetIn: windowMs };
    }

    // Within window
    if (data.count >= maxPerMinute) {
        const resetIn = windowMs - (now - data.windowStart);
        return { allowed: false, remaining: 0, resetIn };
    }

    // Increment
    data.count++;
    rateLimits.set(key, data);
    return {
        allowed: true,
        remaining: maxPerMinute - data.count,
        resetIn: windowMs - (now - data.windowStart)
    };
};

/**
 * Rate limit configuration per action
 */
export const RATE_LIMITS = {
    'login': 10,        // 10 per minute
    'withdraw': 3,      // 3 per minute (sensitive)
    'deposit': 5,       // 5 per minute
    'spin': 20,         // 20 per minute
    'task': 15,         // 15 per minute
    'sell': 30,         // 30 per minute
    'buy': 20,          // 20 per minute
    'farm': 60,         // 60 per minute (high frequency)
    'default': 30       // Default limit
};

/**
 * Validate wallet address format
 * @param {string} address - Wallet address
 * @param {string} currency - Currency type (USDT, BTC, etc.)
 * @returns {boolean}
 */
export const isValidWalletAddress = (address, currency = 'USDT') => {
    if (!address || typeof address !== 'string') return false;

    // TRC20/BEP20 addresses (USDT)
    if (currency === 'USDT') {
        // TRC20: starts with T, 34 chars
        const trc20Regex = /^T[A-Za-z1-9]{33}$/;
        // BEP20/ERC20: starts with 0x, 42 chars
        const erc20Regex = /^0x[a-fA-F0-9]{40}$/;
        return trc20Regex.test(address) || erc20Regex.test(address);
    }

    // FaucetPay email validation
    if (address.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(address);
    }

    // Generic: at least 20 characters alphanumeric
    return /^[a-zA-Z0-9]{20,}$/.test(address);
};

/**
 * Validate userId format
 * @param {string|number} userId 
 * @returns {boolean}
 */
export const isValidUserId = (userId) => {
    if (!userId) return false;
    const id = String(userId);
    // Telegram IDs are numeric, up to ~15 digits
    return /^\d{5,15}$/.test(id);
};
