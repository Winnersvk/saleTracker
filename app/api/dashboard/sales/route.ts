import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";
import { opportunityListInclude, decorateOpportunity } from "@/lib/opportunity-decorate";
import { isClosedStage, STAGE_ORDER, type Stage } from "@/lib/pipeline";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  try {
    const session = await requireSessionOrThrow();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = startOfMonth(new Date());

    const opportunities = await prisma.opportunity.findMany({
      where: { salesOwnerId: session.userId },
      include: opportunityListInclude,
      orderBy: { createdAt: "desc" },
    });
    const decorated = opportunities.map(decorateOpportunity);

    const newLeadsToday = decorated.filter((o) => o.createdAt >= today && o.createdAt < tomorrow).length;
    const followUpToday = decorated.filter(
      (o) => !isClosedStage(o.stage) && o.nextFollowUpDate && o.nextFollowUpDate >= today && o.nextFollowUpDate < tomorrow
    ).length;
    const overdue = decorated.filter((o) => !isClosedStage(o.stage) && (o.overdueDays ?? -1) > 0).length;
    const hotDeals = decorated.filter((o) => !isClosedStage(o.stage) && o.temperature === "HOT").length;
    const quotationWaiting = decorated.filter((o) => o.stage === "QUOTATION_SENT").length;
    const wonThisMonth = decorated.filter((o) => o.stage === "WON" && o.wonDate && o.wonDate >= monthStart).length;

    const todaysActions = decorated
      .filter((o) => !isClosedStage(o.stage) && o.nextFollowUpDate && o.nextFollowUpDate < tomorrow)
      .sort((a, b) => (b.overdueDays ?? -999) - (a.overdueDays ?? -999))
      .slice(0, 30);

    const pipelineByStage = STAGE_ORDER.filter((s) => !isClosedStage(s as Stage)).map((stage) => {
      const rows = decorated.filter((o) => o.stage === stage);
      return {
        stage: stage as Stage,
        count: rows.length,
        value: rows.reduce((sum, o) => sum + (o.weightedValue ?? 0), 0),
      };
    });

    return NextResponse.json({
      newLeadsToday,
      followUpToday,
      overdue,
      hotDeals,
      quotationWaiting,
      wonThisMonth,
      todaysActions,
      pipelineByStage,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
