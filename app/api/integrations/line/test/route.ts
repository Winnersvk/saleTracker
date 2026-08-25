import { NextResponse } from "next/server";
import { requireAdminOrThrow, handleApiError } from "@/lib/api-helpers";
import { sendLineMessage, LineSendError } from "@/lib/line";

export async function POST() {
  try {
    await requireAdminOrThrow();
    await sendLineMessage("✅ ทดสอบระบบแจ้งเตือน LINE จาก Winner Sales Tracker สำเร็จ");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof LineSendError) {
      return NextResponse.json({ error: err.message, detail: err.detail }, { status: 400 });
    }
    return handleApiError(err);
  }
}
