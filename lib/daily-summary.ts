import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type DailySummary = {
  date: string;
  companyWide: {
    followedUp: number;
    won: number;
    newLeads: number;
    newCustomers: number;
  };
  byRep: {
    userId: string;
    name: string;
    followedUp: number;
    won: number;
    newLeads: number;
  }[];
};

// "ลูกค้าติดตามกี่ราย / ปิดการขายวันนี้กี่ราย / ลูกค้าเข้าใหม่กี่ราย
// รายงานแยกตามพนักงานขายแต่ละคน" - one digest covering the whole team,
// broken down per rep, for a given calendar day (defaults to today).
export async function buildDailySummary(forDate: Date = new Date()): Promise<DailySummary> {
  const dayStart = startOfDay(forDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [activitiesToday, wonToday, leadsToday, customersToday, users] = await Promise.all([
    prisma.activity.findMany({
      where: { occurredAt: { gte: dayStart, lt: dayEnd } },
      select: {
        opportunityId: true,
        opportunity: { select: { salesOwnerId: true } },
      },
    }),
    prisma.opportunity.findMany({
      where: { stage: "WON", wonDate: { gte: dayStart, lt: dayEnd } },
      select: { id: true, salesOwnerId: true },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
      select: { id: true, salesOwnerId: true },
    }),
    prisma.customer.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const followedUpOppIdsByRep = new Map<string, Set<string>>();
  const allFollowedUpOppIds = new Set<string>();
  for (const a of activitiesToday) {
    allFollowedUpOppIds.add(a.opportunityId);
    const ownerId = a.opportunity.salesOwnerId;
    if (!ownerId) continue;
    const set = followedUpOppIdsByRep.get(ownerId) ?? new Set();
    set.add(a.opportunityId);
    followedUpOppIdsByRep.set(ownerId, set);
  }

  const wonByRep = new Map<string, number>();
  for (const o of wonToday) {
    if (!o.salesOwnerId) continue;
    wonByRep.set(o.salesOwnerId, (wonByRep.get(o.salesOwnerId) ?? 0) + 1);
  }

  const leadsByRep = new Map<string, number>();
  for (const o of leadsToday) {
    if (!o.salesOwnerId) continue;
    leadsByRep.set(o.salesOwnerId, (leadsByRep.get(o.salesOwnerId) ?? 0) + 1);
  }

  const byRep = users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      followedUp: followedUpOppIdsByRep.get(u.id)?.size ?? 0,
      won: wonByRep.get(u.id) ?? 0,
      newLeads: leadsByRep.get(u.id) ?? 0,
    }))
    .filter((r) => r.followedUp > 0 || r.won > 0 || r.newLeads > 0)
    .sort((a, b) => b.won - a.won || b.followedUp - a.followedUp);

  return {
    date: dayStart.toISOString().slice(0, 10),
    companyWide: {
      followedUp: allFollowedUpOppIds.size,
      won: wonToday.length,
      newLeads: leadsToday.length,
      newCustomers: customersToday,
    },
    byRep,
  };
}

export function formatDailySummaryMessage(summary: DailySummary): string {
  const d = new Date(summary.date);
  const dateLabel = d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  const lines = [
    `📊 สรุปยอดขายประจำวัน — ${dateLabel}`,
    "",
    `👥 ลูกค้าที่ติดตามวันนี้: ${summary.companyWide.followedUp} ราย`,
    `🎉 ปิดการขายวันนี้: ${summary.companyWide.won} ราย`,
    `🆕 ลูกค้า/Lead เข้าใหม่: ${summary.companyWide.newLeads} ราย (ลูกค้าใหม่ในระบบ ${summary.companyWide.newCustomers} ราย)`,
  ];

  if (summary.byRep.length > 0) {
    lines.push("", "แยกตามพนักงานขาย:");
    for (const r of summary.byRep) {
      lines.push(`• ${r.name} — ติดตาม ${r.followedUp} | ปิด ${r.won} | Lead ใหม่ ${r.newLeads}`);
    }
  } else {
    lines.push("", "วันนี้ยังไม่มีความเคลื่อนไหวจากทีมขาย");
  }

  return lines.join("\n");
}
