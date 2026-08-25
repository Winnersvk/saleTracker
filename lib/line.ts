import { prisma } from "@/lib/prisma";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_BROADCAST_URL = "https://api.line.me/v2/bot/message/broadcast";

export async function getLineConfig() {
  return prisma.integrationConfig.findUnique({ where: { id: "singleton" } });
}

export class LineSendError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

// LINE Notify (the simple token-based service many Thai SMEs know) was
// discontinued by LINE in 2025 - this uses the LINE Messaging API instead,
// which requires a LINE Official Account and a Channel Access Token
// (configured under Settings by an Admin). If a specific target user/group
// ID is configured we push directly to it; otherwise we broadcast to
// everyone who has added the OA as a friend.
export async function sendLineMessage(text: string) {
  const config = await getLineConfig();
  if (!config?.lineChannelToken) {
    throw new LineSendError("ยังไม่ได้ตั้งค่า LINE Channel Access Token", 400, null);
  }

  const url = config.lineTargetId ? LINE_PUSH_URL : LINE_BROADCAST_URL;
  const body = config.lineTargetId
    ? { to: config.lineTargetId, messages: [{ type: "text", text }] }
    : { messages: [{ type: "text", text }] };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.lineChannelToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new LineSendError(
      `LINE API ตอบกลับผิดพลาด (${res.status})`,
      res.status,
      detail
    );
  }

  return { ok: true };
}
