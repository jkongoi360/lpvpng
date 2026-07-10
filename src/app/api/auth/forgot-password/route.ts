import { NextResponse } from "next/server";
import { getUserByEmail, createToken } from "@/lib/db";
import { sendResetEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/auth";

export const runtime = "nodejs";

const RESET_TTL_MS = 60 * 60 * 1000; // 1h

export async function POST(req: Request) {
  let body: { email?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  // Only act when the account exists, but ALWAYS return the same response so
  // this endpoint can't be used to probe which emails are registered.
  if (isValidEmail(email)) {
    const user = getUserByEmail(email);
    if (user) {
      const token = createToken(user.id, "reset", RESET_TTL_MS);
      try {
        await sendResetEmail(email, token);
      } catch {
        // swallow — see email lib log
      }
    }
  }

  return NextResponse.json({
    success: true,
    message:
      "If an account exists for that email, we've sent a password reset link.",
  });
}
