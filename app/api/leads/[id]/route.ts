import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { updateLeadSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        jobType: true,
        channel: true,
        assignedTo: { select: { id: true, name: true } },
        followUps: {
          orderBy: { contactedAt: "desc" },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
    if (!lead) throw new ApiError("ไม่พบข้อมูล", 404);
    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.jobTypeId !== undefined && {
          jobTypeId: data.jobTypeId || null,
        }),
        ...(data.channelId !== undefined && {
          channelId: data.channelId || null,
        }),
        ...(data.contactStartDate !== undefined && {
          contactStartDate: data.contactStartDate
            ? new Date(data.contactStartDate)
            : null,
        }),
        ...(data.priceNotifyMethod !== undefined && {
          priceNotifyMethod: data.priceNotifyMethod || null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.isDone !== undefined && { isDone: data.isDone }),
        ...(data.nextFollowUpDate !== undefined && {
          nextFollowUpDate: data.nextFollowUpDate
            ? new Date(data.nextFollowUpDate)
            : null,
        }),
        ...(data.assignedToId !== undefined && {
          assignedToId: data.assignedToId || null,
        }),
      },
      include: {
        jobType: true,
        channel: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
