import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  LOGIN_PENDING_COOKIE,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSession,
  verifyValue,
} from "@/lib/session";
import {
  getUserByEmail,
  verifyOtp,
  markFirstLogin,
  createToken,
} from "@/lib/db";
import { sendResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const RESET_TTL_MS = 60 * 60 * 1000;

// Step 2 of login: validate the emailed OTP against the browser-bound pending
// login, then grant the session. Also runs the admin first-login reset hook.
export async function POST(req: Request) {
  let body: { otp?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  const pending = (await cookies()).get(LOGIN_PENDING_COOKIE)?.value;
  const email = await verifyValue(pending);
  if (!email) {
    return NextResponse.json(
      { error: "Your sign-in session expired. Please start again." },
      { status: 400 }
    );
  }
  const user = getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!/^\d{6}$/.test(otp) || !verifyOtp(user.id, otp)) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 }
    );
  }

  // First login for the bootstrap admin → email a link to set their own
  // password, replacing the seeded one. Fires exactly once.
  if (markFirstLogin(user.id) && user.is_admin) {
    try {
      const token = createToken(user.id, "reset", RESET_TTL_MS);
      await sendResetEmail(user.email, token);
    } catch {
      // non-fatal; admin can use "forgot password" later
    }
  }

  const token = await signSession(user.email);
  const res = NextResponse.json({
    success: true,
    email: user.email,
    isAdmin: !!user.is_admin,
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  res.cookies.set(LOGIN_PENDING_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
