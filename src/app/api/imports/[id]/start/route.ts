import { NextRequest, NextResponse } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { startImport } from "@/services/import-service";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await startImport(await contextFromRequest(request), (await params).id)); } catch (error) { return apiError(error); } }
