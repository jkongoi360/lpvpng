import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, GUEST_EMAIL, verifySession } from "@/lib/session";
import { getUserByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  // Guest session — anonymous, view-only, no DB record.
  if (session.email === GUEST_EMAIL) {
    return NextResponse.json({ authenticated: true, guest: true, isAdmin: false });
  }
  const user = getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: user.email,
    isAdmin: !!user.is_admin,
  });
}
