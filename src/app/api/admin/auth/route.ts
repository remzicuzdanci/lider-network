import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  validateSessionToken,
  COOKIE_NAME,
} from "@/lib/admin-auth";

// POST — login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin şifresi yapılandırılmamış" },
        { status: 500 }
      );
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Hatalı şifre" }, { status: 401 });
    }

    const token = generateSessionToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 48, // 48 hours
      path: "/",
    });
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
  const valid = token ? validateSessionToken(token) : false;
  return NextResponse.json({ authenticated: valid });
}
