#!/usr/bin/env node
// Generate a scrypt "salt:hash" password hash compatible with src/lib/password.ts.
// Usage:  node scripts/hash-password.js "myPlaintextPassword"
// Also exported as a function for programmatic use.
const { scryptSync, randomBytes } = require("node:crypto");

const KEY_LENGTH = 64;

function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

module.exports = hashPassword;

if (require.main === module) {
  const plain = process.argv[2];
  if (!plain) {
    console.error('Usage: node scripts/hash-password.js "password"');
    process.exit(1);
  }
  process.stdout.write(hashPassword(plain) + "\n");
}
