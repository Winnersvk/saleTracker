import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { updateQuotationSchema } from "@/lib/validators";

async function assertAccess(
  opportunityId: string,
  session: Awaited<ReturnType<typeof requireSessionOrThrow>>
) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, ...opportunityScopeWhere(session) },
  });
  if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id, qid } = await params;
    await assertAccess(id, session);

    const body = await req.json().catch(() => null);
    const parsed = updateQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const existing = await prisma.quotation.findFirst({ where: { id: qid, opportunityId: id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);

    const quotation = await prisma.$transaction(async (tx) => {
      if (data.isAccepted) {
        await tx.quotation.updateMany({
          where: { opportunityId: id, id: { not: qid } },
          data: { isAccepted: false },
        });
      }
      return tx.quotation.update({
        where: { id: qid },
        data: {
          ...(data.quotationNo !== undefined && { quotationNo: data.quotationNo || null }),
          ...(data.quotationDate !== undefined && {
            quotationDate: data.quotationDate ? new Date(data.quotationDate) : null,
          }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.isAccepted !== undefined && { isAccepted: data.isAccepted }),
        },
      });
    });

    return NextResponse.json({ quotation });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id, qid } = await params;
    await assertAccess(id, session);
    const existing = await prisma.quotation.findFirst({ where: { id: qid, opportunityId: id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    await prisma.quotation.delete({ where: { id: qid } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
