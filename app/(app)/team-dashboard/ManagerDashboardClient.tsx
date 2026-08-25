"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ManagerDashboardStats } from "@/lib/types";
import { STAGE_LABELS, STAGE_COLORS_HEX } from "@/lib/pipeline";
import { formatDate } from "@/lib/date";
import { Card, StatCard } from "@/components/ui";

export default function ManagerDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/manager")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
        return data;
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;
  if (error || !stats)
    return <p className="text-sm text-rose-600">{error ?? "ไม่สามารถโหลดข้อมูลได้"}</p>;

  const funnelData = stats.funnel.map((f) => ({
    name: STAGE_LABELS[f.stage],
    count: f.count,
    fill: STAGE_COLORS_HEX[f.stage],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Team Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">ทีมขายกำลังทำงานดีหรือไม่</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Lead ใหม่วันนี้" value={stats.newLeads} />
        <StatCard label="โอกาสขายที่เปิดอยู่" value={stats.openOpportunities} />
        <StatCard label="ส่งใบเสนอราคาแล้ว" value={stats.quotationSent} />
        <StatCard label="เลยกำหนดติดตาม" value={stats.overdue} tone={stats.overdue > 0 ? "danger" : "default"} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} tone="success" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Won" value={stats.won} tone="success" />
        <StatCard label="Lost" value={stats.lost} tone="danger" />
        <StatCard label="Pipeline Value (Weighted)" value={stats.pipelineValue.toLocaleString()} />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Sales Funnel</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={funnelData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={70} interval={0} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-1">เปรียบเทียบพนักงานขาย (Won Value)</h2>
        <p className="text-xs text-slate-400 mb-3">คลิกที่แท่งกราฟเพื่อดูรายละเอียดรายบุคคล</p>
        <ResponsiveContainer
          width="100%"
          height={Math.max(
            160,
            stats.salesPerformance.filter((r) => r.userId !== "unassigned").length * 40
          )}
        >
          <BarChart
            data={stats.salesPerformance.filter((r) => r.userId !== "unassigned")}
            layout="vertical"
            margin={{ left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar
              dataKey="wonValue"
              name="Won Value"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => {
                const userId = (data as { payload?: { userId?: string } }).payload?.userId;
                if (userId) router.push(`/rep/${userId}`);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Sales Performance</h2>
        <p className="text-xs text-slate-400 mb-2">คลิกที่ชื่อพนักงานเพื่อดูรายละเอียดรายบุคคล</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">พนักงาน</th>
                <th className="py-2 pr-4">Opportunity</th>
                <th className="py-2 pr-4">Quotation</th>
                <th className="py-2 pr-4">Won</th>
                <th className="py-2 pr-4">Lost</th>
                <th className="py-2 pr-4">Win Rate</th>
                <th className="py-2 pr-4">Pipeline Value</th>
                <th className="py-2 pr-4">Won Value</th>
                <th className="py-2 pr-4">เลยกำหนด</th>
                <th className="py-2 pr-4">Sales Cycle เฉลี่ย</th>
              </tr>
            </thead>
            <tbody>
              {stats.salesPerformance.map((r) => {
                const clickable = r.userId !== "unassigned";
                return (
                  <tr
                    key={r.userId}
                    onClick={() => clickable && router.push(`/rep/${r.userId}`)}
                    className={`border-b border-slate-100 last:border-0 ${
                      clickable ? "hover:bg-slate-50 cursor-pointer" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 font-medium text-slate-800">
                      {clickable ? <span className="text-primary hover:underline">{r.name}</span> : r.name}
                    </td>
                    <td className="py-2 pr-4">{r.opportunities}</td>
                    <td className="py-2 pr-4">{r.quotations}</td>
                    <td className="py-2 pr-4">{r.won}</td>
                    <td className="py-2 pr-4">{r.lost}</td>
                    <td className="py-2 pr-4">{r.winRate}%</td>
                    <td className="py-2 pr-4">{r.pipelineValue.toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.wonValue.toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.overdue}</td>
                    <td className="py-2 pr-4">
                      {r.avgSalesCycleDays != null ? `${r.avgSalesCycleDays} วัน` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink mb-3">
            No Activity Report (≥7 วัน)
          </h2>
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {stats.noActivity.map((o) => (
              <li
                key={o.id}
                onClick={() => router.push(`/opportunities?openId=${o.id}`)}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-slate-800">{o.name}</p>
                  <p className="text-xs text-slate-400">{o.customer?.name} · {o.salesOwner?.name}</p>
                </div>
                <span className="text-xs text-slate-400">
                  ล่าสุด {formatDate(o.lastActivityDate ?? o.createdAt)}
                </span>
              </li>
            ))}
            {stats.noActivity.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">ไม่มีรายการ</p>
            )}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Quotation Aging</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">ช่วงเวลา</th>
                <th className="py-2 pr-4">จำนวน</th>
                <th className="py-2 pr-4">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {stats.quotationAging.map((a) => (
                <tr key={a.bucket} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4">{a.bucket}</td>
                  <td className="py-2 pr-4">{a.count}</td>
                  <td className="py-2 pr-4">{a.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-sm font-semibold text-ink mt-5 mb-3">Lost Reasons</h2>
          <ul className="space-y-1.5">
            {stats.lostReasons.map((l) => (
              <li key={l.reason} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{l.reason}</span>
                <span className="text-slate-500">
                  {l.count} ({l.percent}%)
                </span>
              </li>
            ))}
            {stats.lostReasons.length === 0 && (
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูล Lost</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
