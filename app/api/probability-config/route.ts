import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionOrThrow, requireExecutiveOrThrow, handleApiError } from "@/lib/api-helpers";
import { upsertProbabilityConfigSchema } from "@/lib/validators";
import { STAGE_ORDER, DEFAULT_PROBABILITY } from "@/lib/pipeline";

export async function GET() {
  try {
    await requireSessionOrThrow();
    const rows = await prisma.probabilityConfig.findMany();
    const map = new Map(rows.map((r) => [r.stage, r.percent]));
    const config = STAGE_ORDER.map((stage) => ({
      stage,
      percent: map.get(stage) ?? DEFAULT_PROBABILITY[stage],
    }));
    return NextResponse.json({ config });
  } catch (err) {
    return handleApiError(err);
  }
}

// Management/Admin only (Section 19: "ผู้บริหารสามารถปรับ Percentage Master ได้")
export async function PATCH(req: NextRequest) {
  try {
    await requireExecutiveOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = upsertProbabilityConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const { stage, percent } = parsed.data;
    const config = await prisma.probabilityConfig.upsert({
      where: { stage },
      update: { percent },
      create: { stage, percent },
    });
    return NextResponse.json({ config });
  } catch (err) {
    return handleApiError(err);
  }
}
