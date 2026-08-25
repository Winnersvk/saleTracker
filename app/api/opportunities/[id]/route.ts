import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { updateOpportunitySchema } from "@/lib/validators";
import { applyStageTransition } from "@/lib/opportunity-service";
import { opportunityDetailInclude, decorateOpportunity } from "@/lib/opportunity-decorate";

const include = opportunityDetailInclude;

async function loadScoped(id: string, session: Awaited<ReturnType<typeof requireSessionOrThrow>>) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id, ...opportunityScopeWhere(session) },
    include,
  });
  if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);
  return opportunity;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const opportunity = await loadScoped(id, session);
    return NextResponse.json({ opportunity: decorateOpportunity(opportunity) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const existing = await loadScoped(id, session);

    const body = await req.json().catch(() => null);
    const parsed = updateOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const opportunity = await prisma.$transaction(async (tx) => {
      let stageFields = {};
      const stageChanged = Boolean(data.stage && data.stage !== existing.stage);
      if (stageChanged && data.stage) {
        stageFields = await applyStageTransition(tx, {
          opportunityId: id,
          currentStage: existing.stage,
          newStage: data.stage,
          lostReasonId: data.lostReasonId,
          lostRemark: data.lostRemark,
          onHoldReason: data.onHoldReason,
          changedById: session.userId,
          explicitProbability: data.probability,
        });
      }

      return tx.opportunity.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.customerId !== undefined && { customerId: data.customerId }),
          ...(data.jobTypeId !== undefined && { jobTypeId: data.jobTypeId || null }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.quantity !== undefined && { quantity: data.quantity || null }),
          ...(data.estimatedSize !== undefined && { estimatedSize: data.estimatedSize || null }),
          ...(data.requiredDate !== undefined && {
            requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
          }),
          ...(data.installationRequired !== undefined && {
            installationRequired: data.installationRequired,
          }),
          ...(data.location !== undefined && { location: data.location || null }),
          ...(data.budget !== undefined && { budget: data.budget }),
          ...(data.leadSourceId !== undefined && { leadSourceId: data.leadSourceId || null }),
          ...(data.channelId !== undefined && { channelId: data.channelId || null }),
          ...(data.temperature !== undefined && { temperature: data.temperature }),
          ...(data.probability !== undefined && !stageChanged && { probability: data.probability }),
          ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
          ...(data.nextFollowUpDate !== undefined && {
            nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
          }),
          ...(data.nextFollowUpTime !== undefined && { nextFollowUpTime: data.nextFollowUpTime || null }),
          ...(data.nextAction !== undefined && { nextAction: data.nextAction || null }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
          ...stageFields,
        },
        include,
      });
    });

    return NextResponse.json({ opportunity: decorateOpportunity(opportunity) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const existing = await loadScoped(id, session);
    if (existing.winflowJob) {
      throw new ApiError("ไม่สามารถลบงานที่เชื่อมกับ WINFLOW แล้วได้", 400);
    }
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
