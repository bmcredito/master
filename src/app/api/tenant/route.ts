import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contextFromRequest } from "@/lib/auth/request";
import { requireCapability } from "@/lib/auth/context";
import { apiError } from "@/lib/http";
export async function GET(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "tenant.read"); return NextResponse.json(await db.tenant.findUnique({ where: { id: context.tenantId } })); } catch (error) { return apiError(error); } }
