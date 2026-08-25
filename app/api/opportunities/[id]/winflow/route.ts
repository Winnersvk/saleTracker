import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { opportunityScopeWhere } from "@/lib/scope";
import { upsertWinflowJobSchema } from "@/lib/validators";

// No live WINFLOW API in this build (Section 26 fields are captured as
// free text so nothing is lost once a real integration lands). This
// creates/updates a manual short-status mirror (Section 27).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSessionOrThrow();
    const { id } = await params;
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...opportunityScopeWhere(session) },
      include: { winflowJob: true },
    });
    if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);
    if (opportunity.stage !== "WON") {
      throw new ApiError("สร้างงาน WINFLOW ได้เฉพาะโอกาสขายที่ Won แล้ว", 400);
    }
    if (opportunity.winflowJob) {
      throw new ApiError("มีงาน WINFLOW ของโอกาสขายนี้อยู่แล้ว", 400);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = upsertWinflowJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const winflowJob = await prisma.winflowJob.create({
      data: {
        opportunityId: id,
        jobNo: parsed.data.jobNo || null,
        stage: parsed.data.stage || "JOB_CREATED",
        notes: parsed.data.notes || null,
      },
    });
    return NextResponse.json({ winflowJob }, { status: 201 });
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
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...opportunityScopeWhere(session) },
      include: { winflowJob: true },
    });
    if (!opportunity) throw new ApiError("ไม่พบข้อมูล หรือไม่มีสิทธิ์เข้าถึง", 404);
    if (!opportunity.winflowJob) throw new ApiError("ยังไม่มีงาน WINFLOW", 404);

    const body = await req.json().catch(() => null);
    const parsed = upsertWinflowJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const winflowJob = await prisma.winflowJob.update({
      where: { opportunityId: id },
      data: parsed.data,
    });
    return NextResponse.json({ winflowJob });
  } catch (err) {
    return handleApiError(err);
  }
}
