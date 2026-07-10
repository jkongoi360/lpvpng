// Session signing/verification using Web Crypto so it works in both the
// middleware (Edge runtime) and route handlers (Node runtime). Tokens are
// `${email}.${expiryMs}.${hexHmac}` — short, stateless, no DB.

export const SESSION_COOKIE_NAME = "smartvoter_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

// Helpers return Uint8Array (a TypedArray) and we pass them directly to
// SubtleCrypto. Web Crypto checks BufferSource via a TypedArray-aware path,
// which avoids cross-realm `instanceof ArrayBuffer` failures that bite when
// the middleware bundle is run inside Node's process.

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// base64url is URL-safe and contains no dots, so it survives Next's cookie
// value handling and lets us safely split the token on '.'.
function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToString(s: string): string | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  const pad = (4 - (s.length % 4)) % 4;
  const std = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  let bin: string;
  try {
    bin = atob(std);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return s;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    strToBytes(getSecret()) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    strToBytes(payload) as unknown as BufferSource
  );
  return bufToHex(sig);
}

async function verifyPayload(payload: string, hex: string): Promise<boolean> {
  if (!hex || hex.length % 2 !== 0) return false;
  const key = await getKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(hex) as unknown as BufferSource,
    strToBytes(payload) as unknown as BufferSource
  );
}

export async function signSession(email: string): Promise<string> {
  const expiry = Date.now() + SESSION_MAX_AGE * 1000;
  const emailB64 = bytesToB64Url(strToBytes(email));
  const payload = `${emailB64}.${expiry}`;
  const sig = await signPayload(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<{ email: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailB64, expiryStr, sig] = parts;
  const payload = `${emailB64}.${expiryStr}`;
  const ok = await verifyPayload(payload, sig);
  if (!ok) return null;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
  const email = b64UrlToString(emailB64);
  if (!email) return null;
  return { email };
}
