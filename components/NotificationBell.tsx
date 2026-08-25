"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  message: string;
  opportunityId: string;
  severity: "info" | "warning" | "danger";
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-sky-400",
  warning: "bg-amber-400",
  danger: "bg-rose-500",
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications").then((r) => r.json());
    setItems(res.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label="การแจ้งเตือน"
      >
        🔔
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-40">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">การแจ้งเตือน</span>
              {!loading && <span className="text-xs text-slate-400">{items.length} รายการ</span>}
            </div>
            <ul>
              {loading && <li className="px-4 py-6 text-center text-xs text-slate-400">กำลังโหลด...</li>}
              {!loading && items.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-slate-400">ไม่มีการแจ้งเตือน 🎉</li>
              )}
              {!loading &&
                items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push(`/opportunities?openId=${n.opportunityId}`);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-start gap-2 border-b border-slate-50 last:border-0"
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${SEVERITY_DOT[n.severity]}`} />
                      <span className="text-slate-700">{n.message}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
