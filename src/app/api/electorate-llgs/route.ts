import { NextResponse } from "next/server";
import { getLLGsForElectorate } from "@/lib/data-loader";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const data = await getLLGsForElectorate(slug);
  if (!data) {
    return NextResponse.json(
      { error: `Unknown electorate: ${slug}` },
      { status: 404 },
    );
  }
  return NextResponse.json(data);
}
