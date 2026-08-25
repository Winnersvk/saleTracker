import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireSessionOrThrow(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError("Unauthorized", 401);
  return session;
}

export async function requireAdminOrThrow(): Promise<SessionPayload> {
  const session = await requireSessionOrThrow();
  if (session.role !== "ADMIN") throw new ApiError("Forbidden", 403);
  return session;
}

export async function requireManagerOrAboveOrThrow(): Promise<SessionPayload> {
  const session = await requireSessionOrThrow();
  if (!["SALES_MANAGER", "MANAGEMENT", "ADMIN"].includes(session.role)) {
    throw new ApiError("Forbidden", 403);
  }
  return session;
}

export async function requireExecutiveOrThrow(): Promise<SessionPayload> {
  const session = await requireSessionOrThrow();
  if (!["MANAGEMENT", "ADMIN"].includes(session.role)) {
    throw new ApiError("Forbidden", 403);
  }
  return session;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
