import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const existing = await prisma.followUp.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    await prisma.followUp.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
