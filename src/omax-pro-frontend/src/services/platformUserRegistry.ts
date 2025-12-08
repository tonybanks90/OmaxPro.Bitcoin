/**
 * Platform User Registry
 * 
 * Tracks users who have authenticated on this platform.
 * This allows the booster to identify and filter platform-specific requests.
 */

const PLATFORM_USERS_KEY = 'ckboost_platform_users';

export interface PlatformUser {
    principalId: string;
    firstSeen: number;
    lastSeen: number;
}

/**
 * Get all registered platform users
 */
export function getPlatformUsers(): PlatformUser[] {
    try {
        const data = localStorage.getItem(PLATFORM_USERS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Get just the principal IDs of platform users
 */
export function getPlatformUserIds(): Set<string> {
    const users = getPlatformUsers();
    return new Set(users.map(u => u.principalId));
}

/**
 * Register a user as a platform user
 * Called when users authenticate via Internet Identity
 */
export function registerPlatformUser(principalId: string): void {
    if (!principalId || principalId === '2vxsx-fae') {
        // Don't register anonymous users
        return;
    }

    const users = getPlatformUsers();
    const now = Date.now();

    const existingIndex = users.findIndex(u => u.principalId === principalId);

    if (existingIndex >= 0) {
        // Update last seen
        users[existingIndex].lastSeen = now;
    } else {
        // Add new user
        users.push({
            principalId,
            firstSeen: now,
            lastSeen: now
        });
    }

    try {
        localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(users));
        console.log(`📝 Platform user registered: ${principalId.slice(0, 15)}...`);
    } catch (e) {
        console.warn('Failed to save platform user:', e);
    }
}

/**
 * Check if a principal is a platform user
 */
export function isPlatformUser(principalId: string): boolean {
    const users = getPlatformUserIds();
    return users.has(principalId);
}

/**
 * Get count of platform users
 */
export function getPlatformUserCount(): number {
    return getPlatformUsers().length;
}

/**
 * Clear all platform users (for testing)
 */
export function clearPlatformUsers(): void {
    localStorage.removeItem(PLATFORM_USERS_KEY);
}
