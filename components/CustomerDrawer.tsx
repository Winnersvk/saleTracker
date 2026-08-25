"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { Customer } from "@/lib/types";
import {
  CUSTOMER_SEGMENT_LABELS,
  CUSTOMER_TYPE_LABELS,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/lib/pipeline";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/date";

type Props = {
  open: boolean;
  customerId: string | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

type FormState = {
  name: string;
  companyName: string;
  customerType: string;
  segment: string;
  peakCustomerId: string;
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp: string;
  line: string;
  facebook: string;
  email: string;
  address: string;
  district: string;
  province: string;
  country: string;
};

const emptyForm: FormState = {
  name: "",
  companyName: "",
  customerType: "NEW",
  segment: "",
  peakCustomerId: "",
  contactPerson: "",
  position: "",
  phone: "",
  whatsapp: "",
  line: "",
  facebook: "",
  email: "",
  address: "",
  district: "",
  province: "",
  country: "",
};

export default function CustomerDrawer({
  open,
  customerId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [opportunities, setOpportunities] = useState<
    { id: string; name: string; stage: string; estimatedValue: number | null }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (customerId) {
      setLoading(true);
      fetch(`/api/customers/${customerId}`)
        .then((res) => res.json())
        .then((data) => {
          const c: Customer & { opportunities?: typeof opportunities } = data.customer;
          setCustomer(c);
          setOpportunities(data.customer.opportunities ?? []);
          setForm({
            name: c.name,
            companyName: c.companyName ?? "",
            customerType: c.customerType,
            segment: c.segment ?? "",
            peakCustomerId: c.peakCustomerId ?? "",
            contactPerson: c.contactPerson ?? "",
            position: c.position ?? "",
            phone: c.phone ?? "",
            whatsapp: c.whatsapp ?? "",
            line: c.line ?? "",
            facebook: c.facebook ?? "",
            email: c.email ?? "",
            address: c.address ?? "",
            district: c.district ?? "",
            province: c.province ?? "",
            country: c.country ?? "",
          });
        })
        .finally(() => setLoading(false));
    } else {
      setCustomer(null);
      setOpportunities([]);
      setForm(emptyForm);
    }
  }, [open, customerId]);

  if (!open) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        companyName: form.companyName || null,
        customerType: form.customerType || undefined,
        segment: form.segment || null,
        peakCustomerId: form.peakCustomerId || null,
        contactPerson: form.contactPerson || null,
        position: form.position || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        line: form.line || null,
        facebook: form.facebook || null,
        email: form.email || null,
        address: form.address || null,
        district: form.district || null,
        province: form.province || null,
        country: form.country || null,
      };
      const res = await fetch(
        customerId ? `/api/customers/${customerId}` : "/api/customers",
        {
          method: customerId ? "PATCH" : "POST",
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

  async function handleDelete() {
    if (!customerId) return;
    if (!confirm(`ต้องการลบลูกค้า "${form.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    onDeleted();
  }

  const field = (label: string, key: keyof FormState, type = "text") => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-ink">
            {customerId ? `ลูกค้า ${customer?.customerCode ?? ""}` : "เพิ่มลูกค้าใหม่"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <p className="text-sm text-slate-500">กำลังโหลด...</p>
          ) : (
            <form id="customer-form" onSubmit={handleSave} className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                ข้อมูลระบุตัวตน
              </p>
              {field("ชื่อลูกค้า *", "name")}
              {field("ชื่อบริษัท", "companyName")}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ประเภทลูกค้า</label>
                  <select
                    value={form.customerType}
                    onChange={(e) => setForm((f) => ({ ...f, customerType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {Object.entries(CUSTOMER_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">กลุ่มลูกค้า</label>
                  <select
                    value={form.segment}
                    onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">ไม่ระบุ</option>
                    {Object.entries(CUSTOMER_SEGMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              {field("PEAK Customer ID", "peakCustomerId")}

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">
                ผู้ติดต่อ
              </p>
              <div className="grid grid-cols-2 gap-3">
                {field("ชื่อผู้ติดต่อ", "contactPerson")}
                {field("ตำแหน่ง", "position")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("เบอร์โทร", "phone")}
                {field("อีเมล", "email")}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field("WhatsApp", "whatsapp")}
                {field("LINE", "line")}
                {field("Facebook", "facebook")}
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">
                ที่อยู่
              </p>
              {field("ที่อยู่", "address")}
              <div className="grid grid-cols-3 gap-3">
                {field("อำเภอ/เขต", "district")}
                {field("จังหวัด", "province")}
                {field("ประเทศ", "country")}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          )}

          {customerId && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-ink mb-3">
                โอกาสขาย ({opportunities.length})
              </h3>
              <ul className="space-y-2">
                {opportunities.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/opportunities?openId=${o.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <span className="text-slate-800">{o.name}</span>
                      <Badge className={STAGE_COLORS[o.stage as keyof typeof STAGE_COLORS]}>
                        {STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS]}
                      </Badge>
                    </Link>
                  </li>
                ))}
                {opportunities.length === 0 && (
                  <p className="text-xs text-slate-400">ยังไม่มีโอกาสขาย</p>
                )}
              </ul>
              {customer && (
                <p className="text-xs text-slate-400 mt-3">
                  ลูกค้าตั้งแต่ {formatDate(customer.createdAt)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
          {customerId ? (
            <button onClick={handleDelete} className="text-sm text-rose-600 hover:text-rose-800 font-medium">
              ลบลูกค้า
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface"
            >
              ยกเลิก
            </button>
            <button
              form="customer-form"
              type="submit"
              disabled={saving || loading}
              className="rounded-full bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
