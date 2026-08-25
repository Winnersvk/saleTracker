import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  findUserByEmail,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    teamId: user.teamId,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      teamId: user.teamId,
    },
  });
  const cookieOptions = await getSessionCookieOptions();
  res.cookies.set(cookieOptions.name, token, cookieOptions);
  return res;
}
