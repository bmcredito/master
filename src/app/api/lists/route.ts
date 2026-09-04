import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { recordEvent } from "@/services/events";
const schema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().max(500).optional() }).strict();
export async function GET(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "lists.read"); return NextResponse.json(await db.customerList.findMany({ where: { tenantId: context.tenantId }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" } })); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { const context = await contextFromRequest(request); requireCapability(context, "lists.create"); const input = schema.parse(await request.json()); const list = await db.$transaction(async (transaction) => { const created = await transaction.customerList.create({ data: { ...input, tenantId: context.tenantId } }); await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "CUSTOMER_LIST_CREATED", entityType: "CustomerList", entityId: created.id }); return created; }); return NextResponse.json(list, { status: 201 }); } catch (error) { return apiError(error); } }
