import { NextRequest, NextResponse } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { CustomerService } from "@/services/customer-service";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const customer = await new CustomerService().get(await contextFromRequest(request), (await params).id); return customer ? NextResponse.json(customer) : NextResponse.json({ error: "Resource not found" }, { status: 404 }); } catch (error) { return apiError(error); } }
