"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ExecutiveDashboardStats } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { Card, StatCard } from "@/components/ui";
import PeriodFilter, { type Period } from "@/components/PeriodFilter";

const BAR_COLOR = "#2563eb";
const WON_COLOR = "#10b981";

export default function ExecutiveDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<ExecutiveDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>({ from: null, to: null, label: "ทั้งหมด" });
  const [repFilter, setRepFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    if (repFilter) params.set("userId", repFilter);
    fetch(`/api/dashboard/executive?${params.toString()}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
        return data;
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period, repFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;
  if (error || !stats)
    return <p className="text-sm text-rose-600">{error ?? "ไม่สามารถโหลดข้อมูลได้"}</p>;

  const trendData = stats.monthlyTrend.map((m) => ({ ...m, month: m.month.slice(2) }));
  const selectedRepName = repFilter ? stats.reps.find((r) => r.id === repFilter)?.name : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ธุรกิจฝ่ายขายกำลังเดินไปทางไหน
            {selectedRepName && <span className="text-blue-600"> · เฉพาะ {selectedRepName}</span>}
            {period.from && <span> · ช่วง {formatDate(period.from)} - {formatDate(period.to)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">พนักงานขายทุกคน</option>
            {stats.reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <PeriodFilter onChange={setPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Pipeline" value={stats.totalPipeline.toLocaleString()} hint="ปัจจุบัน (ไม่ขึ้นกับช่วงเวลา)" />
        <StatCard label="Weighted Pipeline" value={stats.weightedPipeline.toLocaleString()} hint="ปัจจุบัน (ไม่ขึ้นกับช่วงเวลา)" />
        <StatCard label="Won Value" value={stats.wonValue.toLocaleString()} tone="success" />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} tone="success" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Average Deal Size" value={stats.avgDealSize.toLocaleString()} />
        <StatCard
          label="Average Sales Cycle"
          value={stats.avgSalesCycleDays != null ? `${stats.avgSalesCycleDays} วัน` : "-"}
        />
        <StatCard label="ลูกค้าใหม่" value={stats.newCustomers} />
        <StatCard label="ลูกค้าประจำ (Repeat)" value={stats.repeatCustomers} />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">แนวโน้มรายเดือน (12 เดือนล่าสุด)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="quotationValue" name="มูลค่าใบเสนอราคา" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="wonValue" name="มูลค่า Won" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lostValue" name="มูลค่า Lost" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200} className="mt-2">
          <LineChart data={trendData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="leads" name="Lead ใหม่" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="conversionRate" name="Conversion %" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {!repFilter && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">เปรียบเทียบพนักงานขาย (Won Value)</h2>
          <p className="text-xs text-slate-400 mb-3">คลิกที่แท่งกราฟเพื่อดูรายละเอียดรายบุคคล</p>
          <ResponsiveContainer width="100%" height={Math.max(200, stats.repPerformance.length * 40)}>
            <BarChart data={stats.repPerformance} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar
                dataKey="wonValue"
                name="Won Value"
                fill={WON_COLOR}
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Lead Source Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.leadSourcePerformance} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" name="Leads" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="Won" fill={WON_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Leads</th>
                  <th className="py-2 pr-4">Quotation</th>
                  <th className="py-2 pr-4">Won</th>
                  <th className="py-2 pr-4">Win Rate</th>
                  <th className="py-2 pr-4">Won Value</th>
                </tr>
              </thead>
              <tbody>
                {stats.leadSourcePerformance.map((s) => (
                  <tr key={s.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 pr-4">{s.leads}</td>
                    <td className="py-2 pr-4">{s.quotations}</td>
                    <td className="py-2 pr-4">{s.won}</td>
                    <td className="py-2 pr-4">{s.winRate}%</td>
                    <td className="py-2 pr-4">{s.wonValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Product Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.productPerformance.slice(0, 8)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="opportunities" name="ทั้งหมด" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="Won" fill={WON_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">ประเภทงาน</th>
                  <th className="py-2 pr-4">งาน</th>
                  <th className="py-2 pr-4">Won</th>
                  <th className="py-2 pr-4">Conversion</th>
                  <th className="py-2 pr-4">Won Value</th>
                  <th className="py-2 pr-4">Avg Deal</th>
                </tr>
              </thead>
              <tbody>
                {stats.productPerformance.map((p) => (
                  <tr key={p.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2 pr-4">{p.opportunities}</td>
                    <td className="py-2 pr-4">{p.won}</td>
                    <td className="py-2 pr-4">{p.conversion}%</td>
                    <td className="py-2 pr-4">{p.wonValue.toLocaleString()}</td>
                    <td className="py-2 pr-4">{p.avgDeal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Top Customers (Won Value)</h2>
          <ul className="space-y-1.5">
            {stats.customerPerformance.topCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{c.name}</span>
                <span className="text-slate-500">
                  {c.wonValue.toLocaleString()} ({c.opportunities} งาน)
                </span>
              </li>
            ))}
            {stats.customerPerformance.topCustomers.length === 0 && (
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูล</p>
            )}
          </ul>
          <p className="text-xs text-slate-400 mt-3">
            Repeat Purchase Rate: {stats.customerPerformance.repeatPurchaseRate}%
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Dormant Customers (≥60 วัน)</h2>
          <ul className="space-y-1.5 max-h-60 overflow-y-auto">
            {stats.customerPerformance.dormantCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{c.name}</span>
                <span className="text-slate-400 text-xs">{formatDate(c.lastActivityDate)}</span>
              </li>
            ))}
            {stats.customerPerformance.dormantCustomers.length === 0 && (
              <p className="text-xs text-slate-400">ไม่มีลูกค้าที่หายไป</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
