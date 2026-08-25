"use client";

import { useState } from "react";
import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/pipeline";
import { Card } from "@/components/ui";

export default function ProbabilityManager({
  config,
  canEdit,
  onChanged,
}: {
  config: { stage: Stage; percent: number }[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  async function update(stage: Stage, percent: number) {
    setSaving(stage);
    try {
      await fetch("/api/probability-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, percent }),
      });
      onChanged();
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">Default Probability per Stage</h2>
      <p className="text-xs text-slate-400 mb-3">
        ใช้เป็นค่าเริ่มต้นเมื่อ Opportunity เปลี่ยน Stage (แก้ไขได้เฉพาะผู้บริหาร/ผู้ดูแลระบบ)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {config.map((c) => (
          <div key={c.stage} className="rounded-lg border border-slate-200 p-2.5">
            <label className="block text-xs text-slate-500 mb-1">{STAGE_LABELS[c.stage]}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canEdit || saving === c.stage}
                defaultValue={c.percent}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v !== c.percent) update(c.stage, v);
                }}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
