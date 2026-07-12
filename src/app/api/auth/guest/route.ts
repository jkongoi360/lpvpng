import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  GUEST_EMAIL,
  GUEST_MAX_AGE,
  signValue,
} from "@/lib/session";

export const runtime = "nodejs";

// Grants an anonymous, view-only guest session that expires after 1 hour.
// No account, no password, no OTP. The session token carries a 1-hour expiry;
// once it lapses the proxy sends them back to /login.
export async function POST() {
  const token = await signValue(GUEST_EMAIL, GUEST_MAX_AGE);
  const expires = Date.now() + GUEST_MAX_AGE * 1000;
  const res = NextResponse.json({ success: true, guest: true, expires });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
    path: "/",
  });
  // Readable (non-httpOnly) companion cookie so the client can show a
  // countdown. Purely cosmetic — the httpOnly token above is the real gate.
  res.cookies.set("guest_exp", String(expires), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
    path: "/",
  });
  return res;
}
