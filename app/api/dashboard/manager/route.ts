import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerOrAboveOrThrow, handleApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { opportunityListInclude, decorateOpportunity } from "@/lib/opportunity-decorate";
import { isClosedStage, STAGE_ORDER, getAgingBucket, AGING_BUCKET_LABELS } from "@/lib/pipeline";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const NO_ACTIVITY_THRESHOLD_DAYS = 7;

export async function GET() {
  try {
    const session = await requireManagerOrAboveOrThrow();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [opportunities, lostReasons] = await Promise.all([
      prisma.opportunity.findMany({
        where: opportunityScopeWhere(session),
        include: opportunityListInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lostReason.findMany(),
    ]);
    const decorated = opportunities.map(decorateOpportunity);
    const lostReasonMap = new Map(lostReasons.map((r) => [r.id, r.name]));

    const newLeads = decorated.filter((o) => o.createdAt >= today && o.createdAt < tomorrow).length;
    const openOpportunities = decorated.filter((o) => !isClosedStage(o.stage)).length;
    const quotationSent = decorated.filter((o) => o.stage === "QUOTATION_SENT").length;
    const followUpToday = decorated.filter(
      (o) => !isClosedStage(o.stage) && o.nextFollowUpDate && o.nextFollowUpDate >= today && o.nextFollowUpDate < tomorrow
    ).length;
    const overdue = decorated.filter((o) => !isClosedStage(o.stage) && (o.overdueDays ?? -1) > 0).length;
    const won = decorated.filter((o) => o.stage === "WON").length;
    const lost = decorated.filter((o) => o.stage === "LOST").length;
    const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 1000) / 10 : 0;
    const pipelineValue = decorated
      .filter((o) => !isClosedStage(o.stage))
      .reduce((sum, o) => sum + (o.weightedValue ?? 0), 0);

    const funnel = STAGE_ORDER.filter((s) => s !== "ON_HOLD").map((stage) => ({
      stage,
      count: decorated.filter((o) => o.stage === stage).length,
    }));

    const repMap = new Map<string, typeof decorated>();
    for (const o of decorated) {
      const key = o.salesOwnerId ?? "unassigned";
      const arr = repMap.get(key) ?? [];
      arr.push(o);
      repMap.set(key, arr);
    }
    const salesPerformance = Array.from(repMap.entries()).map(([userId, rows]) => {
      const repWon = rows.filter((o) => o.stage === "WON");
      const repLost = rows.filter((o) => o.stage === "LOST");
      const cycleDays = repWon
        .filter((o) => o.wonDate)
        .map((o) => (new Date(o.wonDate!).getTime() - new Date(o.createdAt).getTime()) / 86400000);
      return {
        userId,
        name: rows[0]?.salesOwner?.name ?? "ไม่ระบุ",
        leads: rows.length,
        opportunities: rows.length,
        quotations: rows.filter((o) => (o.quotations?.length ?? 0) > 0).length,
        won: repWon.length,
        lost: repLost.length,
        winRate:
          repWon.length + repLost.length > 0
            ? Math.round((repWon.length / (repWon.length + repLost.length)) * 1000) / 10
            : 0,
        pipelineValue: rows
          .filter((o) => !isClosedStage(o.stage))
          .reduce((sum, o) => sum + (o.weightedValue ?? 0), 0),
        wonValue: repWon.reduce(
          (sum, o) => sum + (o.acceptedQuotation?.amount ?? o.latestQuotation?.amount ?? o.estimatedValue ?? 0),
          0
        ),
        overdue: rows.filter((o) => !isClosedStage(o.stage) && (o.overdueDays ?? -1) > 0).length,
        avgSalesCycleDays:
          cycleDays.length > 0 ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : null,
      };
    });

    const noActivity = decorated
      .filter((o) => {
        if (isClosedStage(o.stage)) return false;
        const ref = o.lastActivityDate ?? o.createdAt;
        const days = (today.getTime() - startOfDay(new Date(ref)).getTime()) / 86400000;
        return days >= NO_ACTIVITY_THRESHOLD_DAYS;
      })
      .sort((a, b) => new Date(a.lastActivityDate ?? a.createdAt).getTime() - new Date(b.lastActivityDate ?? b.createdAt).getTime());

    const agingBuckets: Record<string, { count: number; value: number }> = {};
    for (const o of decorated) {
      if (o.stage !== "QUOTATION_SENT") continue;
      const q = o.latestQuotation;
      if (!q?.quotationDate) continue;
      const days = (today.getTime() - startOfDay(new Date(q.quotationDate)).getTime()) / 86400000;
      const bucket = getAgingBucket(Math.max(0, Math.round(days)));
      agingBuckets[bucket] = agingBuckets[bucket] ?? { count: 0, value: 0 };
      agingBuckets[bucket].count += 1;
      agingBuckets[bucket].value += q.amount;
    }
    const quotationAging = Object.entries(AGING_BUCKET_LABELS).map(([bucket, label]) => ({
      bucket: label,
      count: agingBuckets[bucket]?.count ?? 0,
      value: agingBuckets[bucket]?.value ?? 0,
    }));

    const lostRows = decorated.filter((o) => o.stage === "LOST");
    const lostByReason = new Map<string, { count: number; value: number }>();
    for (const o of lostRows) {
      const key = o.lostReasonId ? lostReasonMap.get(o.lostReasonId) ?? "ไม่ระบุ" : "ไม่ระบุ";
      const entry = lostByReason.get(key) ?? { count: 0, value: 0 };
      entry.count += 1;
      entry.value += o.acceptedQuotation?.amount ?? o.latestQuotation?.amount ?? o.estimatedValue ?? 0;
      lostByReason.set(key, entry);
    }
    const lostTotal = lostRows.length;
    const lostReasonsBreakdown = Array.from(lostByReason.entries())
      .map(([reason, v]) => ({
        reason,
        count: v.count,
        value: v.value,
        percent: lostTotal > 0 ? Math.round((v.count / lostTotal) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      newLeads,
      openOpportunities,
      quotationSent,
      followUpToday,
      overdue,
      won,
      lost,
      winRate,
      pipelineValue,
      funnel,
      salesPerformance,
      noActivity: noActivity.slice(0, 30),
      quotationAging,
      lostReasons: lostReasonsBreakdown,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
