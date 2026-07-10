// SQLite user store (better-sqlite3). NODE-RUNTIME ONLY — never import this
// from middleware (Edge). Route handlers that touch it must set
// `export const runtime = "nodejs"`.
//
// The DB file lives at DATABASE_PATH so production can keep it OUTSIDE the app
// tree (e.g. /var/www/lpvpng-data/app.db), surviving `git pull` + rebuild.
import Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

export type User = {
  id: number;
  email: string;
  password_hash: string;
  email_verified: number; // 0 | 1
  is_admin: number; // 0 | 1
  created_at: string;
};

export type TokenKind = "verify" | "reset";

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
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);
  `);
  _db = db;
  seedAdmin(db);
  return db;
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
