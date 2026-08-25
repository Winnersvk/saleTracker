"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type {
  Channel,
  Customer,
  JobType,
  LeadSource,
  LostReason,
  Opportunity,
  UserRecord,
} from "@/lib/types";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  isClosedStage,
  getOverdueTier,
  OVERDUE_TIER_COLORS,
} from "@/lib/pipeline";
import { formatDate } from "@/lib/date";
import { Badge, Card } from "@/components/ui";
import OpportunityDrawer from "@/components/OpportunityDrawer";

type SortKey = "createdAt" | "name" | "nextFollowUpDate" | "weightedValue";

export default function OpportunitiesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [openClosedFilter, setOpenClosedFilter] = useState<"open" | "closed" | "all">("open");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [oppRes, custRes, jtRes, chRes, lsRes, lrRes, usersRes, meRes] = await Promise.all([
      fetch("/api/opportunities").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/job-types").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/lead-sources").then((r) => r.json()),
      fetch("/api/lost-reasons").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setOpportunities(oppRes.opportunities ?? []);
    setCustomers(custRes.customers ?? []);
    setJobTypes(jtRes.jobTypes ?? []);
    setChannels(chRes.channels ?? []);
    setLeadSources(lsRes.leadSources ?? []);
    setLostReasons(lrRes.lostReasons ?? []);
    setUsers(usersRes.users ?? []);
    setCurrentUserId(meRes.user?.id ?? "");
    setCurrentRole(meRes.user?.role ?? "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const openId = searchParams.get("openId");
    if (openId) {
      setSelectedId(openId);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = opportunities.filter((o) => {
      if (term) {
        const hay = `${o.name} ${o.customer?.name ?? ""} ${o.notes ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (stageFilter && o.stage !== stageFilter) return false;
      if (jobTypeFilter && o.jobTypeId !== jobTypeFilter) return false;
      if (leadSourceFilter && o.leadSourceId !== leadSourceFilter) return false;
      if (ownerFilter && o.salesOwnerId !== ownerFilter) return false;
      if (openClosedFilter === "open" && isClosedStage(o.stage)) return false;
      if (openClosedFilter === "closed" && !isClosedStage(o.stage)) return false;
      if (overdueOnly && (o.overdueDays == null || o.overdueDays < 0)) return false;
      return true;
    });

    rows = rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortKey === "weightedValue") {
        av = a.weightedValue ?? 0;
        bv = b.weightedValue ?? 0;
      } else {
        const field = sortKey === "createdAt" ? a.createdAt : a.nextFollowUpDate;
        const fieldB = sortKey === "createdAt" ? b.createdAt : b.nextFollowUpDate;
        av = field ? new Date(field).getTime() : 0;
        bv = fieldB ? new Date(fieldB).getTime() : 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [
    opportunities,
    search,
    stageFilter,
    jobTypeFilter,
    leadSourceFilter,
    ownerFilter,
    openClosedFilter,
    overdueOnly,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, stageFilter, jobTypeFilter, leadSourceFilter, ownerFilter, openClosedFilter, overdueOnly]);

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
    if (searchParams.get("openId")) {
      router.replace("/opportunities");
    }
  }

  const canReassign = currentRole === "SALES_MANAGER" || currentRole === "MANAGEMENT" || currentRole === "ADMIN";

  const selectClass =
    "rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">โอกาสขาย (Opportunities)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            พบ {filtered.length.toLocaleString()} รายการ จากทั้งหมด {opportunities.length.toLocaleString()} รายการ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + เพิ่มโอกาสขายใหม่
        </button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่องาน, ลูกค้า, หมายเหตุ..."
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={openClosedFilter} onChange={(e) => setOpenClosedFilter(e.target.value as "open" | "closed" | "all")} className={selectClass}>
            <option value="open">ยังเปิดอยู่</option>
            <option value="closed">ปิดแล้ว (Won/Lost)</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectClass}>
            <option value="">ทุก Stage</option>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <select value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)} className={selectClass}>
            <option value="">ทุกประเภทงาน</option>
            {jobTypes.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
          <select value={leadSourceFilter} onChange={(e) => setLeadSourceFilter(e.target.value)} className={selectClass}>
            <option value="">ทุก Lead Source</option>
            {leadSources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={selectClass}>
            <option value="">ทุกคน</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 px-2">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            เลยกำหนดติดตาม
          </label>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":");
              setSortKey(k as SortKey);
              setSortDir(d as "asc" | "desc");
            }}
            className={selectClass}
          >
            <option value="createdAt:desc">ใหม่ล่าสุดก่อน</option>
            <option value="nextFollowUpDate:asc">นัดติดตามใกล้สุด</option>
            <option value="weightedValue:desc">Weighted Value สูงสุด</option>
            <option value="name:asc">ชื่อ ก-ฮ</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3">งาน / ลูกค้า</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Temp</th>
                <th className="py-2.5 px-3">Weighted Value</th>
                <th className="py-2.5 px-3">นัดติดตามถัดไป</th>
                <th className="py-2.5 px-3">ผู้ดูแล</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">กำลังโหลดข้อมูล...</td></tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">ไม่พบข้อมูล</td></tr>
              )}
              {!loading &&
                pageRows.map((o) => {
                  const overdueTier = o.overdueDays != null ? getOverdueTier(o.overdueDays) : null;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => openEdit(o.id)}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer ${
                        overdueTier === "critical" ? "bg-rose-50/70" : overdueTier === "today" ? "bg-amber-50/70" : ""
                      }`}
                    >
                      <td className="py-2 px-3 max-w-[260px]">
                        <p className="font-medium text-slate-800 truncate">{o.name}</p>
                        <p className="text-xs text-slate-400 truncate">{o.customer?.name}</p>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge className={STAGE_COLORS[o.stage]}>{STAGE_LABELS[o.stage]}</Badge>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge className={TEMPERATURE_COLORS[o.temperature]}>{TEMPERATURE_LABELS[o.temperature]}</Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {o.weightedValue?.toLocaleString() ?? 0}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {o.nextFollowUpDate ? (
                          <span className={overdueTier ? "font-medium" : "text-slate-600"}>
                            {formatDate(o.nextFollowUpDate)}
                            {overdueTier && (
                              <Badge className={`ml-1.5 ${OVERDUE_TIER_COLORS[overdueTier]}`}>
                                {overdueTier === "today" ? "วันนี้" : `+${o.overdueDays}วัน`}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {o.salesOwner?.name ?? "-"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <span className="text-slate-500">หน้า {page} จาก {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">ก่อนหน้า</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">ถัดไป</button>
            </div>
          </div>
        )}
      </Card>

      <OpportunityDrawer
        open={drawerOpen}
        opportunityId={selectedId}
        customers={customers}
        jobTypes={jobTypes}
        channels={channels}
        leadSources={leadSources}
        lostReasons={lostReasons}
        users={users}
        currentUserId={currentUserId}
        canReassign={canReassign}
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
