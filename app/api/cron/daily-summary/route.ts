import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDailySummary, formatDailySummaryMessage } from "@/lib/daily-summary";
import { sendLineMessage, LineSendError } from "@/lib/line";

// Meant to be hit by an external scheduler (system cron via curl, a
// scheduled GitHub Action, Vercel Cron, etc.) once a day - see README for
// setup. This endpoint has no session/cookie to check since the caller
// isn't a logged-in browser, so it's gated by a shared secret instead.
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const queryToken = req.nextUrl.searchParams.get("secret");
  return bearer === secret || queryToken === secret;
}

async function handle(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.integrationConfig.findUnique({ where: { id: "singleton" } });
  const summary = await buildDailySummary();

  if (!config?.lineDailySummaryOn) {
    return NextResponse.json({ sent: false, reason: "daily summary disabled in Settings", summary });
  }

  try {
    const text = formatDailySummaryMessage(summary);
    await sendLineMessage(text);
    return NextResponse.json({ sent: true, summary });
  } catch (err) {
    if (err instanceof LineSendError) {
      return NextResponse.json({ sent: false, error: err.message, summary }, { status: 502 });
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
