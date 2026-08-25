import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSessionOrThrow,
  requireAdminOrThrow,
  handleApiError,
} from "@/lib/api-helpers";
import { upsertNamedEntitySchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireSessionOrThrow();
    const lostReasons = await prisma.lostReason.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ lostReasons });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = upsertNamedEntitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const lostReason = await prisma.lostReason.create({ data: parsed.data });
    return NextResponse.json({ lostReason }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
