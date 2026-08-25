"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  Customer,
  JobType,
  Channel,
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
  ACTIVITY_TYPE_LABELS,
  QUOTATION_STATUS_LABELS,
  WINFLOW_STAGE_ORDER,
  WINFLOW_STAGE_LABELS,
  getOverdueTier,
  OVERDUE_TIER_LABELS,
  OVERDUE_TIER_COLORS,
} from "@/lib/pipeline";
import { formatDate, formatDateTime, toDateInputValue } from "@/lib/date";
import { Badge } from "@/components/ui";

type Props = {
  open: boolean;
  opportunityId: string | null;
  customers: Customer[];
  jobTypes: JobType[];
  channels: Channel[];
  leadSources: LeadSource[];
  lostReasons: LostReason[];
  users: UserRecord[];
  currentUserId: string;
  canReassign: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

type FormState = {
  name: string;
  customerId: string;
  salesOwnerId: string;
  jobTypeId: string;
  description: string;
  quantity: string;
  estimatedSize: string;
  requiredDate: string;
  installationRequired: boolean;
  location: string;
  budget: string;
  leadSourceId: string;
  channelId: string;
  temperature: string;
  estimatedValue: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  nextAction: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  customerId: "",
  salesOwnerId: "",
  jobTypeId: "",
  description: "",
  quantity: "",
  estimatedSize: "",
  requiredDate: "",
  installationRequired: false,
  location: "",
  budget: "",
  leadSourceId: "",
  channelId: "",
  temperature: "WARM",
  estimatedValue: "",
  nextFollowUpDate: "",
  nextFollowUpTime: "",
  nextAction: "",
  notes: "",
};

export default function OpportunityDrawer({
  open,
  opportunityId,
  customers,
  jobTypes,
  channels,
  leadSources,
  lostReasons,
  users,
  currentUserId,
  canReassign,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stageDraft, setStageDraft] = useState("");
  const [lostReasonId, setLostReasonId] = useState("");
  const [lostRemark, setLostRemark] = useState("");
  const [onHoldReason, setOnHoldReason] = useState("");
  const [stageSaving, setStageSaving] = useState(false);

  const [actType, setActType] = useState("FOLLOW_UP");
  const [actNote, setActNote] = useState("");
  const [actNextDate, setActNextDate] = useState("");
  const [actResultStage, setActResultStage] = useState("");
  const [actSaving, setActSaving] = useState(false);

  const [qNo, setQNo] = useState("");
  const [qDate, setQDate] = useState("");
  const [qAmount, setQAmount] = useState("");
  const [qSaving, setQSaving] = useState(false);

  const [reassignTo, setReassignTo] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignSaving, setReassignSaving] = useState(false);

  const [winflowJobNo, setWinflowJobNo] = useState("");

  async function reload() {
    if (!opportunityId) return;
    const data = await fetch(`/api/opportunities/${opportunityId}`).then((r) => r.json());
    setOpportunity(data.opportunity);
  }

  useEffect(() => {
    if (!open) return;
    setError(null);
    setActNote("");
    setActNextDate("");
    setActResultStage("");
    setQNo("");
    setQDate("");
    setQAmount("");
    setReassignTo("");
    setReassignReason("");
    setWinflowJobNo("");
    if (opportunityId) {
      setLoading(true);
      fetch(`/api/opportunities/${opportunityId}`)
        .then((res) => res.json())
        .then((data) => {
          const o: Opportunity = data.opportunity;
          setOpportunity(o);
          setStageDraft(o.stage);
          setLostReasonId(o.lostReasonId ?? "");
          setLostRemark(o.lostRemark ?? "");
          setOnHoldReason(o.onHoldReason ?? "");
          setForm({
            name: o.name,
            customerId: o.customerId,
            salesOwnerId: o.salesOwnerId ?? "",
            jobTypeId: o.jobTypeId ?? "",
            description: o.description ?? "",
            quantity: o.quantity ?? "",
            estimatedSize: o.estimatedSize ?? "",
            requiredDate: toDateInputValue(o.requiredDate),
            installationRequired: o.installationRequired,
            location: o.location ?? "",
            budget: o.budget?.toString() ?? "",
            leadSourceId: o.leadSourceId ?? "",
            channelId: o.channelId ?? "",
            temperature: o.temperature,
            estimatedValue: o.estimatedValue?.toString() ?? "",
            nextFollowUpDate: toDateInputValue(o.nextFollowUpDate),
            nextFollowUpTime: o.nextFollowUpTime ?? "",
            nextAction: o.nextAction ?? "",
            notes: o.notes ?? "",
          });
        })
        .finally(() => setLoading(false));
    } else {
      setOpportunity(null);
      setStageDraft("NEW_LEAD");
      setForm({ ...emptyForm, salesOwnerId: currentUserId });
    }
  }, [open, opportunityId, currentUserId]);

  if (!open) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        customerId: form.customerId,
        salesOwnerId: form.salesOwnerId || null,
        jobTypeId: form.jobTypeId || null,
        description: form.description || null,
        quantity: form.quantity || null,
        estimatedSize: form.estimatedSize || null,
        requiredDate: form.requiredDate || null,
        installationRequired: form.installationRequired,
        location: form.location || null,
        budget: form.budget ? Number(form.budget) : null,
        leadSourceId: form.leadSourceId || null,
        channelId: form.channelId || null,
        temperature: form.temperature,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
        nextFollowUpDate: form.nextFollowUpDate || null,
        nextFollowUpTime: form.nextFollowUpTime || null,
        nextAction: form.nextAction || null,
        notes: form.notes || null,
      };
      const res = await fetch(
        opportunityId ? `/api/opportunities/${opportunityId}` : "/api/opportunities",
        {
          method: opportunityId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange() {
    if (!opportunityId || !opportunity) return;
    if (stageDraft === "LOST" && !lostReasonId) {
      setError("กรุณาระบุ Lost Reason");
      return;
    }
    setStageSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: stageDraft,
          lostReasonId: stageDraft === "LOST" ? lostReasonId : undefined,
          lostRemark: stageDraft === "LOST" ? lostRemark : undefined,
          onHoldReason: stageDraft === "ON_HOLD" ? onHoldReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }
      await reload();
      onSaved();
    } finally {
      setStageSaving(false);
    }
  }

  async function handleDelete() {
    if (!opportunityId) return;
    if (!confirm(`ต้องการลบโอกาสขาย "${form.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/opportunities/${opportunityId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    onDeleted();
  }

  async function handleAddActivity(e: FormEvent) {
    e.preventDefault();
    if (!opportunityId) return;
    setActSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: actType,
          note: actNote || null,
          nextFollowUpDate: actNextDate || null,
          resultStage: actResultStage || null,
        }),
      });
      if (res.ok) {
        setActNote("");
        setActNextDate("");
        setActResultStage("");
        await reload();
        onSaved();
      }
    } finally {
      setActSaving(false);
    }
  }

  async function handleAddQuotation(e: FormEvent) {
    e.preventDefault();
    if (!opportunityId || !qAmount) return;
    setQSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationNo: qNo || null,
          quotationDate: qDate || null,
          amount: Number(qAmount),
          status: "SENT",
        }),
      });
      if (res.ok) {
        setQNo("");
        setQDate("");
        setQAmount("");
        await reload();
        onSaved();
      }
    } finally {
      setQSaving(false);
    }
  }

  async function acceptQuotation(qid: string) {
    if (!opportunityId) return;
    await fetch(`/api/opportunities/${opportunityId}/quotations/${qid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAccepted: true, status: "APPROVED" }),
    });
    await reload();
    onSaved();
  }

  async function handleReassign(e: FormEvent) {
    e.preventDefault();
    if (!opportunityId || !reassignTo) return;
    setReassignSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: reassignTo, reason: reassignReason || null }),
      });
      if (res.ok) {
        setReassignTo("");
        setReassignReason("");
        await reload();
        onSaved();
      }
    } finally {
      setReassignSaving(false);
    }
  }

  async function createWinflowJob() {
    if (!opportunityId) return;
    await fetch(`/api/opportunities/${opportunityId}/winflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobNo: winflowJobNo || null }),
    });
    await reload();
  }

  async function updateWinflowStage(stage: string) {
    if (!opportunityId) return;
    await fetch(`/api/opportunities/${opportunityId}/winflow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await reload();
  }

  const overdueTier = opportunity?.overdueDays != null ? getOverdueTier(opportunity.overdueDays) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {opportunityId ? form.name || "รายละเอียดโอกาสขาย" : "เพิ่มโอกาสขายใหม่"}
            </h2>
            {opportunity && (
              <p className="text-xs text-slate-400 mt-0.5">
                {opportunity.customer?.customerCode} · {opportunity.customer?.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {opportunityId && opportunity && (
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={stageDraft}
                  onChange={(e) => setStageDraft(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
                >
                  {STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
                <button
                  onClick={handleStageChange}
                  disabled={stageSaving || stageDraft === opportunity.stage}
                  className="rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40"
                >
                  {stageSaving ? "กำลังบันทึก..." : "เปลี่ยนสถานะ"}
                </button>
                <Badge className={STAGE_COLORS[opportunity.stage]}>
                  ปัจจุบัน: {STAGE_LABELS[opportunity.stage]}
                </Badge>
                {overdueTier && (
                  <Badge className={OVERDUE_TIER_COLORS[overdueTier]}>
                    {OVERDUE_TIER_LABELS[overdueTier]}
                  </Badge>
                )}
              </div>
              {stageDraft === "LOST" && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={lostReasonId}
                    onChange={(e) => setLostReasonId(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="">เลือก Lost Reason *</option>
                    {lostReasons.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <input
                    value={lostRemark}
                    onChange={(e) => setLostRemark(e.target.value)}
                    placeholder="หมายเหตุเพิ่มเติม"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </div>
              )}
              {stageDraft === "ON_HOLD" && (
                <input
                  value={onHoldReason}
                  onChange={(e) => setOnHoldReason(e.target.value)}
                  placeholder="เหตุผลที่พักโครงการ"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                />
              )}
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                <span>Probability: <b className="text-slate-700">{opportunity.probability}%</b></span>
                <span>Weighted: <b className="text-slate-700">{opportunity.weightedValue?.toLocaleString()}</b></span>
                <span>ติดตามล่าสุด: <b className="text-slate-700">{formatDate(opportunity.lastActivityDate)}</b></span>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : (
            <form id="opp-form" onSubmit={handleSave} className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">พื้นฐาน</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่องาน *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ลูกค้า *</label>
                  <select
                    required
                    value={form.customerId}
                    onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">เลือกลูกค้า</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.customerCode} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ผู้ดูแล (Sales Owner)</label>
                  <select
                    value={form.salesOwnerId}
                    onChange={(e) => setForm((f) => ({ ...f, salesOwnerId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">ไม่ระบุ</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ประเภทงาน</label>
                  <select
                    value={form.jobTypeId}
                    onChange={(e) => setForm((f) => ({ ...f, jobTypeId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">ไม่ระบุ</option>
                    {jobTypes.map((j) => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">Requirement</p>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="รายละเอียดงาน"
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">จำนวน</label>
                  <input
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ขนาดโดยประมาณ</label>
                  <input
                    value={form.estimatedSize}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedSize: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">วันที่ต้องการงาน</label>
                  <input
                    type="date"
                    value={form.requiredDate}
                    onChange={(e) => setForm((f) => ({ ...f, requiredDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">สถานที่ติดตั้ง</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                  <input
                    type="checkbox"
                    checked={form.installationRequired}
                    onChange={(e) => setForm((f) => ({ ...f, installationRequired: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  ต้องติดตั้งหน้างาน
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">งบประมาณลูกค้า</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">Sales</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lead Source</label>
                  <select
                    value={form.leadSourceId}
                    onChange={(e) => setForm((f) => ({ ...f, leadSourceId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">ไม่ระบุ</option>
                    {leadSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact Channel</label>
                  <select
                    value={form.channelId}
                    onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">ไม่ระบุ</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Temperature</label>
                  <select
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {Object.entries(TEMPERATURE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Value</label>
                <input
                  type="number"
                  value={form.estimatedValue}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">Tracking</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">นัดติดตามครั้งถัดไป</label>
                  <input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextFollowUpDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">เวลา</label>
                  <input
                    type="time"
                    value={form.nextFollowUpTime}
                    onChange={(e) => setForm((f) => ({ ...f, nextFollowUpTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Next Action</label>
                <input
                  value={form.nextAction}
                  onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                  placeholder="เช่น โทรถามผล, ขอ Artwork, นัดสำรวจหน้างาน"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          )}

          {opportunityId && opportunity && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  ใบเสนอราคา ({opportunity.quotations?.length ?? 0})
                </h3>
                <form onSubmit={handleAddQuotation} className="grid grid-cols-4 gap-2 mb-3">
                  <input
                    value={qNo}
                    onChange={(e) => setQNo(e.target.value)}
                    placeholder="เลขที่ QT"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  />
                  <input
                    type="date"
                    value={qDate}
                    onChange={(e) => setQDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    value={qAmount}
                    onChange={(e) => setQAmount(e.target.value)}
                    placeholder="มูลค่า *"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={qSaving || !qAmount}
                    className="rounded-lg bg-slate-900 text-white text-xs font-medium px-2 py-1.5 hover:bg-slate-700 disabled:opacity-40"
                  >
                    + เพิ่ม QT
                  </button>
                </form>
                <ul className="space-y-1.5">
                  {(opportunity.quotations ?? []).map((q) => (
                    <li
                      key={q.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        q.isAccepted ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                      }`}
                    >
                      <span>
                        {q.quotationNo || "ไม่ระบุเลขที่"} — {q.amount.toLocaleString()} ({formatDate(q.quotationDate)})
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          {QUOTATION_STATUS_LABELS[q.status]}
                        </Badge>
                        {q.isAccepted ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Accepted</Badge>
                        ) : (
                          <button
                            onClick={() => acceptQuotation(q.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            ทำเครื่องหมายว่ายอมรับ
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {(opportunity.quotations ?? []).length === 0 && (
                    <p className="text-xs text-slate-400">ยังไม่มีใบเสนอราคา</p>
                  )}
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Activity Timeline ({opportunity.activities?.length ?? 0})
                </h3>
                <form onSubmit={handleAddActivity} className="space-y-2 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={actType}
                      onChange={(e) => setActType(e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                    >
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <select
                      value={actResultStage}
                      onChange={(e) => setActResultStage(e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">ไม่เปลี่ยนสถานะ</option>
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>→ {STAGE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={actNote}
                    onChange={(e) => setActNote(e.target.value)}
                    placeholder="บันทึกการติดต่อ..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={actNextDate}
                      onChange={(e) => setActNextDate(e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      title="นัดติดตามครั้งถัดไป"
                    />
                    <button
                      type="submit"
                      disabled={actSaving}
                      className="rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
                    >
                      {actSaving ? "กำลังบันทึก..." : "+ เพิ่ม Activity"}
                    </button>
                  </div>
                </form>
                <ul className="space-y-3">
                  {(opportunity.activities ?? []).map((a) => (
                    <li key={a.id} className="text-sm border-l-2 border-slate-200 pl-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">{formatDateTime(a.occurredAt)}</span>
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          {ACTIVITY_TYPE_LABELS[a.type]}
                        </Badge>
                        {a.createdBy && (
                          <span className="text-xs text-slate-400">โดย {a.createdBy.name}</span>
                        )}
                      </div>
                      {a.note && <p className="text-slate-700 mt-0.5">{a.note}</p>}
                    </li>
                  ))}
                  {(opportunity.activities ?? []).length === 0 && (
                    <p className="text-xs text-slate-400">ยังไม่มีกิจกรรม</p>
                  )}
                </ul>
              </div>

              {opportunity.stage === "WON" && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">WINFLOW</h3>
                  {opportunity.winflowJob ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">
                        Job No: {opportunity.winflowJob.jobNo || "-"}
                      </p>
                      <select
                        value={opportunity.winflowJob.stage}
                        onChange={(e) => updateWinflowStage(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                      >
                        {WINFLOW_STAGE_ORDER.map((s) => (
                          <option key={s} value={s}>{WINFLOW_STAGE_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={winflowJobNo}
                        onChange={(e) => setWinflowJobNo(e.target.value)}
                        placeholder="Job No. (ถ้ามี)"
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs flex-1"
                      />
                      <button
                        onClick={createWinflowJob}
                        className="rounded-lg bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-emerald-700"
                      >
                        สร้างงาน WINFLOW
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canReassign && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">มอบหมายใหม่</h3>
                  <form onSubmit={handleReassign} className="flex gap-2">
                    <select
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">เลือกพนักงานขาย</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <input
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      placeholder="เหตุผล"
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={reassignSaving || !reassignTo}
                      className="rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40"
                    >
                      โอนงาน
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
          {opportunityId ? (
            <button onClick={handleDelete} className="text-sm text-rose-600 hover:text-rose-800 font-medium">
              ลบโอกาสขาย
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ปิด
            </button>
            <button
              form="opp-form"
              type="submit"
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
