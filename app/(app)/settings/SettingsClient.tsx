"use client";

import { useEffect, useState } from "react";
import type { Channel, JobType, LeadSource, LostReason, Stage, Team, UserRecord } from "@/lib/types";
import NamedListManager from "@/components/NamedListManager";
import UsersManager from "@/components/UsersManager";
import TeamsManager from "@/components/TeamsManager";
import ProbabilityManager from "@/components/ProbabilityManager";
import LineIntegrationManager from "@/components/LineIntegrationManager";
import { Card } from "@/components/ui";

const TABS = [
  { key: "general", label: "ประเภทงาน / ช่องทาง" },
  { key: "sales", label: "Lead Source / Lost Reason" },
  { key: "probability", label: "Probability" },
  { key: "teams", label: "ทีมขาย" },
  { key: "users", label: "ผู้ใช้งาน" },
  { key: "line", label: "แจ้งเตือน LINE" },
] as const;

export default function SettingsClient() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [probConfig, setProbConfig] = useState<{ stage: Stage; percent: number }[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [jtRes, chRes, lsRes, lrRes, teamsRes, usersRes, probRes, meRes] = await Promise.all([
      fetch("/api/job-types").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/lead-sources").then((r) => r.json()),
      fetch("/api/lost-reasons").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/probability-config").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setJobTypes(jtRes.jobTypes ?? []);
    setChannels(chRes.channels ?? []);
    setLeadSources(lsRes.leadSources ?? []);
    setLostReasons(lrRes.lostReasons ?? []);
    setTeams(teamsRes.teams ?? []);
    setUsers(usersRes.users ?? []);
    setProbConfig(probRes.config ?? []);
    setRole(meRes.user?.role ?? null);
    setCurrentUserId(meRes.user?.id ?? "");
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;

  const isAdmin = role === "ADMIN";
  const isManagement = role === "MANAGEMENT";
  const canView = isAdmin || isManagement;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          จัดการ Master Data, ทีมขาย, สิทธิ์ผู้ใช้งาน และ Probability
        </p>
      </div>

      {!canView ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          หน้านี้สำหรับผู้ดูแลระบบและผู้บริหารเท่านั้น
        </Card>
      ) : (
        <>
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                  tab === t.key
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isAdmin ? (
                <>
                  <NamedListManager title="ประเภทงาน (Product Master)" items={jobTypes} apiBase="/api/job-types" onChanged={loadAll} />
                  <NamedListManager title="ช่องทางติดต่อ (Contact Channel)" items={channels} apiBase="/api/channels" onChanged={loadAll} />
                </>
              ) : (
                <Card className="p-4 text-sm text-slate-500 lg:col-span-2">
                  เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขได้ - ติดต่อผู้ดูแลระบบหากต้องการเพิ่ม/แก้ไขรายการ
                </Card>
              )}
            </div>
          )}

          {tab === "sales" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isAdmin ? (
                <>
                  <NamedListManager title="Lead Source" items={leadSources} apiBase="/api/lead-sources" onChanged={loadAll} />
                  <NamedListManager title="Lost Reason" items={lostReasons} apiBase="/api/lost-reasons" onChanged={loadAll} />
                </>
              ) : (
                <Card className="p-4 text-sm text-slate-500 lg:col-span-2">
                  เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขได้
                </Card>
              )}
            </div>
          )}

          {tab === "probability" && (
            <ProbabilityManager config={probConfig} canEdit={isAdmin || isManagement} onChanged={loadAll} />
          )}

          {tab === "teams" && (
            isAdmin ? (
              <TeamsManager teams={teams} onChanged={loadAll} />
            ) : (
              <Card className="p-4 text-sm text-slate-500">เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขได้</Card>
            )
          )}

          {tab === "users" && (
            isAdmin ? (
              <UsersManager users={users} teams={teams} currentUserId={currentUserId} onChanged={loadAll} />
            ) : (
              <Card className="p-4 text-sm text-slate-500">เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขได้</Card>
            )
          )}

          {tab === "line" && (
            isAdmin ? (
              <LineIntegrationManager />
            ) : (
              <Card className="p-4 text-sm text-slate-500">เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขได้</Card>
            )
          )}
        </>
      )}
    </div>
  );
}
