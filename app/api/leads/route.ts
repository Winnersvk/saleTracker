import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";
import { createLeadSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireSessionOrThrow();
    const leads = await prisma.lead.findMany({
      include: {
        jobType: true,
        channel: true,
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { followUps: true } },
        followUps: {
          orderBy: { contactedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSessionOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        jobTypeId: data.jobTypeId || null,
        channelId: data.channelId || null,
        contactStartDate: data.contactStartDate
          ? new Date(data.contactStartDate)
          : null,
        priceNotifyMethod: data.priceNotifyMethod || null,
        status: data.status || "CONTACTING",
        priority: data.priority || "MEDIUM",
        notes: data.notes || null,
        isDone: data.isDone ?? false,
        nextFollowUpDate: data.nextFollowUpDate
          ? new Date(data.nextFollowUpDate)
          : null,
        assignedToId: data.assignedToId || session.userId,
      },
      include: {
        jobType: true,
        channel: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
