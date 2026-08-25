import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { createOpportunitySchema } from "@/lib/validators";
import { DEFAULT_PROBABILITY } from "@/lib/pipeline";
import { opportunityListInclude, decorateOpportunity } from "@/lib/opportunity-decorate";

const include = opportunityListInclude;

export async function GET() {
  try {
    const session = await requireSessionOrThrow();
    const opportunities = await prisma.opportunity.findMany({
      where: opportunityScopeWhere(session),
      include,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ opportunities: opportunities.map(decorateOpportunity) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSessionOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = createOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const stage = data.stage ?? "NEW_LEAD";
    const salesOwnerId = data.salesOwnerId || session.userId;
    const salesOwner = await prisma.user.findUnique({ where: { id: salesOwnerId } });

    const opportunity = await prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          name: data.name,
          customerId: data.customerId,
          salesOwnerId,
          teamId: salesOwner?.teamId ?? session.teamId ?? null,
          jobTypeId: data.jobTypeId || null,
          description: data.description || null,
          quantity: data.quantity || null,
          estimatedSize: data.estimatedSize || null,
          requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
          installationRequired: data.installationRequired ?? false,
          location: data.location || null,
          budget: data.budget ?? null,
          leadSourceId: data.leadSourceId || null,
          channelId: data.channelId || null,
          stage,
          temperature: data.temperature ?? "WARM",
          probability: data.probability ?? DEFAULT_PROBABILITY[stage],
          estimatedValue: data.estimatedValue ?? null,
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
          nextFollowUpTime: data.nextFollowUpTime || null,
          nextAction: data.nextAction || null,
          notes: data.notes || null,
        },
        include,
      });
      await tx.stageHistory.create({
        data: {
          opportunityId: created.id,
          previousStage: null,
          newStage: stage,
          changedById: session.userId,
        },
      });
      return created;
    });

    return NextResponse.json({ opportunity: decorateOpportunity(opportunity) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
