import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, handleApiError } from "@/lib/api-helpers";
import { createCustomerSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireSessionOrThrow();
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { opportunities: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSessionOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const count = await prisma.customer.count();
    const customerCode = `CUS-${String(count + 1).padStart(4, "0")}`;
    const customer = await prisma.customer.create({
      data: { ...parsed.data, customerCode },
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
