import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { upsertNamedEntitySchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrThrow();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = upsertNamedEntitySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const existing = await prisma.jobType.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const jobType = await prisma.jobType.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ jobType });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrThrow();
    const { id } = await params;
    const existing = await prisma.jobType.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const inUse = await prisma.lead.count({ where: { jobTypeId: id } });
    if (inUse > 0) {
      const jobType = await prisma.jobType.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        jobType,
        message: "ประเภทงานนี้ถูกใช้งานอยู่ จึงปิดการใช้งานแทนการลบ",
      });
    }
    await prisma.jobType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
