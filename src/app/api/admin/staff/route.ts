import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession, getSessionUser, hashPassword } from "@/lib/admin-auth";

// GET — list staff
export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("staff_users")
    .select("id, email, name, role, active, created_at")
    .order("role")
    .order("name");

  if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// PATCH — change password or toggle active (super_admin only)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const { id, newPassword, active } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (newPassword) updates.password_hash = hashPassword(newPassword);
  if (active !== undefined) updates.active = active;

  const { error } = await supabase.from("staff_users").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  return NextResponse.json({ success: true });
}
