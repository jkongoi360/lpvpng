import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, signValue } from "@/lib/session";
import { googleEnabled, googleAuthUrl } from "@/lib/oauth";

export const runtime = "nodejs";

// Public base for redirects — behind nginx, req.url resolves to the internal
// localhost:3030, so build user-facing redirects from APP_URL.
function base(reqUrl: URL): string {
  return (process.env.APP_URL || reqUrl.origin).replace(/\/$/, "");
}

// Starts the Google OAuth flow: stash a signed state (CSRF + the post-login
// redirect target) in a cookie and bounce to Google's consent screen.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/";

  if (!googleEnabled()) {
    return NextResponse.redirect(`${base(url)}/login?error=google_unavailable`);
  }

  // Random state, with the desired redirect encoded alongside it.
  const nonce = crypto.randomUUID();
  const state = `${nonce}|${next}`;
  const res = NextResponse.redirect(googleAuthUrl(nonce));
  res.cookies.set(OAUTH_STATE_COOKIE, await signValue(state, 600), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
