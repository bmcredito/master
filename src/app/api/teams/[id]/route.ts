import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { TeamService } from "@/services/team-service";
const schema = z.object({ name: z.string().min(2).max(120).optional(), description: z.string().max(500).optional(), status: z.enum(["ACTIVE", "ARCHIVED"]).optional() }).strict();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await new TeamService().update(await contextFromRequest(request), (await params).id, schema.parse(await request.json()))); } catch (error) { return apiError(error); } }
