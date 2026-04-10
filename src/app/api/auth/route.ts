import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json();
  const { password } = body;

  if (password === sitePassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("site-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}
