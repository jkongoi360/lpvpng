// Shared auth helpers for Node-runtime route handlers. NODE-RUNTIME ONLY
// (imports db). Do not import from middleware.
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";
import { getUserByEmail, type User } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// Returns a human-readable problem with the password, or null if acceptable.
export function passwordProblem(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (pw.length > 200) return "Password is too long.";
  return null;
}

// Resolves the logged-in user from the session cookie (verifies signature,
// then loads the DB row so a deleted user's stale cookie is rejected).
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const user = getUserByEmail(session.email);
  return user ?? null;
}
