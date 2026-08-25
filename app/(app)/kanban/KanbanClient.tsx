"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel, JobType, Lead, LeadStatus, UserRecord } from "@/lib/types";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/labels";
import { formatDate } from "@/lib/date";
import { Badge, Card } from "@/components/ui";
import LeadDrawer from "@/components/LeadDrawer";

const COLUMNS: LeadStatus[] = [
  "QUOTING",
  "CONTACTING",
  "ORDERED",
  "NOT_ORDERED",
];

const COLUMN_ACCENT: Record<string, string> = {
  QUOTING: "border-t-amber-400",
  CONTACTING: "border-t-sky-400",
  ORDERED: "border-t-emerald-400",
  NOT_ORDERED: "border-t-rose-400",
};

export default function KanbanClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeDone, setIncludeDone] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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
    return leads.filter((l) => {
      if (!includeDone && l.isDone) return false;
      if (term && !l.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [leads, search, includeDone]);

  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of COLUMNS) map[s] = [];
    for (const l of filtered) {
      (map[l.status] ??= []).push(l);
    }
    return map;
  }, [filtered]);

  async function moveLead(leadId: string, status: LeadStatus) {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function openEdit(id: string) {
    setSelectedLeadId(id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedLeadId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            บอร์ดสถานะงาน
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ลากการ์ดเพื่อเปลี่ยนสถานะงาน
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า..."
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeDone}
              onChange={(e) => setIncludeDone(e.target.checked)}
              className="rounded border-slate-300"
            />
            รวมงานที่เสร็จแล้ว
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((status) => (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(status);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData("text/plain");
                if (leadId) moveLead(leadId, status);
                setDragOverCol(null);
              }}
              className={`rounded-2xl border-t-4 ${COLUMN_ACCENT[status]} bg-slate-100/70 p-2 min-h-[200px] transition ${
                dragOverCol === status ? "ring-2 ring-blue-400" : ""
              }`}
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <h2 className="text-sm font-semibold text-slate-700">
                  {STATUS_LABELS[status]}
                </h2>
                <span className="text-xs text-slate-500 bg-white rounded-full px-2 py-0.5 border border-slate-200">
                  {byStatus[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto p-1">
                {(byStatus[status] ?? []).map((l) => (
                  <Card
                    key={l.id}
                    className="p-3 cursor-pointer hover:shadow-md transition"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", l.id);
                    }}
                    onClick={() => openEdit(l.id)}
                  >
                    <p
                      className={`text-sm font-medium text-slate-800 line-clamp-2 ${
                        l.isDone ? "line-through opacity-60" : ""
                      }`}
                    >
                      {l.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge className={PRIORITY_COLORS[l.priority]}>
                        {PRIORITY_LABELS[l.priority]}
                      </Badge>
                      {l.jobType && (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          {l.jobType.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                      <span>{l.assignedTo?.name ?? "ไม่ระบุผู้ดูแล"}</span>
                      <span>
                        {l.nextFollowUpDate
                          ? formatDate(l.nextFollowUpDate)
                          : ""}
                      </span>
                    </div>
                  </Card>
                ))}
                {(byStatus[status] ?? []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    ไม่มีงาน
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadDrawer
        open={drawerOpen}
        leadId={selectedLeadId}
        jobTypes={jobTypes}
        channels={channels}
        users={users}
        currentUserId={currentUserId}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer();
          loadAll();
        }}
        onDeleted={() => {
          closeDrawer();
          loadAll();
        }}
      />
    </div>
  );
}
