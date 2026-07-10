// Ward-coordinate overrides, persisted server-side. Ported from the smartvoter
// app, but now ADMIN-GATED — the original endpoint let any visitor write the
// file, which its own comment flagged as unsafe.
//
// GET  -> returns the full { wardId: [lat,lng] } override map (any signed-in
//         user) so the map can seed hand-placed positions for everyone.
// POST -> merges { overrides: {...} } into the file (admin only).
import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

type LatLng = [number, number];

// Persist OUTSIDE the app tree in prod (alongside the SQLite DB) so a rebuild
// doesn't wipe saved coordinates. Falls back to the in-repo file in dev.
function overridesPath(): string {
  if (process.env.WARD_OVERRIDES_PATH) {
    return path.resolve(process.env.WARD_OVERRIDES_PATH);
  }
  if (process.env.DATABASE_PATH) {
    return path.join(path.dirname(path.resolve(process.env.DATABASE_PATH)), "wardOverrides.json");
  }
  return path.join(process.cwd(), "src", "data", "wardOverrides.json");
}

function isLatLng(v: unknown): v is LatLng {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  );
}

async function readOverrides(): Promise<Record<string, LatLng>> {
  const out: Record<string, LatLng> = {};
  try {
    const parsed = JSON.parse(await readFile(overridesPath(), "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [id, val] of Object.entries(parsed)) {
        if (isLatLng(val)) out[id] = val;
      }
    }
  } catch {
    // Missing/invalid file → empty.
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ overrides: await readOverrides() });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const incoming = (body as { overrides?: unknown })?.overrides;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return NextResponse.json(
      { error: "Body must be { overrides: { wardId: [lat, lng] } }" },
      { status: 400 }
    );
  }

  const sanitized: Record<string, LatLng> = {};
  for (const [id, val] of Object.entries(incoming as Record<string, unknown>)) {
    if (isLatLng(val)) sanitized[id] = val;
  }

  const merged = { ...(await readOverrides()), ...sanitized };
  const file = overridesPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(merged, null, 2) + "\n", "utf8");

  return NextResponse.json({
    success: true,
    saved: Object.keys(sanitized).length,
    total: Object.keys(merged).length,
  });
}
