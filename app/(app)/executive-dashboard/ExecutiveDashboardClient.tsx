"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
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

export default function ExecutiveDashboardClient() {
  const [stats, setStats] = useState<ExecutiveDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/executive")
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

  const trendData = stats.monthlyTrend.map((m) => ({ ...m, month: m.month.slice(2) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">ธุรกิจฝ่ายขายกำลังเดินไปทางไหน</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Pipeline" value={stats.totalPipeline.toLocaleString()} />
        <StatCard label="Weighted Pipeline" value={stats.weightedPipeline.toLocaleString()} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Lead Source Performance</h2>
          <div className="overflow-x-auto">
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
          <div className="overflow-x-auto">
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
