import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";

// Next 16 renamed the "middleware" convention to "proxy" (same functionality).
// Runs on the Edge runtime — only Web Crypto is available here, which is
// exactly what verifySession() uses. No DB access here; the signed cookie is
// validated statelessly.
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(cookie);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

// Everything except Next internals and static image assets is gated. The
// PUBLIC_PREFIXES check above lets the auth pages/APIs through.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
