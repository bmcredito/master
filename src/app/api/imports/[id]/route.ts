import { NextRequest, NextResponse } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { getImport, saveImportMapping } from "@/services/import-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await getImport(await contextFromRequest(request), (await params).id)); } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await saveImportMapping(await contextFromRequest(request), (await params).id, await request.json())); } catch (error) { return apiError(error); }
}
