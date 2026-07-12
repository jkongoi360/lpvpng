// Shared auth helpers for Node-runtime route handlers. NODE-RUNTIME ONLY
// (imports db). Do not import from middleware.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, GUEST_EMAIL, verifySession } from "@/lib/session";
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
  if (!session || session.email === GUEST_EMAIL) return null;
  const user = getUserByEmail(session.email);
  return user ?? null;
}

export type AccessTier = "full" | "guest" | "unpaid" | "none";

// Resolves the caller's access tier:
//  full   — admin or a user who has paid the one-time fee
//  guest  — a valid 1-hour guest session
//  unpaid — logged-in user who hasn't paid
//  none   — no valid session
export async function getAccess(): Promise<{ tier: AccessTier; user: User | null }> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) return { tier: "none", user: null };
  if (session.email === GUEST_EMAIL) return { tier: "guest", user: null };
  const user = getUserByEmail(session.email);
  if (!user) return { tier: "none", user: null };
  if (user.is_admin || user.paid) return { tier: "full", user };
  return { tier: "unpaid", user };
}

// Guard for the core data pages. Full + guest may view; unpaid users are sent
// to the paywall; no session goes to login.
export async function requireFullAccess(): Promise<void> {
  const { tier } = await getAccess();
  if (tier === "full" || tier === "guest") return;
  redirect(tier === "unpaid" ? "/access" : "/login");
}
