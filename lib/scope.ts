import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";

// Role visibility (Section 30):
// - SALES: own Opportunities only
// - SALES_MANAGER: their Team's Opportunities
// - MANAGEMENT / ADMIN: everything
export function opportunityScopeWhere(
  session: SessionPayload
): Prisma.OpportunityWhereInput {
  if (session.role === "SALES") {
    return { salesOwnerId: session.userId };
  }
  if (session.role === "SALES_MANAGER") {
    return session.teamId ? { teamId: session.teamId } : { salesOwnerId: session.userId };
  }
  return {};
}

export function canManageMasters(session: SessionPayload) {
  return session.role === "ADMIN";
}

export function canViewExecutiveDashboard(session: SessionPayload) {
  return session.role === "MANAGEMENT" || session.role === "ADMIN";
}

export function canManageTeam(session: SessionPayload) {
  return (
    session.role === "SALES_MANAGER" ||
    session.role === "MANAGEMENT" ||
    session.role === "ADMIN"
  );
}
