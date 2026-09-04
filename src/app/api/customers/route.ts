import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { CustomerService } from "@/services/customer-service";

const createSchema = z.object({ fullName: z.string().trim().min(2).max(200), identifiers: z.array(z.object({ type: z.enum(["PHONE", "CPF", "EMAIL", "EXTERNAL_ID"]), normalizedValue: z.string().min(1).max(200) }).strict()).max(10).optional() }).strict();
export async function GET(request: NextRequest) { try { const url = new URL(request.url); return NextResponse.json(await new CustomerService().list(await contextFromRequest(request), url.searchParams.get("q") ?? undefined, Math.max(1, Number(url.searchParams.get("page") ?? 1)), Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25))))); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { return NextResponse.json(await new CustomerService().create(await contextFromRequest(request), createSchema.parse(await request.json())), { status: 201 }); } catch (error) { return apiError(error); } }
