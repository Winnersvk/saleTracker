"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/pipeline";
import NotificationBell from "@/components/NotificationBell";

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "My Dashboard", icon: "📊", roles: null },
  { href: "/opportunities", label: "โอกาสขาย", icon: "📋", roles: null },
  { href: "/pipeline", label: "Pipeline", icon: "🗂️", roles: null },
  { href: "/customers", label: "ลูกค้า", icon: "🧑‍💼", roles: null },
  {
    href: "/team-dashboard",
    label: "Team Dashboard",
    icon: "👥",
    roles: ["SALES_MANAGER", "MANAGEMENT", "ADMIN"],
  },
  {
    href: "/executive-dashboard",
    label: "Executive Dashboard",
    icon: "📈",
    roles: ["MANAGEMENT", "ADMIN"],
  },
  {
    href: "/audit-log",
    label: "Audit Log",
    icon: "🕘",
    roles: ["MANAGEMENT", "ADMIN"],
  },
  { href: "/settings", label: "ตั้งค่า", icon: "⚙️", roles: ["MANAGEMENT", "ADMIN"] },
] as const;

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

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || (item.roles as readonly string[]).includes(session.role)
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white m-3 mr-0 rounded-3xl border border-slate-200/70 shadow-[0_1px_2px_rgba(37,37,37,0.04),0_12px_28px_-16px_rgba(37,37,37,0.18)] overflow-hidden">
        <div className="h-16 flex items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white text-sm font-bold shadow-[0_6px_14px_-4px_rgba(255,97,23,0.55)]">
            W
          </div>
          <span className="font-semibold text-ink text-sm leading-tight">
            Winner Sales
            <br />
            Tracker
          </span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-white shadow-[0_6px_14px_-4px_rgba(255,97,23,0.45)]"
                    : "text-slate-600 hover:bg-surface"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="px-3 py-1.5">
            <p className="text-sm font-medium text-ink">
              {session.name}
            </p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</p>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full text-left rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-surface hover:text-ink"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
            W
          </div>
          <span className="font-semibold text-sm">Winner Sales Tracker</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          >
            เมนู
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed top-14 inset-x-0 bg-white border-b border-slate-200 z-30 px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) => (
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
        <div className="hidden md:flex items-center justify-end px-8 pt-4">
          <NotificationBell />
        </div>
        <div className="p-4 md:px-8 md:pb-8 md:pt-2 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
