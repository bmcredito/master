import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { TeamService } from "@/services/team-service";
const schema = z.object({ name: z.string().min(2).max(120), description: z.string().max(500).optional() }).strict();
export async function GET(request: NextRequest) { try { return NextResponse.json(await new TeamService().list(await contextFromRequest(request))); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { return NextResponse.json(await new TeamService().create(await contextFromRequest(request), schema.parse(await request.json())), { status: 201 }); } catch (error) { return apiError(error); } }
