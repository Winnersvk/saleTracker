import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { createActivitySchema } from "@/lib/validators";
import { applyStageTransition } from "@/lib/opportunity-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...opportunityScopeWhere(session) },
    });
    if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);

    const body = await req.json().catch(() => null);
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();

    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          opportunityId: id,
          type: data.type,
          occurredAt,
          note: data.note || null,
          followUpRequired: data.followUpRequired ?? false,
          nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
          createdById: session.userId,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });

      let stageFields = {};
      if (data.resultStage && data.resultStage !== opportunity.stage) {
        stageFields = await applyStageTransition(tx, {
          opportunityId: id,
          currentStage: opportunity.stage,
          newStage: data.resultStage,
          changedById: session.userId,
        });
      }

      await tx.opportunity.update({
        where: { id },
        data: {
          lastActivityDate: occurredAt,
          ...(data.nextFollowUpDate !== undefined && {
            nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
          }),
          ...stageFields,
        },
      });

      return created;
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
