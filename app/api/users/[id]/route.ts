import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { updateUserSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrThrow();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);

    const { password, email, ...rest } = parsed.data;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(email !== undefined && { email: email.toLowerCase() }),
        ...(password !== undefined && {
          passwordHash: await hashPassword(password),
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrThrow();
    const { id } = await params;
    if (id === session.userId) {
      throw new ApiError("ไม่สามารถลบบัญชีของตัวเองได้", 400);
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    // Deactivate instead of delete to preserve lead/follow-up history integrity.
    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
