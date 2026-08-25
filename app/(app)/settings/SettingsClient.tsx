"use client";

import { useEffect, useState } from "react";
import type { Channel, JobType, UserRecord } from "@/lib/types";
import NamedListManager from "@/components/NamedListManager";
import UsersManager from "@/components/UsersManager";
import { Card } from "@/components/ui";

export default function SettingsClient() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [role, setRole] = useState<"ADMIN" | "SALES" | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [jtRes, chRes, usersRes, meRes] = await Promise.all([
      fetch("/api/job-types").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setJobTypes(jtRes.jobTypes ?? []);
    setChannels(chRes.channels ?? []);
    setUsers(usersRes.users ?? []);
    setRole(meRes.user?.role ?? null);
    setCurrentUserId(meRes.user?.id ?? "");
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          จัดการประเภทงาน ช่องทางติดต่อ และผู้ใช้งาน
        </p>
      </div>

      {role !== "ADMIN" ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          หน้านี้สำหรับผู้ดูแลระบบเท่านั้น กรุณาติดต่อผู้ดูแลระบบหากต้องการแก้ไขข้อมูลตั้งค่า
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NamedListManager
              title="ประเภทงาน"
              items={jobTypes}
              apiBase="/api/job-types"
              onChanged={loadAll}
            />
            <NamedListManager
              title="ช่องทางติดต่อ"
              items={channels}
              apiBase="/api/channels"
              onChanged={loadAll}
            />
          </div>
          <UsersManager
            users={users}
            currentUserId={currentUserId}
            onChanged={loadAll}
          />
        </>
      )}
    </div>
  );
}
