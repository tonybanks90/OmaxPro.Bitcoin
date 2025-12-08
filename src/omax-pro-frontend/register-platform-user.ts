#!/usr/bin/env node
/**
 * Register Platform User CLI
 * 
 * Use this script to add a platform user to the registry.
 * The booster will only accept requests from registered platform users.
 * 
 * Usage:
 *   npx tsx register-platform-user.ts <principal-id>
 * 
 * Example:
 *   npx tsx register-platform-user.ts abc12-xyz34-...
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATFORM_USERS_FILE = path.resolve(__dirname, './platform-users.json');

interface PlatformUserRecord {
    principalId: string;
    firstSeen: number;
    lastSeen: number;
}

function loadPlatformUsers(): PlatformUserRecord[] {
    try {
        if (fs.existsSync(PLATFORM_USERS_FILE)) {
            const data = fs.readFileSync(PLATFORM_USERS_FILE, 'utf-8');
            return JSON.parse(data) as PlatformUserRecord[];
        }
    } catch (error) {
        console.warn('⚠️ Could not load platform users file');
    }
    return [];
}

function savePlatformUsers(users: PlatformUserRecord[]): void {
    fs.writeFileSync(PLATFORM_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function registerUser(principalId: string): void {
    if (!principalId || principalId === '2vxsx-fae') {
        console.log('❌ Invalid principal ID (cannot be anonymous)');
        process.exit(1);
    }

    const users = loadPlatformUsers();
    const now = Date.now();

    const existingIndex = users.findIndex(u => u.principalId === principalId);

    if (existingIndex >= 0) {
        users[existingIndex].lastSeen = now;
        console.log(`✅ Updated existing user: ${principalId}`);
    } else {
        users.push({
            principalId,
            firstSeen: now,
            lastSeen: now
        });
        console.log(`✅ Registered new platform user: ${principalId}`);
    }

    savePlatformUsers(users);
    console.log(`📋 Total platform users: ${users.length}`);
}

function listUsers(): void {
    const users = loadPlatformUsers();
    console.log('\n📋 Registered Platform Users\n');
    console.log('─'.repeat(60));

    if (users.length === 0) {
        console.log('No users registered yet.');
    } else {
        users.forEach((user, i) => {
            const firstSeen = new Date(user.firstSeen).toLocaleString();
            const lastSeen = new Date(user.lastSeen).toLocaleString();
            console.log(`${i + 1}. ${user.principalId}`);
            console.log(`   First seen: ${firstSeen}`);
            console.log(`   Last seen:  ${lastSeen}`);
            console.log('');
        });
    }
    console.log('─'.repeat(60));
    console.log(`Total: ${users.length} users\n`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    listUsers();
} else if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
Platform User Registration CLI

Usage:
  npx tsx register-platform-user.ts <principal-id>   Register a user
  npx tsx register-platform-user.ts --list           List all users
  npx tsx register-platform-user.ts --help           Show this help

The booster will only accept boost requests from registered platform users.
  `);
} else {
    registerUser(args[0]);
}
