"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SalesDashboardStats } from "@/lib/types";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  getOverdueTier,
  OVERDUE_TIER_COLORS,
} from "@/lib/pipeline";
import { formatDate } from "@/lib/date";
import { Badge, Card, StatCard } from "@/components/ui";

export default function SalesDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<SalesDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/sales")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;
  if (!stats) return <p className="text-sm text-rose-600">ไม่สามารถโหลดข้อมูลได้</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">My Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">วันนี้ฉันต้องทำอะไร</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Lead ใหม่วันนี้" value={stats.newLeadsToday} />
        <StatCard label="ต้องติดตามวันนี้" value={stats.followUpToday} tone="warning" />
        <StatCard label="เลยกำหนด" value={stats.overdue} tone={stats.overdue > 0 ? "danger" : "default"} />
        <StatCard label="Hot Deals" value={stats.hotDeals} />
        <StatCard label="รอผลใบเสนอราคา" value={stats.quotationWaiting} />
        <StatCard label="ปิดได้เดือนนี้" value={stats.wonThisMonth} tone="success" />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Today&apos;s Actions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">ลูกค้า / งาน</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Next Action</th>
                <th className="py-2 pr-4">กำหนด</th>
                <th className="py-2 pr-4">ความสำคัญ</th>
              </tr>
            </thead>
            <tbody>
              {stats.todaysActions.map((o) => {
                const overdueTier = o.overdueDays != null ? getOverdueTier(o.overdueDays) : null;
                return (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/opportunities?openId=${o.id}`)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-2 pr-4">
                      <p className="font-medium text-slate-800">{o.name}</p>
                      <p className="text-xs text-slate-400">{o.customer?.name}</p>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={STAGE_COLORS[o.stage]}>{STAGE_LABELS[o.stage]}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{o.nextAction || "-"}</td>
                    <td className="py-2 pr-4">
                      {overdueTier ? (
                        <Badge className={OVERDUE_TIER_COLORS[overdueTier]}>
                          {formatDate(o.nextFollowUpDate)}
                        </Badge>
                      ) : (
                        formatDate(o.nextFollowUpDate)
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={TEMPERATURE_COLORS[o.temperature]}>
                        {TEMPERATURE_LABELS[o.temperature]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {stats.todaysActions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    ไม่มีงานที่ต้องติดตามวันนี้ 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">My Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.pipelineByStage.map((p) => (
            <div key={p.stage} className="rounded-xl border border-slate-200 p-3">
              <Badge className={STAGE_COLORS[p.stage]}>{STAGE_LABELS[p.stage]}</Badge>
              <p className="text-lg font-semibold text-ink mt-2">{p.count}</p>
              <p className="text-xs text-slate-400">{p.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
