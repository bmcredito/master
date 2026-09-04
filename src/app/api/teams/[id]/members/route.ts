import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { TeamService } from "@/services/team-service";
const schema = z.object({ userId: z.string().min(1) }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await new TeamService().addMember(await contextFromRequest(request), (await params).id, schema.parse(await request.json()).userId), { status: 201 }); } catch (error) { return apiError(error); } }
