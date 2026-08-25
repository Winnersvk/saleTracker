import { NextRequest, NextResponse } from "next/server";
import type { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireManagerOrAboveOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
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

// Activity types that represent an actual follow-up touchpoint, as opposed
// to an internal-only note or the one-time "quotation sent" event.
const FOLLOW_UP_ACTIVITY_TYPES: ActivityType[] = [
  "CALL",
  "WHATSAPP",
  "LINE",
  "FACEBOOK",
  "EMAIL",
  "MEETING",
  "SITE_SURVEY",
  "FOLLOW_UP",
  "NEGOTIATION",
  "CUSTOMER_REPLY",
];

const QUOTED_OR_LATER_STAGES = new Set<Stage>([
  "QUOTATION_SENT",
  "FOLLOW_UP",
  "NEGOTIATION",
  "WAITING_APPROVAL",
  "WON",
  "LOST",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireManagerOrAboveOrThrow();
    const { userId } = await params;

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        teamId: true,
        team: { select: { id: true, name: true } },
      },
    });
    if (!target) throw new ApiError("ไม่พบผู้ใช้งาน", 404);

    // Sales Managers may only drill into their own team's reps.
    if (session.role === "SALES_MANAGER" && target.teamId !== session.teamId) {
      throw new ApiError("ไม่มีสิทธิ์เข้าถึงข้อมูลของพนักงานคนนี้", 403);
    }

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = startOfMonth(new Date());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [opportunities, recentActivities, followUpsCompleted30d] = await Promise.all([
      prisma.opportunity.findMany({
        where: { salesOwnerId: userId },
        include: opportunityListInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activity.findMany({
        where: { createdById: userId },
        orderBy: { occurredAt: "desc" },
        take: 15,
        include: { opportunity: { select: { id: true, name: true } } },
      }),
      prisma.activity.count({
        where: {
          createdById: userId,
          occurredAt: { gte: thirtyDaysAgo },
          type: { in: FOLLOW_UP_ACTIVITY_TYPES },
        },
      }),
    ]);
    const decorated = opportunities.map(decorateOpportunity);

    const valueOf = (o: (typeof decorated)[number]) =>
      o.acceptedQuotation?.amount ?? o.latestQuotation?.amount ?? o.estimatedValue ?? 0;

    const wonRows = decorated.filter((o) => o.stage === "WON");
    const lostRows = decorated.filter((o) => o.stage === "LOST");
    const quotedOrLaterRows = decorated.filter((o) => QUOTED_OR_LATER_STAGES.has(o.stage));
    const wonValue = wonRows.reduce((s, o) => s + valueOf(o), 0);
    const cycleDays = wonRows
      .filter((o) => o.wonDate)
      .map((o) => (new Date(o.wonDate!).getTime() - new Date(o.createdAt).getTime()) / 86400000);

    // Key KPI Definitions per spec Section 55.
    const winRate =
      wonRows.length + lostRows.length > 0
        ? Math.round((wonRows.length / (wonRows.length + lostRows.length)) * 1000) / 10
        : 0;
    const leadConversion =
      decorated.length > 0 ? Math.round((wonRows.length / decorated.length) * 1000) / 10 : 0;
    const quoteConversion =
      quotedOrLaterRows.length > 0
        ? Math.round((wonRows.length / quotedOrLaterRows.length) * 1000) / 10
        : 0;
    const avgDealSize = wonRows.length > 0 ? Math.round(wonValue / wonRows.length) : 0;
    const avgSalesCycleDays =
      cycleDays.length > 0 ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : null;

    // Follow-up Completion (Section 36): an approximation given the data
    // model doesn't retain historical due dates once a follow-up is
    // rescheduled - we compare actual touchpoints logged in the last 30
    // days against the current overdue backlog as a proxy for "due vs
    // completed".
    const followUpsOverdue = decorated.filter(
      (o) => !isClosedStage(o.stage) && (o.overdueDays ?? -1) > 0
    ).length;
    const followUpCompletionRate =
      followUpsCompleted30d + followUpsOverdue > 0
        ? Math.round((followUpsCompleted30d / (followUpsCompleted30d + followUpsOverdue)) * 1000) / 10
        : null;

    const newLeadsToday = decorated.filter((o) => o.createdAt >= today && o.createdAt < tomorrow).length;
    const followUpToday = decorated.filter(
      (o) => !isClosedStage(o.stage) && o.nextFollowUpDate && o.nextFollowUpDate >= today && o.nextFollowUpDate < tomorrow
    ).length;
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
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        active: target.active,
        team: target.team,
      },
      totals: {
        opportunities: decorated.length,
        won: wonRows.length,
        lost: lostRows.length,
        wonValue,
        pipelineValue: decorated
          .filter((o) => !isClosedStage(o.stage))
          .reduce((s, o) => s + (o.weightedValue ?? 0), 0),
        overdue: followUpsOverdue,
      },
      kpis: {
        winRate,
        leadConversion,
        quoteConversion,
        avgDealSize,
        avgSalesCycleDays,
        followUpCompletionRate,
        followUpsCompleted30d,
        followUpsOverdue,
      },
      newLeadsToday,
      followUpToday,
      hotDeals,
      quotationWaiting,
      wonThisMonth,
      todaysActions,
      pipelineByStage,
      recentActivities,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
