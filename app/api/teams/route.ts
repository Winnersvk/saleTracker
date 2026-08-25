import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSessionOrThrow,
  requireAdminOrThrow,
  handleApiError,
} from "@/lib/api-helpers";
import { upsertTeamSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireSessionOrThrow();
    const teams = await prisma.team.findMany({
      include: { _count: { select: { users: true, opportunities: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ teams });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = upsertTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const team = await prisma.team.create({ data: parsed.data });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
