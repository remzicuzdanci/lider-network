import { NextRequest, NextResponse } from "next/server";
import {
  findStaffByEmail,
  verifyOtpChallenge,
  generateNamedToken,
  COOKIE_NAME,
} from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 48,
  path: "/",
};

export async function POST(request: NextRequest) {
  // Rate limit: max 5 deneme / 10 dakika / IP (brute-force koruması)
  const ip = getClientIp(request);
  const rl = rateLimit(`otp:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Çok fazla deneme. ${retryAfterSec} saniye bekleyin.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const email: string     = (body.email     ?? "").trim().toLowerCase();
    const otp: string       = (body.otp       ?? "").trim().replace(/\D/g, "");
    const challenge: string = (body.challenge ?? "").trim();

    if (!email || !otp || !challenge) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Geçersiz kod formatı" }, { status: 400 });
    }

    const staff = await findStaffByEmail(email);
    if (!staff) {
      return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
    }

    if (!verifyOtpChallenge(email, otp, challenge)) {
      return NextResponse.json({ error: "Kod hatalı veya süresi dolmuş" }, { status: 401 });
    }

    const token = generateNamedToken(staff.email, staff.role, staff.name);
    const res = NextResponse.json({ success: true, name: staff.name, role: staff.role });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS);
    return res;
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
