import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { resolveAuthorizationContext, tenantCookieName } from "@/lib/auth/context";
import { apiError } from "@/lib/http";
const schema = z.object({ tenantId: z.string().min(1) });
export async function POST(request: NextRequest) { try { const { tenantId } = schema.parse(await request.json()); await resolveAuthorizationContext(tenantId); const response = NextResponse.json({ ok: true }); response.cookies.set(tenantCookieName, tenantId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 }); return response; } catch (error) { return apiError(error); } }
