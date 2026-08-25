"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Channel, JobType, Lead, UserRecord } from "@/lib/types";
import {
  PRICE_NOTIFY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/lib/labels";
import { formatDateTime, toDateInputValue } from "@/lib/date";
import { Badge } from "@/components/ui";

type Props = {
  open: boolean;
  leadId: string | null; // null = create mode
  jobTypes: JobType[];
  channels: Channel[];
  users: UserRecord[];
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

type FormState = {
  name: string;
  phone: string;
  jobTypeId: string;
  channelId: string;
  contactStartDate: string;
  priceNotifyMethod: string;
  status: string;
  priority: string;
  notes: string;
  isDone: boolean;
  nextFollowUpDate: string;
  assignedToId: string;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  jobTypeId: "",
  channelId: "",
  contactStartDate: "",
  priceNotifyMethod: "",
  status: "CONTACTING",
  priority: "MEDIUM",
  notes: "",
  isDone: false,
  nextFollowUpDate: "",
  assignedToId: "",
};

export default function LeadDrawer({
  open,
  leadId,
  jobTypes,
  channels,
  users,
  currentUserId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fuNote, setFuNote] = useState("");
  const [fuResultStatus, setFuResultStatus] = useState("");
  const [fuNextDate, setFuNextDate] = useState("");
  const [fuSaving, setFuSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (leadId) {
      setLoading(true);
      fetch(`/api/leads/${leadId}`)
        .then((res) => res.json())
        .then((data) => {
          const l: Lead = data.lead;
          setLead(l);
          setForm({
            name: l.name,
            phone: l.phone ?? "",
            jobTypeId: l.jobTypeId ?? "",
            channelId: l.channelId ?? "",
            contactStartDate: toDateInputValue(l.contactStartDate),
            priceNotifyMethod: l.priceNotifyMethod ?? "",
            status: l.status,
            priority: l.priority,
            notes: l.notes ?? "",
            isDone: l.isDone,
            nextFollowUpDate: toDateInputValue(l.nextFollowUpDate),
            assignedToId: l.assignedToId ?? "",
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLead(null);
      setForm({ ...emptyForm, assignedToId: currentUserId });
    }
    setFuNote("");
    setFuResultStatus("");
    setFuNextDate("");
  }, [open, leadId, currentUserId]);

  if (!open) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        jobTypeId: form.jobTypeId || null,
        channelId: form.channelId || null,
        contactStartDate: form.contactStartDate || null,
        priceNotifyMethod: form.priceNotifyMethod || null,
        status: form.status,
        priority: form.priority,
        notes: form.notes || null,
        isDone: form.isDone,
        nextFollowUpDate: form.nextFollowUpDate || null,
        assignedToId: form.assignedToId || null,
      };
      const res = await fetch(leadId ? `/api/leads/${leadId}` : "/api/leads", {
        method: leadId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  async function handleDelete() {
    if (!leadId) return;
    if (!confirm(`ต้องการลบ "${form.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted();
    }
  }

  async function handleAddFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!leadId || !fuNote.trim()) return;
    setFuSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: fuNote,
          resultStatus: fuResultStatus || null,
          nextFollowUpDate: fuNextDate || null,
        }),
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/leads/${leadId}`).then((r) =>
          r.json()
        );
        setLead(refreshed.lead);
        if (fuResultStatus) {
          setForm((f) => ({ ...f, status: fuResultStatus }));
        }
        if (fuNextDate) {
          setForm((f) => ({ ...f, nextFollowUpDate: fuNextDate }));
        }
        setFuNote("");
        setFuResultStatus("");
        setFuNextDate("");
        onSaved();
      }
    } finally {
      setFuSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            {leadId ? "รายละเอียดงาน" : "เพิ่มงานใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : (
            <form id="lead-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ลูกค้า / งาน *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    เบอร์โทร
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ผู้ดูแล
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, assignedToId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ไม่ระบุ</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ประเภทงาน
                  </label>
                  <select
                    value={form.jobTypeId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jobTypeId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ไม่ระบุ</option>
                    {jobTypes.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ช่องทางติดต่อ
                  </label>
                  <select
                    value={form.channelId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, channelId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ไม่ระบุ</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    วันที่เริ่มติดต่อ
                  </label>
                  <input
                    type="date"
                    value={form.contactStartDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        contactStartDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    นัดติดตามครั้งถัดไป
                  </label>
                  <input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nextFollowUpDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ความสำคัญ
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    การแจ้งราคา
                  </label>
                  <select
                    value={form.priceNotifyMethod}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priceNotifyMethod: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ไม่ระบุ</option>
                    {PRICE_NOTIFY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isDone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDone: e.target.checked }))
                  }
                  className="rounded border-slate-300"
                />
                ทำเสร็จแล้ว / ปิดงาน
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          )}

          {leadId && lead && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                ประวัติการติดตาม ({lead.followUps?.length ?? 0})
              </h3>
              <form onSubmit={handleAddFollowUp} className="space-y-2 mb-4">
                <textarea
                  value={fuNote}
                  onChange={(e) => setFuNote(e.target.value)}
                  placeholder="บันทึกการติดตามครั้งนี้..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={fuResultStatus}
                    onChange={(e) => setFuResultStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ไม่เปลี่ยนสถานะ</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        → {s.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={fuNextDate}
                    onChange={(e) => setFuNextDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="นัดติดตามครั้งถัดไป"
                  />
                </div>
                <button
                  type="submit"
                  disabled={fuSaving || !fuNote.trim()}
                  className="rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
                >
                  {fuSaving ? "กำลังบันทึก..." : "+ เพิ่มบันทึกการติดตาม"}
                </button>
              </form>

              <ul className="space-y-3">
                {(lead.followUps ?? []).map((fu) => (
                  <li
                    key={fu.id}
                    className="text-sm border-l-2 border-slate-200 pl-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">
                        {formatDateTime(fu.contactedAt)}
                      </span>
                      {fu.resultStatus && (
                        <Badge className={STATUS_COLORS[fu.resultStatus]}>
                          {STATUS_LABELS[fu.resultStatus]}
                        </Badge>
                      )}
                      {fu.createdBy && (
                        <span className="text-xs text-slate-400">
                          โดย {fu.createdBy.name}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 mt-0.5">{fu.note}</p>
                  </li>
                ))}
                {(lead.followUps ?? []).length === 0 && (
                  <p className="text-xs text-slate-400">ยังไม่มีประวัติการติดตาม</p>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
          {leadId ? (
            <button
              onClick={handleDelete}
              className="text-sm text-rose-600 hover:text-rose-800 font-medium"
            >
              ลบงานนี้
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              form="lead-form"
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
