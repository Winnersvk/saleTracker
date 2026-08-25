import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { createFollowUpSchema } from "@/lib/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = createFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new ApiError("ไม่พบข้อมูล", 404);

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          leadId: id,
          note: data.note,
          contactedAt: data.contactedAt ? new Date(data.contactedAt) : new Date(),
          resultStatus: data.resultStatus || null,
          createdById: session.userId,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      }),
      prisma.lead.update({
        where: { id },
        data: {
          ...(data.resultStatus ? { status: data.resultStatus } : {}),
          ...(data.nextFollowUpDate !== undefined
            ? {
                nextFollowUpDate: data.nextFollowUpDate
                  ? new Date(data.nextFollowUpDate)
                  : null,
              }
            : {}),
        },
      }),
    ]);

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
