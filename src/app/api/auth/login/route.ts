import { NextResponse } from "next/server";
import { LOGIN_PENDING_COOKIE, signValue } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { getUserByEmail, createOtp } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

const PENDING_TTL_SEC = 10 * 60; // must cover the OTP lifetime

// Step 1 of login: check credentials, then issue an emailed OTP. NO session is
// granted here — the browser must complete /api/auth/verify-otp with the code.
export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!user.email_verified) {
    return NextResponse.json(
      { error: "Please verify your email before signing in." },
      { status: 403 }
    );
  }

  const code = createOtp(user.id);
  try {
    await sendOtpEmail(user.email, code);
  } catch {
    return NextResponse.json(
      { error: "Could not send your sign-in code. Please try again." },
      { status: 502 }
    );
  }

  const res = NextResponse.json({ otpRequired: true, email: user.email });
  // Bind the pending login to this browser so only it can complete step 2.
  res.cookies.set(LOGIN_PENDING_COOKIE, await signValue(user.email, PENDING_TTL_SEC), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_TTL_SEC,
    path: "/",
  });
  return res;
}
