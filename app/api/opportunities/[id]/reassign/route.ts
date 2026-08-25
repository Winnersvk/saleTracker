import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSessionOrThrow,
  requireManagerOrAboveOrThrow,
  handleApiError,
  ApiError,
} from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { reassignSchema } from "@/lib/validators";
import { reassignOpportunity } from "@/lib/opportunity-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireManagerOrAboveOrThrow();
    const { id } = await params;
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...opportunityScopeWhere(session) },
    });
    if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);

    const body = await req.json().catch(() => null);
    const parsed = reassignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const { toUserId, reason } = parsed.data;
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) throw new ApiError("ไม่พบผู้ใช้งานปลายทาง", 404);

    const updated = await prisma.$transaction(async (tx) => {
      await reassignOpportunity(tx, {
        opportunityId: id,
        fromUserId: opportunity.salesOwnerId,
        toUserId,
        reason,
        changedById: session.userId,
      });
      return tx.opportunity.update({
        where: { id },
        data: { salesOwnerId: toUserId, teamId: toUser.teamId ?? opportunity.teamId },
      });
    });

    return NextResponse.json({ opportunity: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const history = await prisma.assignmentHistory.findMany({
      where: { opportunityId: id },
      orderBy: { changedAt: "desc" },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        changedBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ history });
  } catch (err) {
    return handleApiError(err);
  }
}
