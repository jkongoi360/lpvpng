// Password hashing using Node's built-in scrypt — runs only in Node-runtime
// route handlers (auth APIs), not in the Edge middleware.
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;
  const candidate = scryptSync(plain, salt, KEY_LENGTH);
  return timingSafeEqual(expected, candidate);
}
