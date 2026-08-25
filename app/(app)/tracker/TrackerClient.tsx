"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel, JobType, Lead, UserRecord } from "@/lib/types";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/labels";
import { daysSince, formatDate } from "@/lib/date";
import { Badge, Card } from "@/components/ui";
import LeadDrawer from "@/components/LeadDrawer";

const PAGE_SIZE = 50;

type SortKey = "createdAt" | "name" | "contactStartDate" | "nextFollowUpDate";

export default function TrackerClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [repFilter, setRepFilter] = useState("");
  const [doneFilter, setDoneFilter] = useState<"all" | "open" | "done">(
    "open"
  );
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [leadsRes, jtRes, chRes, usersRes, meRes] = await Promise.all([
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/job-types").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setLeads(leadsRes.leads ?? []);
    setJobTypes(jtRes.jobTypes ?? []);
    setChannels(chRes.channels ?? []);
    setUsers(usersRes.users ?? []);
    setCurrentUserId(meRes.user?.id ?? "");
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let rows = leads.filter((l) => {
      if (term) {
        const hay = `${l.name} ${l.notes ?? ""} ${l.phone ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (statusFilter && l.status !== statusFilter) return false;
      if (jobTypeFilter && l.jobTypeId !== jobTypeFilter) return false;
      if (channelFilter && l.channelId !== channelFilter) return false;
      if (priorityFilter && l.priority !== priorityFilter) return false;
      if (repFilter && l.assignedToId !== repFilter) return false;
      if (doneFilter === "open" && l.isDone) return false;
      if (doneFilter === "done" && !l.isDone) return false;
      if (overdueOnly) {
        if (l.isDone) return false;
        if (!l.nextFollowUpDate) return false;
        if (new Date(l.nextFollowUpDate) >= today) return false;
      }
      return true;
    });

    rows = rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name;
        bv = b.name;
      } else {
        av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
        bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [
    leads,
    search,
    statusFilter,
    jobTypeFilter,
    channelFilter,
    priorityFilter,
    repFilter,
    doneFilter,
    overdueOnly,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    jobTypeFilter,
    channelFilter,
    priorityFilter,
    repFilter,
    doneFilter,
    overdueOnly,
  ]);

  function openCreate() {
    setSelectedLeadId(null);
    setDrawerOpen(true);
  }

  function openEdit(id: string) {
    setSelectedLeadId(id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedLeadId(null);
  }

  function onSaved() {
    closeDrawer();
    loadAll();
  }

  function onDeleted() {
    closeDrawer();
    loadAll();
  }

  async function toggleDone(lead: Lead) {
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !lead.isDone }),
    });
    loadAll();
  }

  function exportCsv() {
    const headers = [
      "ลูกค้า/งาน",
      "เบอร์โทร",
      "ประเภทงาน",
      "ช่องทาง",
      "วันที่เริ่มติดต่อ",
      "การแจ้งราคา",
      "สถานะ",
      "ความสำคัญ",
      "จำนวนครั้งที่ติดตาม",
      "นัดติดตามถัดไป",
      "ผู้ดูแล",
      "หมายเหตุ",
      "เสร็จแล้ว",
    ];
    const rows = filtered.map((l) => [
      l.name,
      l.phone ?? "",
      l.jobType?.name ?? "",
      l.channel?.name ?? "",
      l.contactStartDate ? formatDate(l.contactStartDate) : "",
      l.priceNotifyMethod ?? "",
      STATUS_LABELS[l.status] ?? l.status,
      PRIORITY_LABELS[l.priority] ?? l.priority,
      String(l._count?.followUps ?? 0),
      l.nextFollowUpDate ? formatDate(l.nextFollowUpDate) : "",
      l.assignedTo?.name ?? "",
      (l.notes ?? "").replace(/\n/g, " "),
      l.isDone ? "เสร็จแล้ว" : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `winner-sale-tracker-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectClass =
    "rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            ตารางติดตามงานขาย
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            พบ {filtered.length.toLocaleString()} รายการ จากทั้งหมด{" "}
            {leads.length.toLocaleString()} รายการ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ⬇ ส่งออก CSV
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + เพิ่มงานใหม่
          </button>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, หมายเหตุ..."
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={doneFilter}
            onChange={(e) => setDoneFilter(e.target.value as "all" | "open" | "done")}
            className={selectClass}
          >
            <option value="open">ยังไม่เสร็จ</option>
            <option value="done">เสร็จแล้ว</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกสถานะ</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกประเภทงาน</option>
            {jobTypes.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกช่องทาง</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกความสำคัญ</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">ทุกคน</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
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
            <option value="createdAt:asc">เก่าสุดก่อน</option>
            <option value="name:asc">ชื่อ ก-ฮ</option>
            <option value="nextFollowUpDate:asc">นัดติดตามใกล้สุด</option>
            <option value="contactStartDate:desc">วันที่ติดต่อล่าสุด</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">ลูกค้า / งาน</th>
                <th className="py-2.5 px-3">ประเภทงาน</th>
                <th className="py-2.5 px-3">ช่องทาง</th>
                <th className="py-2.5 px-3">วันที่เริ่มติดต่อ</th>
                <th className="py-2.5 px-3">ผ่านมา(วัน)</th>
                <th className="py-2.5 px-3">สถานะ</th>
                <th className="py-2.5 px-3">ความสำคัญ</th>
                <th className="py-2.5 px-3">ติดตาม</th>
                <th className="py-2.5 px-3">นัดถัดไป</th>
                <th className="py-2.5 px-3">ผู้ดูแล</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((l) => {
                  const overdue =
                    !l.isDone &&
                    l.nextFollowUpDate &&
                    new Date(l.nextFollowUpDate) <
                      new Date(new Date().setHours(0, 0, 0, 0));
                  const dueToday =
                    !l.isDone &&
                    l.nextFollowUpDate &&
                    formatDate(l.nextFollowUpDate) === formatDate(new Date());
                  const rowClass = l.isDone
                    ? "opacity-50"
                    : overdue
                    ? "bg-rose-50/70"
                    : dueToday
                    ? "bg-amber-50/70"
                    : "";
                  const daysElapsed = daysSince(l.contactStartDate);
                  return (
                    <tr
                      key={l.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer ${rowClass}`}
                      onClick={() => openEdit(l.id)}
                    >
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={l.isDone}
                          onChange={() => toggleDone(l)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="py-2 px-3 max-w-[220px]">
                        <p
                          className={`font-medium text-slate-800 truncate ${
                            l.isDone ? "line-through" : ""
                          }`}
                        >
                          {l.name}
                        </p>
                        {l.phone && (
                          <p className="text-xs text-slate-400">{l.phone}</p>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {l.jobType?.name ?? "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {l.channel?.name ?? "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(l.contactStartDate)}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {daysElapsed !== null ? `${daysElapsed} วัน` : "-"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge className={STATUS_COLORS[l.status]}>
                          {STATUS_LABELS[l.status]}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge className={PRIORITY_COLORS[l.priority]}>
                          {PRIORITY_LABELS[l.priority]}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {l._count?.followUps ?? 0} ครั้ง
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {l.nextFollowUpDate ? (
                          <span
                            className={
                              overdue
                                ? "text-rose-600 font-medium"
                                : dueToday
                                ? "text-amber-600 font-medium"
                                : "text-slate-600"
                            }
                          >
                            {formatDate(l.nextFollowUpDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {l.assignedTo?.name ?? "-"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <span className="text-slate-500">
              หน้า {page} จาก {totalPages}
            </span>
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

      <LeadDrawer
        open={drawerOpen}
        leadId={selectedLeadId}
        jobTypes={jobTypes}
        channels={channels}
        users={users}
        currentUserId={currentUserId}
        onClose={closeDrawer}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  );
}
