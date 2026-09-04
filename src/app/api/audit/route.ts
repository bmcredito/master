import { NextResponse, type NextRequest } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { requireCapability } from "@/lib/auth/context";
import { apiError } from "@/lib/http";
import { db } from "@/lib/db";
import { AuditRepository } from "@/repositories/tenant-repositories";
export async function GET(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "audit.read"); return NextResponse.json(await new AuditRepository(db).list(context.tenantId)); } catch (error) { return apiError(error); } }
