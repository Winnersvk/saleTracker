"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui";

type Item = { id: string; name: string; active: boolean };

export default function NamedListManager({
  title,
  items,
  apiBase,
  onChanged,
}: {
  title: string;
  items: Item[];
  apiBase: string; // e.g. "/api/job-types"
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setNewName("");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: Item) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    onChanged();
  }

  async function rename(item: Item) {
    const name = prompt("แก้ไขชื่อ", item.name);
    if (!name || !name.trim() || name === item.name) return;
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    onChanged();
  }

  async function remove(item: Item) {
    if (!confirm(`ลบ "${item.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (data.message) alert(data.message);
    onChanged();
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">{title}</h2>
      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="เพิ่มรายการใหม่..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          เพิ่ม
        </button>
      </form>
      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span
              className={item.active ? "text-slate-800" : "text-slate-400 line-through"}
            >
              {item.name}
            </span>
            <div className="flex gap-3 text-xs">
              <button
                onClick={() => rename(item)}
                className="text-slate-500 hover:text-slate-800"
              >
                แก้ไข
              </button>
              <button
                onClick={() => toggleActive(item)}
                className="text-slate-500 hover:text-slate-800"
              >
                {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
              <button
                onClick={() => remove(item)}
                className="text-rose-500 hover:text-rose-700"
              >
                ลบ
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-slate-400 py-3">ยังไม่มีรายการ</li>
        )}
      </ul>
    </Card>
  );
}
