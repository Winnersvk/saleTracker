import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieOptions = await getSessionCookieOptions();
  res.cookies.set(cookieOptions.name, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
