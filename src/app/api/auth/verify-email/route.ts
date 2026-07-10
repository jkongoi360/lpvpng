import { NextResponse } from "next/server";
import { consumeToken, setEmailVerified } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const userId = consumeToken(token, "verify");
  if (userId === null) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }
  setEmailVerified(userId);
  return NextResponse.json({ success: true });
}
