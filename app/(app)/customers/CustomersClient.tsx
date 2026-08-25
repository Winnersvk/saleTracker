"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/lib/types";
import { CUSTOMER_SEGMENT_LABELS, CUSTOMER_TYPE_LABELS } from "@/lib/pipeline";
import { Badge, Card } from "@/components/ui";
import CustomerDrawer from "@/components/CustomerDrawer";

const TYPE_BADGE: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-700 border-sky-200",
  EXISTING: "bg-slate-100 text-slate-700 border-slate-200",
  REPEAT: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PAGE_SIZE = 50;

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/customers").then((r) => r.json());
    setCustomers(res.customers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (term) {
        const hay = `${c.name} ${c.companyName ?? ""} ${c.phone ?? ""} ${c.customerCode}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (typeFilter && c.customerType !== typeFilter) return false;
      if (segmentFilter && c.segment !== segmentFilter) return false;
      return true;
    });
  }, [customers, search, typeFilter, segmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, segmentFilter]);

  function openCreate() {
    setSelectedId(null);
    setDrawerOpen(true);
  }
  function openEdit(id: string) {
    setSelectedId(id);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">ลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            พบ {filtered.length.toLocaleString()} ราย จากทั้งหมด {customers.length.toLocaleString()} ราย
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary-hover"
        >
          + เพิ่มลูกค้าใหม่
        </button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, บริษัท, เบอร์โทร, รหัสลูกค้า..."
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">ทุกประเภท</option>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">ทุกกลุ่ม</option>
            {Object.entries(CUSTOMER_SEGMENT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3">รหัส</th>
                <th className="py-2.5 px-3">ชื่อลูกค้า</th>
                <th className="py-2.5 px-3">ประเภท</th>
                <th className="py-2.5 px-3">กลุ่ม</th>
                <th className="py-2.5 px-3">ติดต่อ</th>
                <th className="py-2.5 px-3">โอกาสขาย</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">ไม่พบข้อมูล</td>
                </tr>
              )}
              {!loading &&
                pageRows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openEdit(c.id)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{c.customerCode}</td>
                    <td className="py-2 px-3 max-w-[240px]">
                      <p className="font-medium text-slate-800 truncate">{c.name}</p>
                      {c.companyName && <p className="text-xs text-slate-400 truncate">{c.companyName}</p>}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <Badge className={TYPE_BADGE[c.customerType]}>
                        {CUSTOMER_TYPE_LABELS[c.customerType]}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {c.segment ? CUSTOMER_SEGMENT_LABELS[c.segment] : "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {c.phone || c.whatsapp || c.email || "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {c._count?.opportunities ?? 0} งาน
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <span className="text-slate-500">หน้า {page} จาก {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </Card>

      <CustomerDrawer
        open={drawerOpen}
        customerId={selectedId}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer();
          load();
        }}
        onDeleted={() => {
          closeDrawer();
          load();
        }}
      />
    </div>
  );
}
