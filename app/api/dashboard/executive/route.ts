import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireExecutiveOrThrow, handleApiError } from "@/lib/api-helpers";
import { opportunityListInclude, decorateOpportunity } from "@/lib/opportunity-decorate";
import { isClosedStage } from "@/lib/pipeline";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const DORMANT_THRESHOLD_DAYS = 60;

export async function GET() {
  try {
    await requireExecutiveOrThrow();
    const today = startOfDay(new Date());

    const [opportunities, customers, jobTypes, leadSources] = await Promise.all([
      prisma.opportunity.findMany({
        include: opportunityListInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.findMany({ include: { _count: { select: { opportunities: true } } } }),
      prisma.jobType.findMany(),
      prisma.leadSource.findMany(),
    ]);
    const decorated = opportunities.map(decorateOpportunity);
    const jobTypeMap = new Map(jobTypes.map((j) => [j.id, j.name]));
    const leadSourceMap = new Map(leadSources.map((s) => [s.id, s.name]));

    const valueOf = (o: (typeof decorated)[number]) =>
      o.acceptedQuotation?.amount ?? o.latestQuotation?.amount ?? o.estimatedValue ?? 0;

    const openRows = decorated.filter((o) => !isClosedStage(o.stage));
    const wonRows = decorated.filter((o) => o.stage === "WON");
    const lostRows = decorated.filter((o) => o.stage === "LOST");

    const totalPipeline = openRows.reduce((s, o) => s + valueOf(o), 0);
    const weightedPipeline = openRows.reduce((s, o) => s + (o.weightedValue ?? 0), 0);
    const wonValue = wonRows.reduce((s, o) => s + valueOf(o), 0);
    const winRate =
      wonRows.length + lostRows.length > 0
        ? Math.round((wonRows.length / (wonRows.length + lostRows.length)) * 1000) / 10
        : 0;
    const avgDealSize = wonRows.length > 0 ? Math.round(wonValue / wonRows.length) : 0;
    const cycleDays = wonRows
      .filter((o) => o.wonDate)
      .map((o) => (new Date(o.wonDate!).getTime() - new Date(o.createdAt).getTime()) / 86400000);
    const avgSalesCycleDays =
      cycleDays.length > 0 ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : null;

    const newCustomers = customers.filter((c) => c.customerType === "NEW").length;
    const repeatCustomers = customers.filter((c) => c.customerType === "REPEAT").length;
    const existingCustomers = customers.filter((c) => c.customerType === "EXISTING").length;

    // Monthly trend, last 12 months
    const months: string[] = [];
    const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    const monthlyTrend = months.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const rowsThisMonth = decorated.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
      const wonThisMonth = decorated.filter((o) => {
        if (!o.wonDate) return false;
        const d = new Date(o.wonDate);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
      const lostThisMonth = decorated.filter((o) => {
        if (!o.lostDate) return false;
        const d = new Date(o.lostDate);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
      const quotationValue = rowsThisMonth.reduce((s, o) => s + (o.latestQuotation?.amount ?? 0), 0);
      return {
        month: key,
        leads: rowsThisMonth.length,
        quotationValue,
        wonValue: wonThisMonth.reduce((s, o) => s + valueOf(o), 0),
        lostValue: lostThisMonth.reduce((s, o) => s + valueOf(o), 0),
        conversionRate:
          wonThisMonth.length + lostThisMonth.length > 0
            ? Math.round((wonThisMonth.length / (wonThisMonth.length + lostThisMonth.length)) * 1000) / 10
            : 0,
        pipelineValue: rowsThisMonth.reduce((s, o) => s + (o.weightedValue ?? 0), 0),
      };
    });

    const bySource = new Map<string, typeof decorated>();
    for (const o of decorated) {
      const key = o.leadSourceId ?? "unassigned";
      const arr = bySource.get(key) ?? [];
      arr.push(o);
      bySource.set(key, arr);
    }
    const leadSourcePerformance = Array.from(bySource.entries())
      .map(([id, rows]) => {
        const won = rows.filter((o) => o.stage === "WON");
        const lost = rows.filter((o) => o.stage === "LOST");
        return {
          name: id === "unassigned" ? "ไม่ระบุ" : leadSourceMap.get(id) ?? "ไม่ระบุ",
          leads: rows.length,
          quotations: rows.filter((o) => (o.quotations?.length ?? 0) > 0).length,
          won: won.length,
          winRate: won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 1000) / 10 : 0,
          wonValue: won.reduce((s, o) => s + valueOf(o), 0),
        };
      })
      .sort((a, b) => b.leads - a.leads);

    const byProduct = new Map<string, typeof decorated>();
    for (const o of decorated) {
      const key = o.jobTypeId ?? "unassigned";
      const arr = byProduct.get(key) ?? [];
      arr.push(o);
      byProduct.set(key, arr);
    }
    const productPerformance = Array.from(byProduct.entries())
      .map(([id, rows]) => {
        const won = rows.filter((o) => o.stage === "WON");
        const lost = rows.filter((o) => o.stage === "LOST");
        const pWonValue = won.reduce((s, o) => s + valueOf(o), 0);
        return {
          name: id === "unassigned" ? "ไม่ระบุ" : jobTypeMap.get(id) ?? "ไม่ระบุ",
          opportunities: rows.length,
          quotationValue: rows.reduce((s, o) => s + (o.latestQuotation?.amount ?? 0), 0),
          won: won.length,
          lost: lost.length,
          conversion: rows.length > 0 ? Math.round((won.length / rows.length) * 1000) / 10 : 0,
          wonValue: pWonValue,
          avgDeal: won.length > 0 ? Math.round(pWonValue / won.length) : 0,
        };
      })
      .sort((a, b) => b.opportunities - a.opportunities);

    const wonValueByCustomer = new Map<string, number>();
    const lastActivityByCustomer = new Map<string, Date | null>();
    const hasOpenByCustomer = new Map<string, boolean>();
    for (const o of decorated) {
      wonValueByCustomer.set(
        o.customerId,
        (wonValueByCustomer.get(o.customerId) ?? 0) + (o.stage === "WON" ? valueOf(o) : 0)
      );
      const ref = o.lastActivityDate ? new Date(o.lastActivityDate) : new Date(o.createdAt);
      const prev = lastActivityByCustomer.get(o.customerId);
      if (!prev || ref > prev) lastActivityByCustomer.set(o.customerId, ref);
      if (!isClosedStage(o.stage)) hasOpenByCustomer.set(o.customerId, true);
    }
    const topCustomers = customers
      .map((c) => ({
        id: c.id,
        name: c.name,
        wonValue: wonValueByCustomer.get(c.id) ?? 0,
        opportunities: c._count.opportunities,
      }))
      .filter((c) => c.wonValue > 0)
      .sort((a, b) => b.wonValue - a.wonValue)
      .slice(0, 10);

    const dormantCustomers = customers
      .filter((c) => {
        if (hasOpenByCustomer.get(c.id)) return false;
        const last = lastActivityByCustomer.get(c.id);
        if (!last) return false;
        return (today.getTime() - startOfDay(last).getTime()) / 86400000 >= DORMANT_THRESHOLD_DAYS;
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        lastActivityDate: lastActivityByCustomer.get(c.id)?.toISOString() ?? null,
      }))
      .slice(0, 30);

    return NextResponse.json({
      totalPipeline,
      weightedPipeline,
      wonValue,
      winRate,
      avgDealSize,
      avgSalesCycleDays,
      newCustomers,
      repeatCustomers,
      monthlyTrend,
      leadSourcePerformance,
      productPerformance,
      customerPerformance: {
        newCustomers,
        existingCustomers,
        repeatCustomers,
        repeatPurchaseRate:
          customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 1000) / 10 : 0,
        topCustomers,
        dormantCustomers,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
