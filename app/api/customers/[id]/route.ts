import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError, ApiError } from "@/lib/api-helpers";
import { updateCustomerSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSessionOrThrow();
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        opportunities: {
          orderBy: { createdAt: "desc" },
          include: {
            jobType: true,
            salesOwner: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!customer) throw new ApiError("ไม่พบข้อมูล", 404);
    return NextResponse.json({ customer });
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
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const customer = await prisma.customer.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ customer });
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
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new ApiError("ไม่พบข้อมูล", 404);
    const inUse = await prisma.opportunity.count({ where: { customerId: id } });
    if (inUse > 0) {
      throw new ApiError("ไม่สามารถลบลูกค้าที่มีงานขายอยู่ได้", 400);
    }
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
