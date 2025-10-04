#!/usr/bin/env node

/**
 * Generate a random 32-character encryption key for AES-256-GCM
 * Run: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

const key = crypto.randomBytes(16).toString('hex');

console.log('\n========================================');
console.log('Generated Encryption Key for .env.local');
console.log('========================================\n');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('Copy the line above to your .env.local file');
console.log('========================================\n');
