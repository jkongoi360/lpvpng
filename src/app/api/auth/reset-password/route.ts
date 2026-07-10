import { NextResponse } from "next/server";
import { consumeToken, updatePassword, setEmailVerified } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { passwordProblem } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: unknown; password?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const pwProblem = passwordProblem(password);
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }

  const userId = consumeToken(token, "reset");
  if (userId === null) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }
  updatePassword(userId, hashPassword(password));
  // A successful reset via emailed link also proves email ownership.
  setEmailVerified(userId);
  return NextResponse.json({ success: true });
}
