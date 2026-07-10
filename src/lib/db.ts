// SQLite user store (better-sqlite3). NODE-RUNTIME ONLY — never import this
// from middleware (Edge). Route handlers that touch it must set
// `export const runtime = "nodejs"`.
//
// The DB file lives at DATABASE_PATH so production can keep it OUTSIDE the app
// tree (e.g. /var/www/lpvpng-data/app.db), surviving `git pull` + rebuild.
import Database from "better-sqlite3";
import { createHash, randomBytes, randomInt } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

export type User = {
  id: number;
  email: string;
  password_hash: string;
  email_verified: number; // 0 | 1
  is_admin: number; // 0 | 1
  created_at: string;
  first_login_at: string | null;
  auth_provider: string; // 'password' | 'google'
  google_sub: string | null;
};

export type TokenKind = "verify" | "reset" | "otp";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const OTP_MAX_ATTEMPTS = 5;

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;
  const p = configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

// Singleton across hot-reloads in dev (module cache) and per-process in prod.
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(resolveDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      first_login_at TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'password',
      google_sub   TEXT
    );
    CREATE TABLE IF NOT EXISTS tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at    TEXT,
      attempts   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);
  `);
  migrate(db);
  _db = db;
  seedAdmin(db);
  return db;
}

// Additive, idempotent column migrations for DBs created before these columns
// existed (e.g. the live prod DB). Safe to run on every boot.
function migrate(db: Database.Database) {
  const cols = (table: string): Set<string> =>
    new Set(
      (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (r) => r.name
      )
    );
  const userCols = cols("users");
  if (!userCols.has("first_login_at"))
    db.exec("ALTER TABLE users ADD COLUMN first_login_at TEXT");
  if (!userCols.has("auth_provider"))
    db.exec(
      "ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'"
    );
  if (!userCols.has("google_sub"))
    db.exec("ALTER TABLE users ADD COLUMN google_sub TEXT");
  const tokenCols = cols("tokens");
  if (!tokenCols.has("attempts"))
    db.exec("ALTER TABLE tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0");
}

// Seed the bootstrap admin from env once, if not already present. Reuses the
// existing ADMIN_PASSWORD_HASH so the admin keeps their current password.
function seedAdmin(db: Database.Database) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash) return;
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: number } | undefined;
  if (existing) return;
  db.prepare(
    `INSERT INTO users (email, password_hash, email_verified, is_admin)
     VALUES (?, ?, 1, 1)`
  ).run(email, hash);
}

// ---- User helpers -------------------------------------------------------

export function getUserByEmail(email: string): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as User | undefined;
}

export function createUser(email: string, passwordHash: string): User {
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO users (email, password_hash, email_verified, is_admin) VALUES (?, ?, 0, 0)"
    )
    .run(email.trim().toLowerCase(), passwordHash);
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(info.lastInsertRowid) as User;
}

export function setEmailVerified(userId: number): void {
  getDb().prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
}

export function updatePassword(userId: number, passwordHash: string): void {
  getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(passwordHash, userId);
}

// ---- Token helpers ------------------------------------------------------

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Issues a single-use token, returning the RAW value to embed in an emailed
// link. Only its hash is stored, so a DB leak can't be used to forge links.
export function createToken(
  userId: number,
  kind: TokenKind,
  ttlMs: number
): string {
  const raw = randomBytes(32).toString("hex");
  getDb()
    .prepare(
      "INSERT INTO tokens (user_id, kind, token_hash, expires_at) VALUES (?, ?, ?, ?)"
    )
    .run(userId, kind, hashToken(raw), Date.now() + ttlMs);
  return raw;
}

// Validates and consumes a token in one shot. Returns the owning user_id, or
// null if the token is unknown, wrong-kind, expired, or already used.
export function consumeToken(raw: string, kind: TokenKind): number | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, user_id, expires_at, used_at FROM tokens WHERE token_hash = ? AND kind = ?"
    )
    .get(hashToken(raw), kind) as
    | { id: number; user_id: number; expires_at: number; used_at: string | null }
    | undefined;
  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at < Date.now()) return null;
  db.prepare("UPDATE tokens SET used_at = datetime('now') WHERE id = ?").run(
    row.id
  );
  return row.user_id;
}

// ---- Login OTP (email 2FA) ---------------------------------------------

// Issues a fresh 6-digit login OTP for the user, invalidating any prior
// unused ones. Returns the plaintext code to email.
export function createOtp(userId: number): string {
  const db = getDb();
  db.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = 'otp'").run(userId);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(
    "INSERT INTO tokens (user_id, kind, token_hash, expires_at, attempts) VALUES (?, 'otp', ?, ?, 0)"
  ).run(userId, hashToken(`${userId}.${code}`), Date.now() + OTP_TTL_MS);
  return code;
}

// Validates a login OTP. Single-use; expires; locks out after OTP_MAX_ATTEMPTS
// wrong tries (the row is deleted so the user must request a new code).
export function verifyOtp(userId: number, code: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, token_hash, expires_at, used_at, attempts FROM tokens WHERE user_id = ? AND kind = 'otp'"
    )
    .get(userId) as
    | { id: number; token_hash: string; expires_at: number; used_at: string | null; attempts: number }
    | undefined;
  if (!row || row.used_at || row.expires_at < Date.now()) return false;
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    db.prepare("DELETE FROM tokens WHERE id = ?").run(row.id);
    return false;
  }
  const ok = hashToken(`${userId}.${code}`) === row.token_hash;
  if (!ok) {
    db.prepare("UPDATE tokens SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return false;
  }
  db.prepare("DELETE FROM tokens WHERE id = ?").run(row.id);
  return true;
}

// ---- First-login & Google -----------------------------------------------

// Sets first_login_at if unset; returns true only the first time.
export function markFirstLogin(userId: number): boolean {
  const info = getDb()
    .prepare(
      "UPDATE users SET first_login_at = datetime('now') WHERE id = ? AND first_login_at IS NULL"
    )
    .run(userId);
  return info.changes > 0;
}

// Finds a user by email or creates a Google-backed one (email pre-verified,
// no usable password so they can only sign in via Google).
export function findOrCreateGoogleUser(email: string, sub: string): User {
  const db = getDb();
  const existing = getUserByEmail(email);
  if (existing) {
    if (!existing.google_sub) {
      db.prepare(
        "UPDATE users SET google_sub = ?, auth_provider = 'google', email_verified = 1 WHERE id = ?"
      ).run(sub, existing.id);
    }
    return getUserByEmail(email) as User;
  }
  const unusable = `google:${randomBytes(24).toString("hex")}`;
  const info = db
    .prepare(
      "INSERT INTO users (email, password_hash, email_verified, is_admin, auth_provider, google_sub) VALUES (?, ?, 1, 0, 'google', ?)"
    )
    .run(email.trim().toLowerCase(), unusable, sub);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as User;
}
