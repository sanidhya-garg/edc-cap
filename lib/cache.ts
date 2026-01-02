/**
 * Simple sessionStorage-based cache utility to reduce Firestore reads.
 * Data is cached per browser session and automatically expires.
 */

const CACHE_PREFIX = "edc_cap_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

/**
 * Get cached data if available and not expired
 */
export function getCached<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const cached = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);

        if (Date.now() > entry.expiry) {
            sessionStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Cache data with optional TTL (default 5 minutes)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
    if (typeof window === "undefined") return;

    try {
        const entry: CacheEntry<T> = {
            data,
            expiry: Date.now() + ttlMs,
        };
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Session storage might be full or disabled
        console.warn("Failed to cache data:", key);
    }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(key: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Invalidate all cache entries with the given prefix
 */
export function invalidateCacheByPrefix(prefix: string): void {
    if (typeof window === "undefined") return;

    const fullPrefix = CACHE_PREFIX + prefix;
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}
