/**
 * In-memory JWT token blacklist.
 * Tokens are stored with their expiry so the Map never grows unbounded.
 * On server restart the blacklist is cleared — acceptable for this scale
 * since tokens expire in 90d and restarts are rare.
 */

// token → expiry timestamp in ms
const blacklist = new Map<string, number>();

export const addToBlacklist = (token: string, expiresAtMs: number): void => {
    blacklist.set(token, expiresAtMs);
};

export const isBlacklisted = (token: string): boolean => {
    const exp = blacklist.get(token);
    if (exp === undefined) return false;
    // If the token has already expired naturally, remove it and treat as not blacklisted
    if (Date.now() > exp) {
        blacklist.delete(token);
        return false;
    }
    return true;
};

// Purge expired entries every hour to keep memory footprint minimal
setInterval(
    () => {
        const now = Date.now();
        for (const [token, exp] of blacklist.entries()) {
            if (now > exp) blacklist.delete(token);
        }
    },
    60 * 60 * 1000
).unref(); // unref() so this timer doesn't keep the process alive in tests
