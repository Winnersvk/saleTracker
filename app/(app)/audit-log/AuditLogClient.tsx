"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGE_LABELS, type Stage } from "@/lib/pipeline";
import { formatDateTime } from "@/lib/date";
import { Card } from "@/components/ui";

type Entry = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  field: string;
  previousValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy?: { id: string; name: string } | null;
};

function displayValue(field: string, value: string | null) {
  if (!value) return "-";
  if (field === "stage" && value in STAGE_LABELS) return STAGE_LABELS[value as Stage];
  return value;
}

export default function AuditLogClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit-log")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
        return data;
      })
      .then((data) => setEntries(data.entries ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          ประวัติการเปลี่ยนแปลงข้อมูลสำคัญ (Stage, Sales Owner, Won/Lost)
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3">เวลา</th>
                <th className="py-2.5 px-3">รายการ</th>
                <th className="py-2.5 px-3">ฟิลด์</th>
                <th className="py-2.5 px-3">จาก</th>
                <th className="py-2.5 px-3">เป็น</th>
                <th className="py-2.5 px-3">โดย</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">กำลังโหลดข้อมูล...</td></tr>
              )}
              {error && (
                <tr><td colSpan={6} className="text-center py-10 text-rose-600">{error}</td></tr>
              )}
              {!loading && !error && entries.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">ยังไม่มีข้อมูล</td></tr>
              )}
              {!loading &&
                entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500">{formatDateTime(e.changedAt)}</td>
                    <td className="py-2 px-3">
                      {e.entityType === "Opportunity" ? (
                        <Link href={`/opportunities?openId=${e.entityId}`} className="text-blue-600 hover:underline">
                          {e.entityLabel}
                        </Link>
                      ) : (
                        e.entityLabel
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{e.field}</td>
                    <td className="py-2 px-3 text-slate-500">{displayValue(e.field, e.previousValue)}</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{displayValue(e.field, e.newValue)}</td>
                    <td className="py-2 px-3 text-slate-500">{e.changedBy?.name ?? "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
