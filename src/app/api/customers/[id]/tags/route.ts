import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
const schema = z.object({ tagId: z.string().min(1) }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const context = await contextFromRequest(request); requireCapability(context, "tags.manage"); const customerId = (await params).id; const input = schema.parse(await request.json()); const [customer, tag] = await Promise.all([db.customer.findFirst({ where: { id: customerId, tenantId: context.tenantId } }), db.customerTag.findFirst({ where: { id: input.tagId, tenantId: context.tenantId } })]); if (!customer || !tag) return NextResponse.json({ error: "Resource not found" }, { status: 404 }); return NextResponse.json(await db.customerTagAssignment.upsert({ where: { tenantId_customerId_tagId: { tenantId: context.tenantId, customerId, tagId: input.tagId } }, create: { tenantId: context.tenantId, customerId, tagId: input.tagId }, update: {} }), { status: 201 }); } catch (error) { return apiError(error); } }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const context = await contextFromRequest(request); requireCapability(context, "tags.manage"); const customerId = (await params).id; const input = schema.parse(await request.json()); await db.customerTagAssignment.deleteMany({ where: { tenantId: context.tenantId, customerId, tagId: input.tagId } }); return new NextResponse(null, { status: 204 }); } catch (error) { return apiError(error); } }
