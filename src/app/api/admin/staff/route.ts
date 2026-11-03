import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser, hashPassword } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/staff ──────────────────────────────────── */
export async function GET() {
  // Try admin session first, fall back to regular session
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();

  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("staff_users")
    .select("id, name, email, role, active, created_at")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    staff: data || [] // Full staff objects (id, name, email, role, active)
  });
}

/* ── PATCH /api/admin/staff — admin changes a staff member's password ── */
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, password } = await req.json();
  if (!id || !password || typeof password !== "string" || password.length < 8)
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 });

  const { error } = await supabase
    .from("staff_users")
    .update({ password_hash: hashPassword(password) })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Şifre güncellenemedi." }, { status: 500 });
  return NextResponse.json({ success: true });
}
