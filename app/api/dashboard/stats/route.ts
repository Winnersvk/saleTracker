import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    await requireSessionOrThrow();

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      doneCount,
      statusGroups,
      priorityGroups,
      jobTypeGroups,
      channelGroups,
      repGroups,
      overdueCount,
      dueTodayCount,
      jobTypes,
      channels,
      users,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { isDone: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["priority"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["jobTypeId"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["channelId"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
      prisma.lead.count({
        where: {
          isDone: false,
          nextFollowUpDate: { lt: today },
        },
      }),
      prisma.lead.count({
        where: {
          isDone: false,
          nextFollowUpDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.jobType.findMany(),
      prisma.channel.findMany(),
      prisma.user.findMany({ select: { id: true, name: true } }),
    ]);

    const jobTypeMap = new Map(jobTypes.map((j) => [j.id, j.name]));
    const channelMap = new Map(channels.map((c) => [c.id, c.name]));
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Ordered-per-jobType / channel for conversion rate
    const orderedByJobType = await prisma.lead.groupBy({
      by: ["jobTypeId"],
      where: { status: "ORDERED" },
      _count: { _all: true },
    });
    const orderedByChannel = await prisma.lead.groupBy({
      by: ["channelId"],
      where: { status: "ORDERED" },
      _count: { _all: true },
    });
    const orderedByRepRaw = await prisma.lead.groupBy({
      by: ["assignedToId"],
      where: { status: "ORDERED" },
      _count: { _all: true },
    });
    const orderedByJobTypeMap = new Map(
      orderedByJobType.map((o) => [o.jobTypeId, o._count._all])
    );
    const orderedByChannelMap = new Map(
      orderedByChannel.map((o) => [o.channelId, o._count._all])
    );
    const orderedByRepMap = new Map(
      orderedByRepRaw.map((o) => [o.assignedToId, o._count._all])
    );

    const statusBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    const priorityBreakdown = priorityGroups.map((g) => ({
      priority: g.priority,
      count: g._count._all,
    }));

    const jobTypeBreakdown = jobTypeGroups
      .map((g) => ({
        jobTypeId: g.jobTypeId,
        name: g.jobTypeId ? jobTypeMap.get(g.jobTypeId) ?? "ไม่ระบุ" : "ไม่ระบุ",
        count: g._count._all,
        ordered: orderedByJobTypeMap.get(g.jobTypeId) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);

    const channelBreakdown = channelGroups
      .map((g) => {
        const count = g._count._all;
        const ordered = orderedByChannelMap.get(g.channelId) ?? 0;
        return {
          channelId: g.channelId,
          name: g.channelId ? channelMap.get(g.channelId) ?? "ไม่ระบุ" : "ไม่ระบุ",
          count,
          ordered,
          conversionRate: count > 0 ? Math.round((ordered / count) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    const repLeaderboard = repGroups
      .map((g) => {
        const count = g._count._all;
        const ordered = orderedByRepMap.get(g.assignedToId) ?? 0;
        return {
          userId: g.assignedToId,
          name: g.assignedToId ? userMap.get(g.assignedToId) ?? "ไม่ระบุ" : "ไม่ระบุ",
          count,
          ordered,
          conversionRate: count > 0 ? Math.round((ordered / count) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    const orderedTotal = statusBreakdown.find((s) => s.status === "ORDERED")?.count ?? 0;
    const conversionRate = total > 0 ? Math.round((orderedTotal / total) * 1000) / 10 : 0;

    // Weekly trend for the last 8 weeks based on createdAt
    const now = startOfDay(new Date());
    const weekRanges: { weekStart: Date; weekEnd: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekRanges.push({ weekStart, weekEnd });
    }
    const weekCounts = await Promise.all(
      weekRanges.map((w) =>
        prisma.lead.count({
          where: { createdAt: { gte: w.weekStart, lt: w.weekEnd } },
        })
      )
    );
    const weekBuckets = weekRanges.map((w, i) => ({
      weekStart: w.weekStart.toISOString().slice(0, 10),
      count: weekCounts[i],
    }));

    return NextResponse.json({
      total,
      doneCount,
      notDoneCount: total - doneCount,
      orderedTotal,
      conversionRate,
      overdueCount,
      dueTodayCount,
      statusBreakdown,
      priorityBreakdown,
      jobTypeBreakdown,
      channelBreakdown,
      repLeaderboard,
      weeklyTrend: weekBuckets,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
