import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/staff ──────────────────────────────────── */
export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, active, created_at")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    staff: (data || []).map(u => u.name) // Return just names for dropdown
  });
}
