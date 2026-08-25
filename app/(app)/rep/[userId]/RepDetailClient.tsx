"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RepDashboardStats } from "@/lib/types";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  ACTIVITY_TYPE_LABELS,
  ROLE_LABELS,
  getOverdueTier,
  OVERDUE_TIER_COLORS,
} from "@/lib/pipeline";
import { formatDate, formatDateTime } from "@/lib/date";
import { Badge, Card, StatCard } from "@/components/ui";

export default function RepDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [stats, setStats] = useState<RepDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/rep/${userId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
        return data;
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;
  if (error || !stats) return <p className="text-sm text-rose-600">{error ?? "ไม่สามารถโหลดข้อมูลได้"}</p>;

  const { user, totals, kpis } = stats;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/team-dashboard" className="text-xs text-slate-400 hover:text-slate-600">
          ← กลับไป Team Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {user.email} · {ROLE_LABELS[user.role]}
              {user.team && ` · ${user.team.name}`}
              {!user.active && (
                <span className="ml-2 text-rose-500">(ปิดใช้งานบัญชีอยู่)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Win Rate" value={`${kpis.winRate}%`} tone="success" />
          <StatCard label="Lead Conversion" value={`${kpis.leadConversion}%`} />
          <StatCard label="Quote Conversion" value={`${kpis.quoteConversion}%`} />
          <StatCard
            label="Follow-up Completion"
            value={kpis.followUpCompletionRate != null ? `${kpis.followUpCompletionRate}%` : "-"}
            hint={`${kpis.followUpsCompleted30d} ครั้ง (30 วัน) / เลยกำหนด ${kpis.followUpsOverdue}`}
          />
          <StatCard label="Average Deal Size" value={kpis.avgDealSize.toLocaleString()} />
          <StatCard
            label="Average Sales Cycle"
            value={kpis.avgSalesCycleDays != null ? `${kpis.avgSalesCycleDays} วัน` : "-"}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          วันนี้ต้องทำอะไร
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Lead ใหม่วันนี้" value={stats.newLeadsToday} />
          <StatCard label="ต้องติดตามวันนี้" value={stats.followUpToday} tone="warning" />
          <StatCard label="เลยกำหนด" value={totals.overdue} tone={totals.overdue > 0 ? "danger" : "default"} />
          <StatCard label="Hot Deals" value={stats.hotDeals} />
          <StatCard label="รอผลใบเสนอราคา" value={stats.quotationWaiting} />
          <StatCard label="ปิดได้เดือนนี้" value={stats.wonThisMonth} tone="success" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          ภาพรวมทั้งหมด
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="โอกาสขายทั้งหมด" value={totals.opportunities} />
          <StatCard label="Won" value={totals.won} tone="success" />
          <StatCard label="Lost" value={totals.lost} tone="danger" />
          <StatCard label="Pipeline Value (Weighted)" value={totals.pipelineValue.toLocaleString()} />
          <StatCard label="Won Value" value={totals.wonValue.toLocaleString()} tone="success" />
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.pipelineByStage.map((p) => (
            <div key={p.stage} className="rounded-xl border border-slate-200 p-3">
              <Badge className={STAGE_COLORS[p.stage]}>{STAGE_LABELS[p.stage]}</Badge>
              <p className="text-lg font-semibold text-slate-900 mt-2">{p.count}</p>
              <p className="text-xs text-slate-400">{p.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Today&apos;s Actions</h2>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {stats.todaysActions.map((o) => {
              const overdueTier = o.overdueDays != null ? getOverdueTier(o.overdueDays) : null;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => router.push(`/opportunities?openId=${o.id}`)}
                    className="w-full text-left flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{o.name}</p>
                      <p className="text-xs text-slate-400 truncate">{o.customer?.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge className={TEMPERATURE_COLORS[o.temperature]}>
                        {TEMPERATURE_LABELS[o.temperature]}
                      </Badge>
                      {overdueTier && (
                        <Badge className={OVERDUE_TIER_COLORS[overdueTier]}>
                          {formatDate(o.nextFollowUpDate)}
                        </Badge>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
            {stats.todaysActions.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">ไม่มีงานที่ต้องติดตามวันนี้ 🎉</p>
            )}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">กิจกรรมล่าสุด</h2>
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentActivities.map((a) => (
              <li key={a.id} className="text-sm border-l-2 border-slate-200 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">{formatDateTime(a.occurredAt)}</span>
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                    {ACTIVITY_TYPE_LABELS[a.type]}
                  </Badge>
                </div>
                <Link
                  href={`/opportunities?openId=${a.opportunity.id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  {a.opportunity.name}
                </Link>
                {a.note && <p className="text-slate-700 mt-0.5">{a.note}</p>}
              </li>
            ))}
            {stats.recentActivities.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีกิจกรรม</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
