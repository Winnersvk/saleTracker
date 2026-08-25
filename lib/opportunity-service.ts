import type { Prisma, PrismaClient, Stage } from "@prisma/client";
import { ApiError } from "@/lib/api-helpers";
import { writeAudit } from "@/lib/audit";

type TxClient = PrismaClient | Prisma.TransactionClient;

// Centralizes the Section 12 stage-transition rules so both the
// Opportunity PATCH endpoint and Activity-triggered stage changes
// (Section 17 example: an activity result moves the deal forward)
// apply the same history/audit/probability/won-lost side effects.
export async function applyStageTransition(
  tx: TxClient,
  opts: {
    opportunityId: string;
    currentStage: Stage;
    newStage: Stage;
    lostReasonId?: string | null;
    lostRemark?: string | null;
    onHoldReason?: string | null;
    changedById: string | null;
    explicitProbability?: number;
  }
): Promise<Prisma.OpportunityUncheckedUpdateInput> {
  const { opportunityId, currentStage, newStage, changedById } = opts;

  if (newStage === "LOST" && !opts.lostReasonId) {
    throw new ApiError("กรุณาระบุ Lost Reason เมื่อเปลี่ยนสถานะเป็น Lost", 400);
  }

  const data: Prisma.OpportunityUncheckedUpdateInput = { stage: newStage };

  if (opts.explicitProbability !== undefined) {
    data.probability = opts.explicitProbability;
  } else {
    const config = await tx.probabilityConfig.findUnique({ where: { stage: newStage } });
    if (config) data.probability = config.percent;
  }

  const now = new Date();
  if (newStage === "WON") {
    data.wonDate = now;
    data.lostDate = null;
    data.lostReasonId = null;
    data.lostRemark = null;
  } else if (newStage === "LOST") {
    data.lostDate = now;
    data.wonDate = null;
    data.lostReasonId = opts.lostReasonId;
    data.lostRemark = opts.lostRemark ?? null;
  } else {
    data.wonDate = null;
    data.lostDate = null;
    data.lostReasonId = null;
    data.lostRemark = null;
  }

  data.onHoldReason = newStage === "ON_HOLD" ? opts.onHoldReason ?? null : null;

  if (currentStage !== newStage) {
    await tx.stageHistory.create({
      data: {
        opportunityId,
        previousStage: currentStage,
        newStage,
        changedById,
      },
    });
    await writeAudit(tx, {
      entityType: "Opportunity",
      entityId: opportunityId,
      field: "stage",
      previousValue: currentStage,
      newValue: newStage,
      changedById,
    });
  }

  return data;
}

export async function reassignOpportunity(
  tx: TxClient,
  opts: {
    opportunityId: string;
    fromUserId: string | null;
    toUserId: string;
    reason?: string | null;
    changedById: string | null;
  }
) {
  await tx.assignmentHistory.create({
    data: {
      opportunityId: opts.opportunityId,
      fromUserId: opts.fromUserId,
      toUserId: opts.toUserId,
      reason: opts.reason ?? null,
      changedById: opts.changedById,
    },
  });
  await writeAudit(tx, {
    entityType: "Opportunity",
    entityId: opts.opportunityId,
    field: "salesOwner",
    previousValue: opts.fromUserId,
    newValue: opts.toUserId,
    changedById: opts.changedById,
  });
}
