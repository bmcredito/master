import { NextRequest, NextResponse } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { createImport } from "@/services/import-service";
export async function POST(request: NextRequest) { try { const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 }); return NextResponse.json(await createImport(await contextFromRequest(request), file.name, file.type, Buffer.from(await file.arrayBuffer()), String(form.get("listId") ?? "") || undefined), { status: 201 }); } catch (error) { return apiError(error); } }
