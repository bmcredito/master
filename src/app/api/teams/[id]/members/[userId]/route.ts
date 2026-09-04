import { NextResponse, type NextRequest } from "next/server";
import { contextFromRequest } from "@/lib/auth/request";
import { apiError } from "@/lib/http";
import { TeamService } from "@/services/team-service";
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) { try { const values = await params; await new TeamService().removeMember(await contextFromRequest(request), values.id, values.userId); return new NextResponse(null, { status: 204 }); } catch (error) { return apiError(error); } }
