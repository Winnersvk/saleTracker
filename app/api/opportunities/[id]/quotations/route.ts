import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { createQuotationSchema } from "@/lib/validators";

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
    const parsed = createQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const quotation = await prisma.$transaction(async (tx) => {
      if (data.isAccepted) {
        await tx.quotation.updateMany({
          where: { opportunityId: id },
          data: { isAccepted: false },
        });
      }
      return tx.quotation.create({
        data: {
          opportunityId: id,
          quotationNo: data.quotationNo || null,
          quotationDate: data.quotationDate ? new Date(data.quotationDate) : null,
          amount: data.amount,
          status: data.status || "SENT",
          isAccepted: data.isAccepted ?? false,
        },
      });
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
