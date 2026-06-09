import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  generateNamedToken,
  validateSessionToken,
  validateNamedToken,
  findStaffByEmail,
  verifyPassword,
  COOKIE_NAME,
} from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const, // CSRF koruması
  maxAge: 60 * 60 * 48, // 48h
  path: "/",
};

// POST — login (email + password  OR  legacy master password)
export async function POST(request: NextRequest) {
  // ── Rate limit: max 10 giriş denemesi / 15 dakika / IP ──────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Çok fazla giriş denemesi. ${retryAfterSec} saniye bekleyin.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password, turnstileToken } = body as { email?: string; password?: string; turnstileToken?: string };

    if (!password) return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });

    // ── Robot doğrulaması (Cloudflare Turnstile) — yapılandırılmamışsa atlanır ──
    const human = await verifyTurnstile(turnstileToken, ip);
    if (!human) {
      return NextResponse.json({ error: "Robot doğrulaması başarısız. Lütfen tekrar deneyin." }, { status: 400 });
    }

    // ── Named staff login ──────────────────────────────────────────────────────
    if (email && email.trim()) {
      const staff = await findStaffByEmail(email.trim());
      if (!staff) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
      }
      const ok = verifyPassword(password, staff.password_hash);
      if (!ok) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
      }
      const token = generateNamedToken(staff.email, staff.role, staff.name);
      const res = NextResponse.json({ success: true, name: staff.name, role: staff.role });
      res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS);
      return res;
    }

    // ── Legacy master password (backward compat) ───────────────────────────────
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Lütfen e-posta ile giriş yapın" }, { status: 400 });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Hatalı şifre" }, { status: 401 });
    }
    const token = generateSessionToken();
    const res = NextResponse.json({ success: true, role: "super_admin" });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS);
    return res;
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}

// GET — check session
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ authenticated: false });
  const legacy = validateSessionToken(token);
  if (legacy) return NextResponse.json({ authenticated: true, role: "super_admin" });
  const named = validateNamedToken(token);
  if (named) return NextResponse.json({ authenticated: true, role: named.role, name: named.name });
  return NextResponse.json({ authenticated: false });
}
