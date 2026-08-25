"use client";

import { useState } from "react";

export type Period = { from: string | null; to: string | null; label: string };

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildPreset(key: string): Period {
  const now = new Date();
  const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
  const endOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);

  switch (key) {
    case "this_month":
      return {
        from: toISODate(startOfMonth(now.getFullYear(), now.getMonth())),
        to: toISODate(endOfMonth(now.getFullYear(), now.getMonth())),
        label: "เดือนนี้",
      };
    case "last_month": {
      const m = now.getMonth() - 1;
      return {
        from: toISODate(startOfMonth(now.getFullYear(), m)),
        to: toISODate(endOfMonth(now.getFullYear(), m)),
        label: "เดือนที่แล้ว",
      };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: toISODate(startOfMonth(now.getFullYear(), q * 3)),
        to: toISODate(endOfMonth(now.getFullYear(), q * 3 + 2)),
        label: "ไตรมาสนี้",
      };
    }
    case "this_year":
      return {
        from: toISODate(new Date(now.getFullYear(), 0, 1)),
        to: toISODate(new Date(now.getFullYear(), 11, 31)),
        label: "ปีนี้",
      };
    default:
      return { from: null, to: null, label: "ทั้งหมด" };
  }
}

const PRESETS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "this_month", label: "เดือนนี้" },
  { key: "last_month", label: "เดือนที่แล้ว" },
  { key: "this_quarter", label: "ไตรมาสนี้" },
  { key: "this_year", label: "ปีนี้" },
  { key: "custom", label: "กำหนดเอง" },
];

export default function PeriodFilter({
  onChange,
}: {
  onChange: (period: Period) => void;
}) {
  const [preset, setPreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  function selectPreset(key: string) {
    setPreset(key);
    if (key === "custom") {
      onChange({ from: customFrom || null, to: customTo || null, label: "กำหนดเอง" });
      return;
    }
    onChange(buildPreset(key));
  }

  function applyCustom(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    if (preset === "custom") {
      onChange({ from: from || null, to: to || null, label: "กำหนดเอง" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={preset}
        onChange={(e) => selectPreset(e.target.value)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
      >
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>
      {preset === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => applyCustom(e.target.value, customTo)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <span className="text-slate-400 text-sm">ถึง</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => applyCustom(customFrom, e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </>
      )}
    </div>
  );
}
