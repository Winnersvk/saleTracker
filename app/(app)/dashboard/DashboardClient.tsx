"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, StatCard } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/labels";
import type { DashboardStats } from "@/lib/types";

const STATUS_COLORS_HEX: Record<string, string> = {
  QUOTING: "#f59e0b",
  CONTACTING: "#0ea5e9",
  ORDERED: "#10b981",
  NOT_ORDERED: "#f43f5e",
};

const BAR_COLOR = "#2563eb";
const ORDERED_COLOR = "#10b981";

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">กำลังโหลดข้อมูล...</div>;
  }
  if (error || !stats) {
    return (
      <div className="text-sm text-rose-600">
        {error ?? "ไม่สามารถโหลดข้อมูลได้"}
      </div>
    );
  }

  const statusPieData = stats.statusBreakdown.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    key: s.status,
  }));

  const jobTypeData = stats.jobTypeBreakdown.slice(0, 8).map((j) => ({
    name: j.name,
    total: j.count,
    ordered: j.ordered,
  }));

  const channelData = stats.channelBreakdown.map((c) => ({
    name: c.name,
    total: c.count,
    conversionRate: c.conversionRate,
  }));

  const trendData = stats.weeklyTrend.map((w) => ({
    week: w.weekStart.slice(5),
    count: w.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">แดชบอร์ด</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          ภาพรวมงานขายและประสิทธิภาพการติดตามลูกค้า
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="งานทั้งหมด" value={stats.total} />
        <StatCard
          label="สั่งงานแล้ว"
          value={stats.orderedTotal}
          hint={`อัตราปิดการขาย ${stats.conversionRate}%`}
          tone="success"
        />
        <StatCard
          label="เลยกำหนดติดตาม"
          value={stats.overdueCount}
          tone={stats.overdueCount > 0 ? "danger" : "default"}
          hint="ต้องติดตามด่วน"
        />
        <StatCard
          label="ครบกำหนดวันนี้"
          value={stats.dueTodayCount}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            สัดส่วนตามสถานะ
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {statusPieData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={STATUS_COLORS_HEX[entry.key] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            งานตามประเภท (Top 8) — จำนวนทั้งหมด vs สั่งงานแล้ว
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={jobTypeData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" name="ทั้งหมด" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ordered" name="สั่งงานแล้ว" fill={ORDERED_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            ประสิทธิภาพตามช่องทางติดต่อ
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" name="จำนวนงาน" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {stats.channelBreakdown.map((c) => (
              <div
                key={c.channelId ?? c.name}
                className="flex items-center justify-between text-xs text-slate-500"
              >
                <span>{c.name}</span>
                <span>
                  Conversion:{" "}
                  <span className="font-medium text-slate-700">
                    {c.conversionRate}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            งานใหม่รายสัปดาห์ (8 สัปดาห์ล่าสุด)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name="งานใหม่"
                stroke={BAR_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          อันดับพนักงานขาย
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">พนักงาน</th>
                <th className="py-2 pr-4">จำนวนงานที่ดูแล</th>
                <th className="py-2 pr-4">สั่งงานแล้ว</th>
                <th className="py-2 pr-4">อัตราปิดการขาย</th>
              </tr>
            </thead>
            <tbody>
              {stats.repLeaderboard.map((r) => (
                <tr
                  key={r.userId ?? r.name}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 pr-4 font-medium text-slate-800">
                    {r.name}
                  </td>
                  <td className="py-2 pr-4">{r.count}</td>
                  <td className="py-2 pr-4">{r.ordered}</td>
                  <td className="py-2 pr-4">{r.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
