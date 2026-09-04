import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
const schema = z.object({ name: z.string().trim().min(1).max(80), color: z.string().regex(/^#[0-9a-f]{6}$/i).optional() }).strict();
export async function GET(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "tags.read"); return NextResponse.json(await db.customerTag.findMany({ where: { tenantId: context.tenantId }, orderBy: { name: "asc" } })); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "tags.manage"); return NextResponse.json(await db.customerTag.create({ data: { ...schema.parse(await request.json()), tenantId: context.tenantId } }), { status: 201 }); } catch (error) { return apiError(error); } }
