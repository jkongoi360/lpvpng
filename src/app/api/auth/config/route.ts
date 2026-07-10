import { NextResponse } from "next/server";
import { googleEnabled } from "@/lib/oauth";

export const runtime = "nodejs";

// Public: lets the client show/hide the "Continue with Google" button.
export async function GET() {
  return NextResponse.json({ googleEnabled: googleEnabled() });
}
