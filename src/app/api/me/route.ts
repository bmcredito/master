import { NextResponse, type NextRequest } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
export async function GET(request: NextRequest) { try { return NextResponse.json(await contextFromRequest(request)); } catch (error) { return apiError(error); } }
