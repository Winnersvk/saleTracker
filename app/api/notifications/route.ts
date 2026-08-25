import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { opportunityListInclude, decorateOpportunity } from "@/lib/opportunity-decorate";
import { isClosedStage } from "@/lib/pipeline";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

type Notification = {
  id: string;
  type:
    | "NEW_LEAD_ASSIGNED"
    | "FOLLOW_UP_TODAY"
    | "FOLLOW_UP_OVERDUE"
    | "HOT_DEAL_NO_ACTIVITY"
    | "QUOTATION_AGING"
    | "WAITING_APPROVAL_TOO_LONG";
  message: string;
  opportunityId: string;
  severity: "info" | "warning" | "danger";
};

// V1 notification feed: computed live on read rather than a persisted queue
// (Section 47 - "V1 ควรมี Notification ภายในระบบ"; LINE/Email/push are V1.5+).
export async function GET() {
  try {
    const session = await requireSessionOrThrow();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [opportunities, recentAssignments] = await Promise.all([
      prisma.opportunity.findMany({
        where: opportunityScopeWhere(session),
        include: opportunityListInclude,
      }),
      prisma.assignmentHistory.findMany({
        where: {
          toUserId: session.userId,
          changedAt: { gte: new Date(Date.now() - 3 * 86400000) },
        },
        include: { opportunity: { select: { id: true, name: true } } },
        orderBy: { changedAt: "desc" },
        take: 10,
      }),
    ]);
    const decorated = opportunities.map(decorateOpportunity);
    const notifications: Notification[] = [];

    for (const a of recentAssignments) {
      notifications.push({
        id: `assign-${a.id}`,
        type: "NEW_LEAD_ASSIGNED",
        message: `คุณได้รับมอบหมายงาน "${a.opportunity.name}"`,
        opportunityId: a.opportunity.id,
        severity: "info",
      });
    }

    for (const o of decorated) {
      if (isClosedStage(o.stage)) continue;

      if (o.nextFollowUpDate && o.nextFollowUpDate >= today && o.nextFollowUpDate < tomorrow) {
        notifications.push({
          id: `today-${o.id}`,
          type: "FOLLOW_UP_TODAY",
          message: `ต้องติดตาม "${o.name}" วันนี้`,
          opportunityId: o.id,
          severity: "warning",
        });
      }
      if ((o.overdueDays ?? -1) > 0) {
        notifications.push({
          id: `overdue-${o.id}`,
          type: "FOLLOW_UP_OVERDUE",
          message: `"${o.name}" เลยกำหนดติดตามมา ${o.overdueDays} วัน`,
          opportunityId: o.id,
          severity: "danger",
        });
      }
      if (o.temperature === "HOT") {
        const ref = o.lastActivityDate ? new Date(o.lastActivityDate) : new Date(o.createdAt);
        const days = (today.getTime() - startOfDay(ref).getTime()) / 86400000;
        if (days >= 3) {
          notifications.push({
            id: `hotnoact-${o.id}`,
            type: "HOT_DEAL_NO_ACTIVITY",
            message: `Hot Deal "${o.name}" ไม่มีความเคลื่อนไหวมา ${Math.round(days)} วัน`,
            opportunityId: o.id,
            severity: "danger",
          });
        }
      }
      if (o.stage === "QUOTATION_SENT" && o.latestQuotation?.quotationDate) {
        const days =
          (today.getTime() - startOfDay(new Date(o.latestQuotation.quotationDate)).getTime()) / 86400000;
        if (days >= 7) {
          notifications.push({
            id: `qaging-${o.id}`,
            type: "QUOTATION_AGING",
            message: `ใบเสนอราคา "${o.name}" ค้างมา ${Math.round(days)} วันแล้ว`,
            opportunityId: o.id,
            severity: "warning",
          });
        }
      }
      if (o.stage === "WAITING_APPROVAL") {
        const days = (today.getTime() - startOfDay(new Date(o.updatedAt)).getTime()) / 86400000;
        if (days >= 5) {
          notifications.push({
            id: `waiting-${o.id}`,
            type: "WAITING_APPROVAL_TOO_LONG",
            message: `"${o.name}" รออนุมัติมานาน ${Math.round(days)} วัน`,
            opportunityId: o.id,
            severity: "warning",
          });
        }
      }
    }

    const severityRank = { danger: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    return NextResponse.json({ notifications: notifications.slice(0, 50) });
  } catch (err) {
    return handleApiError(err);
  }
}
