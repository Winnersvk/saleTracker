"use client";

import { FormEvent, useState } from "react";
import type { Team } from "@/lib/types";
import { Card } from "@/components/ui";

export default function TeamsManager({
  teams,
  onChanged,
}: {
  teams: (Team & { _count?: { users: number; opportunities: number } })[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTeam(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setName("");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function rename(team: Team) {
    const newName = prompt("แก้ไขชื่อทีม", team.name);
    if (!newName || !newName.trim() || newName === team.name) return;
    await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    onChanged();
  }

  async function remove(team: Team) {
    if (!confirm(`ลบทีม "${team.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error ?? "ลบไม่สำเร็จ");
    onChanged();
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-ink mb-3">ทีมขาย</h2>
      <form onSubmit={addTeam} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เพิ่มทีมใหม่..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-hover disabled:opacity-60"
        >
          เพิ่ม
        </button>
      </form>
      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
      <ul className="divide-y divide-slate-100">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-800">
              {t.name}{" "}
              <span className="text-xs text-slate-400">
                ({t._count?.users ?? 0} คน, {t._count?.opportunities ?? 0} งาน)
              </span>
            </span>
            <div className="flex gap-3 text-xs">
              <button onClick={() => rename(t)} className="text-slate-500 hover:text-slate-800">แก้ไข</button>
              <button onClick={() => remove(t)} className="text-rose-500 hover:text-rose-700">ลบ</button>
            </div>
          </li>
        ))}
        {teams.length === 0 && <li className="text-xs text-slate-400 py-3">ยังไม่มีทีม</li>}
      </ul>
    </Card>
  );
}
