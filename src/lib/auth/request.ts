import type { NextRequest } from "next/server";
import { resolveAuthorizationContext } from "@/lib/auth/context";

export function contextFromRequest(request: NextRequest) {
  return resolveAuthorizationContext(request.headers.get("x-tenant-id"));
}
