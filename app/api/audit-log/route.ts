import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireExecutiveOrThrow, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireExecutiveOrThrow();
    const entries = await prisma.auditLog.findMany({
      orderBy: { changedAt: "desc" },
      take: 200,
      include: { changedBy: { select: { id: true, name: true } } },
    });

    const opportunityIds = entries
      .filter((e) => e.entityType === "Opportunity")
      .map((e) => e.entityId);
    const opportunities = await prisma.opportunity.findMany({
      where: { id: { in: opportunityIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(opportunities.map((o) => [o.id, o.name]));

    const decorated = entries.map((e) => ({
      ...e,
      entityLabel: e.entityType === "Opportunity" ? nameMap.get(e.entityId) ?? e.entityId : e.entityId,
    }));

    return NextResponse.json({ entries: decorated });
  } catch (err) {
    return handleApiError(err);
  }
}
