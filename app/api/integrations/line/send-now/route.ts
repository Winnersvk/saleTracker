import { NextResponse } from "next/server";
import { requireAdminOrThrow, handleApiError } from "@/lib/api-helpers";
import { buildDailySummary, formatDailySummaryMessage } from "@/lib/daily-summary";
import { sendLineMessage, LineSendError } from "@/lib/line";

// Manual "send today's summary now" for testing, without waiting on the
// external cron trigger.
export async function POST() {
  try {
    await requireAdminOrThrow();
    const summary = await buildDailySummary();
    const text = formatDailySummaryMessage(summary);
    await sendLineMessage(text);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    if (err instanceof LineSendError) {
      return NextResponse.json({ error: err.message, detail: err.detail }, { status: 400 });
    }
    return handleApiError(err);
  }
}
