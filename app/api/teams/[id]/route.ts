import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { upsertTeamSchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrThrow();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = upsertTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const team = await prisma.team.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ team });
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
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const inUse = await prisma.user.count({ where: { teamId: id } });
    if (inUse > 0) throw new ApiError("ไม่สามารถลบทีมที่มีผู้ใช้งานอยู่ได้", 400);
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
