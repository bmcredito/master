import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError } from "@/domain/errors";

export function apiError(error: unknown) {
  if (error instanceof AuthenticationError) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  if (error instanceof NotFoundError) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  if (error instanceof ConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof ZodError) return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
