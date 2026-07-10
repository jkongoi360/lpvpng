import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSession,
  verifyValue,
} from "@/lib/session";
import { googleEnabled, exchangeCode } from "@/lib/oauth";
import { findOrCreateGoogleUser } from "@/lib/db";

export const runtime = "nodejs";

// Public base for redirects — behind nginx req.url is the internal
// localhost:3030, so build user-facing redirects from APP_URL.
function baseOf(reqUrl: URL): string {
  return (process.env.APP_URL || reqUrl.origin).replace(/\/$/, "");
}

// Google redirects back here with ?code&state. Verify state (CSRF), exchange
// the code, then sign the user straight in — Google logins skip the email OTP.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = baseOf(url);
  const fail = (e: string) =>
    NextResponse.redirect(`${base}/login?error=${e}`);

  if (!googleEnabled()) return fail("google_unavailable");

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || !returnedState) return fail("google_failed");

  const jar = await cookies();
  const stored = await verifyValue(jar.get(OAUTH_STATE_COOKIE)?.value);
  if (!stored) return fail("google_state");
  const [nonce, next = "/"] = stored.split("|");
  if (nonce !== returnedState) return fail("google_state");

  const identity = await exchangeCode(code);
  if (!identity) return fail("google_failed");
  if (!identity.emailVerified) return fail("google_unverified");

  const user = findOrCreateGoogleUser(identity.email, identity.sub);

  // Only allow safe local redirects.
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(`${base}${dest}`);
  res.cookies.set(SESSION_COOKIE_NAME, await signSession(user.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  res.cookies.set(OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
