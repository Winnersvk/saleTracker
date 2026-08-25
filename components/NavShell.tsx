"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: "📊" },
  { href: "/tracker", label: "ตารางติดตามงาน", icon: "📋" },
  { href: "/kanban", label: "บอร์ดสถานะ", icon: "🗂️" },
  { href: "/settings", label: "ตั้งค่า", icon: "⚙️" },
];

export default function NavShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            W
          </div>
          <span className="font-semibold text-slate-900 text-sm leading-tight">
            Winner Sale
            <br />
            Tracker
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-slate-900">
              {session.name}
            </p>
            <p className="text-xs text-slate-500">
              {session.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงานขาย"}
            </p>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full text-left rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
            W
          </div>
          <span className="font-semibold text-sm">Winner Sale Tracker</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
        >
          เมนู
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed top-14 inset-x-0 bg-white border-b border-slate-200 z-30 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            ออกจากระบบ
          </button>
        </div>
      )}

      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
