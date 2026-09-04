import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/readiness";

export async function GET() {
  try {
    return NextResponse.json(await getReadiness());
  } catch {
    return NextResponse.json(
      { status: "not_ready", service: "web", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}

