import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return NextResponse.next();
  const origin = request.headers.get("origin");
  const expected = process.env.APP_URL;
  if (origin && expected && origin !== expected) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
