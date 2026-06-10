import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── FortiGate çözüm geçmişi (bilgi bankası) ──────────────────── */

// GET — ?id=<id> verilirse tek kaydın tam çözümü; yoksa liste (özet)
export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("fg_solutions")
      .select("id, problem, result, created_by, created_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("fg_solutions")
    .select("id, problem, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ solutions: data || [] });
}

// DELETE — geçmiş kaydını sil
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const { error } = await supabase.from("fg_solutions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
