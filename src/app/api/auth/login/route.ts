import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSession,
} from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { getUserByEmail } from "@/lib/db";

export const runtime = "nodejs";

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
  // Generic message for both unknown-user and wrong-password → no enumeration.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!user.email_verified) {
    return NextResponse.json(
      { error: "Please verify your email before signing in." },
      { status: 403 }
    );
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
  return res;
}
