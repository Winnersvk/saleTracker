"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      const next = params.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-[32px] bg-white shadow-[0_1px_2px_rgba(37,37,37,0.04),0_24px_48px_-20px_rgba(37,37,37,0.25)] overflow-hidden">
          <div className="bg-primary px-8 pt-9 pb-12 text-center bg-[radial-gradient(120%_140%_at_20%_-10%,#ff8a4d_0%,#ff6117_55%,#e2530f_100%)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-white text-xl font-bold ring-1 ring-white/25">
              W
            </div>
            <h1 className="text-lg font-semibold text-white">
              Winner Sales Tracker
            </h1>
            <p className="text-sm text-white/80 mt-1">
              ระบบติดตามการขายลูกค้า
            </p>
          </div>

          <form onSubmit={onSubmit} className="p-6 -mt-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_24px_-12px_rgba(37,37,37,0.15)] p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-surface/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-surface/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary text-white text-sm font-medium py-3 hover:bg-primary-hover disabled:opacity-60 transition shadow-[0_10px_20px_-8px_rgba(255,97,23,0.55)]"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
