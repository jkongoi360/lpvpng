import { NextResponse } from "next/server";
import { createUser, createToken, getUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail, passwordProblem } from "@/lib/auth";

export const runtime = "nodejs";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }
  const pwProblem = passwordProblem(password);
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }

  // Don't reveal whether an account exists — respond the same either way, but
  // only actually create + email when the address is new.
  const existing = getUserByEmail(email);
  if (!existing) {
    const user = createUser(email, hashPassword(password));
    const token = createToken(user.id, "verify", VERIFY_TTL_MS);
    try {
      await sendVerificationEmail(email, token);
    } catch {
      // Email delivery failure shouldn't leak account state; user can use
      // "resend" / forgot-password flows. Log happens inside email lib.
    }
  }

  return NextResponse.json({
    success: true,
    message:
      "If that email is available, we've sent a verification link. Check your inbox.",
  });
}
