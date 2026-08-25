"use client";

import { FormEvent, useState } from "react";
import type { Team, UserRecord } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/pipeline";
import { Card } from "@/components/ui";

type Role = "SALES" | "SALES_MANAGER" | "MANAGEMENT" | "ADMIN";

export default function UsersManager({
  users,
  teams,
  currentUserId,
  onChanged,
}: {
  users: UserRecord[];
  teams: Team[];
  currentUserId: string;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SALES");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addUser(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, teamId: teamId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เพิ่มผู้ใช้ไม่สำเร็จ");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setRole("SALES");
      setTeamId("");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserRecord) {
    if (u.id === currentUserId) return;
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    onChanged();
  }

  async function changeRole(u: UserRecord, newRole: Role) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    onChanged();
  }

  async function changeTeam(u: UserRecord, newTeamId: string) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: newTeamId || null }),
    });
    onChanged();
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">ผู้ใช้งานระบบ</h2>
      <form
        onSubmit={addUser}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-4"
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อ"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="อีเมล"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">ไม่มีทีม</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          เพิ่มผู้ใช้
        </button>
      </form>
      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">ชื่อ</th>
              <th className="py-2 pr-4">อีเมล</th>
              <th className="py-2 pr-4">บทบาท</th>
              <th className="py-2 pr-4">ทีม</th>
              <th className="py-2 pr-4">งานที่ดูแล</th>
              <th className="py-2 pr-4">สถานะ</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-medium text-slate-800">
                  {u.name} {u.id === currentUserId && "(คุณ)"}
                </td>
                <td className="py-2 pr-4 text-slate-600">{u.email}</td>
                <td className="py-2 pr-4">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white"
                  >
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={u.teamId ?? ""}
                    onChange={(e) => changeTeam(u, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white"
                  >
                    <option value="">ไม่มีทีม</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4 text-slate-600">{u._count?.opportunities ?? 0}</td>
                <td className="py-2 pr-4">
                  {u.active ? (
                    <span className="text-emerald-600 text-xs">ใช้งานอยู่</span>
                  ) : (
                    <span className="text-slate-400 text-xs">ปิดใช้งาน</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => toggleActive(u)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      {u.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
