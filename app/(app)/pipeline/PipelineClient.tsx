"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Channel,
  Customer,
  JobType,
  LeadSource,
  LostReason,
  Opportunity,
  Stage,
  UserRecord,
} from "@/lib/types";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  isClosedStage,
} from "@/lib/pipeline";
import { formatDate } from "@/lib/date";
import { Badge, Card } from "@/components/ui";
import OpportunityDrawer from "@/components/OpportunityDrawer";

const COLUMN_ACCENT: Record<Stage, string> = {
  NEW_LEAD: "border-t-slate-400",
  CONTACTED: "border-t-sky-400",
  REQUIREMENT: "border-t-cyan-400",
  ESTIMATING: "border-t-indigo-400",
  QUOTATION_SENT: "border-t-violet-400",
  FOLLOW_UP: "border-t-amber-400",
  NEGOTIATION: "border-t-orange-400",
  WAITING_APPROVAL: "border-t-fuchsia-400",
  WON: "border-t-emerald-400",
  LOST: "border-t-rose-400",
  ON_HOLD: "border-t-zinc-400",
};

export default function PipelineClient() {
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
  const [includeClosed, setIncludeClosed] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (!includeClosed && isClosedStage(o.stage)) return false;
      if (term) {
        const hay = `${o.name} ${o.customer?.name ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [opportunities, search, includeClosed]);

  const byStage = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    for (const s of STAGE_ORDER) map[s] = [];
    for (const o of filtered) (map[o.stage] ??= []).push(o);
    return map;
  }, [filtered]);

  async function moveStage(id: string, stage: Stage) {
    if (stage === "LOST") {
      // Lost requires a reason - hand off to the drawer instead of a blind write.
      setSelectedId(id);
      setDrawerOpen(true);
      return;
    }
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    load();
  }

  function openEdit(id: string) {
    setSelectedId(id);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedId(null);
  }

  const canReassign = currentRole === "SALES_MANAGER" || currentRole === "MANAGEMENT" || currentRole === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">ลากการ์ดเพื่อเปลี่ยน Stage</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา..."
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
              className="rounded border-slate-300"
            />
            รวม Won/Lost
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {STAGE_ORDER.filter((s) => includeClosed || !isClosedStage(s)).map((stage) => (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage((c) => (c === stage ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveStage(id, stage);
                  setDragOverStage(null);
                }}
                className={`w-72 shrink-0 rounded-2xl border-t-4 ${COLUMN_ACCENT[stage]} bg-slate-100/70 p-2 min-h-[200px] transition ${
                  dragOverStage === stage ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
                  <span className="text-xs text-slate-500 bg-white rounded-full px-2 py-0.5 border border-slate-200">
                    {byStage[stage]?.length ?? 0}
                  </span>
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto p-1">
                  {(byStage[stage] ?? []).map((o) => (
                    <Card
                      key={o.id}
                      className="p-3 cursor-pointer hover:shadow-md transition"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                      onClick={() => openEdit(o.id)}
                    >
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{o.name}</p>
                      <p className="text-xs text-slate-400 truncate">{o.customer?.name}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge className={TEMPERATURE_COLORS[o.temperature]}>
                          {TEMPERATURE_LABELS[o.temperature]}
                        </Badge>
                        {(o.weightedValue ?? 0) > 0 && (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                            {o.weightedValue?.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>{o.salesOwner?.name ?? "-"}</span>
                        <span>{o.nextFollowUpDate ? formatDate(o.nextFollowUpDate) : ""}</span>
                      </div>
                    </Card>
                  ))}
                  {(byStage[stage] ?? []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">ไม่มีงาน</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
