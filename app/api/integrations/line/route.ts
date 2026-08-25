import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrThrow, handleApiError } from "@/lib/api-helpers";

const updateSchema = z.object({
  lineChannelToken: z.string().optional().nullable(),
  lineTargetId: z.string().optional().nullable(),
  lineDailySummaryOn: z.boolean().optional(),
});

// The channel access token is write-only from the browser's perspective -
// GET never echoes the real value back, only whether one is configured and
// its last 4 characters, so an admin can confirm which token is active
// without it sitting exposed in the page.
export async function GET() {
  try {
    await requireAdminOrThrow();
    const config = await prisma.integrationConfig.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({
      configured: Boolean(config?.lineChannelToken),
      tokenPreview: config?.lineChannelToken ? `••••${config.lineChannelToken.slice(-4)}` : null,
      targetId: config?.lineTargetId ?? null,
      dailySummaryOn: config?.lineDailySummaryOn ?? false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const { lineChannelToken, lineTargetId, lineDailySummaryOn } = parsed.data;
    const config = await prisma.integrationConfig.upsert({
      where: { id: "singleton" },
      update: {
        ...(lineChannelToken !== undefined && lineChannelToken !== "" && { lineChannelToken }),
        ...(lineTargetId !== undefined && { lineTargetId: lineTargetId || null }),
        ...(lineDailySummaryOn !== undefined && { lineDailySummaryOn }),
      },
      create: {
        id: "singleton",
        lineChannelToken: lineChannelToken || null,
        lineTargetId: lineTargetId || null,
        lineDailySummaryOn: lineDailySummaryOn ?? false,
      },
    });
    return NextResponse.json({
      configured: Boolean(config.lineChannelToken),
      tokenPreview: config.lineChannelToken ? `••••${config.lineChannelToken.slice(-4)}` : null,
      targetId: config.lineTargetId,
      dailySummaryOn: config.lineDailySummaryOn,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
