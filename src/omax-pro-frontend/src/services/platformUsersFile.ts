/**
 * Platform Users Storage - Shared between browser and Node.js
 * 
 * This file provides read/write access to platform users for both:
 * - Browser (via HTTP endpoint or importing directly)
 * - Node.js booster service (via file read)
 * 
 * Storage location: src/omax-pro-frontend/platform-users.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATFORM_USERS_FILE = path.resolve(__dirname, '../../platform-users.json');

export interface PlatformUserRecord {
    principalId: string;
    firstSeen: number;
    lastSeen: number;
}

/**
 * Load platform users from the JSON file
 * Used by the Node.js booster service
 */
export function loadPlatformUsers(): PlatformUserRecord[] {
    try {
        if (fs.existsSync(PLATFORM_USERS_FILE)) {
            const data = fs.readFileSync(PLATFORM_USERS_FILE, 'utf-8');
            return JSON.parse(data) as PlatformUserRecord[];
        }
    } catch (error) {
        console.warn('⚠️ Could not load platform users file:', error);
    }
    return [];
}

/**
 * Get the set of platform user principal IDs
 */
export function getPlatformUserPrincipals(): Set<string> {
    const users = loadPlatformUsers();
    return new Set(users.map(u => u.principalId));
}

/**
 * Save platform users to the JSON file
 */
export function savePlatformUsers(users: PlatformUserRecord[]): void {
    try {
        fs.writeFileSync(PLATFORM_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
        console.log(`📝 Saved ${users.length} platform users to file`);
    } catch (error) {
        console.warn('⚠️ Could not save platform users file:', error);
    }
}

/**
 * Register a new platform user (for use by API endpoint or admin)
 */
export function registerPlatformUserToFile(principalId: string): void {
    if (!principalId || principalId === '2vxsx-fae') {
        return; // Don't register anonymous users
    }

    const users = loadPlatformUsers();
    const now = Date.now();

    const existingIndex = users.findIndex(u => u.principalId === principalId);

    if (existingIndex >= 0) {
        users[existingIndex].lastSeen = now;
    } else {
        users.push({
            principalId,
            firstSeen: now,
            lastSeen: now
        });
    }

    savePlatformUsers(users);
}

/**
 * Check if a principal is a platform user
 */
export function isPlatformUserInFile(principalId: string): boolean {
    const principals = getPlatformUserPrincipals();
    return principals.has(principalId);
}
