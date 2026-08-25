"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui";

type Config = {
  configured: boolean;
  tokenPreview: string | null;
  targetId: string | null;
  dailySummaryOn: boolean;
};

export default function LineIntegrationManager() {
  const [config, setConfig] = useState<Config | null>(null);
  const [token, setToken] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dailySummaryOn, setDailySummaryOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/integrations/line").then((r) => r.json());
    setConfig(res);
    setTargetId(res.targetId ?? "");
    setDailySummaryOn(res.dailySummaryOn ?? false);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/line", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(token && { lineChannelToken: token }),
          lineTargetId: targetId || null,
          lineDailySummaryOn: dailySummaryOn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "บันทึกไม่สำเร็จ" });
        return;
      }
      setConfig(data);
      setToken("");
      setMessage({ type: "success", text: "บันทึกการตั้งค่าแล้ว" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/line/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "ส่งทดสอบไม่สำเร็จ" });
        return;
      }
      setMessage({ type: "success", text: "ส่งข้อความทดสอบไปยัง LINE สำเร็จ" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSendNow() {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/line/send-now", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "ส่งสรุปไม่สำเร็จ" });
        return;
      }
      setMessage({ type: "success", text: "ส่งสรุปยอดขายวันนี้ไปยัง LINE แล้ว" });
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-1">แจ้งเตือน LINE - สรุปยอดขายประจำวัน</h2>
        <p className="text-xs text-slate-400 mb-4">
          ใช้ LINE Messaging API (LINE Notify ปิดให้บริการแล้ว) ต้องสร้าง LINE
          Official Account และขอ Channel Access Token เอง — ดูขั้นตอนใน README
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Channel Access Token{" "}
              {config?.configured && (
                <span className="text-slate-400">(ตั้งค่าแล้ว: {config.tokenPreview})</span>
              )}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config?.configured ? "กรอกใหม่เพื่อเปลี่ยน Token" : "วาง Channel Access Token ที่นี่"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Target User/Group ID (เว้นว่างเพื่อ Broadcast ให้ทุกคนที่แอด OA)
            </label>
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Uxxxxxxxx... หรือ Cxxxxxxxx..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={dailySummaryOn}
              onChange={(e) => setDailySummaryOn(e.target.checked)}
              className="rounded border-slate-300"
            />
            เปิดใช้งานสรุปยอดขายประจำวันอัตโนมัติ (ต้องตั้งค่า cron ภายนอกด้วย - ดู README)
          </label>

          {message && (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${
                message.type === "success"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-rose-600 bg-rose-50 border-rose-200"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config?.configured}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface disabled:opacity-50"
            >
              {testing ? "กำลังส่ง..." : "ส่งข้อความทดสอบ"}
            </button>
            <button
              type="button"
              onClick={handleSendNow}
              disabled={sending || !config?.configured}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface disabled:opacity-50"
            >
              {sending ? "กำลังส่ง..." : "ส่งสรุปวันนี้ตอนนี้"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
