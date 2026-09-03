import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
export async function GET() {
  try { await db.$queryRaw`SELECT 1`; await redis.ping(); return NextResponse.json({ status:"ok", service:"web", timestamp:new Date().toISOString() }); }
  catch { return NextResponse.json({ status:"not_ready", service:"web", timestamp:new Date().toISOString() }, { status:503 }); }
}
