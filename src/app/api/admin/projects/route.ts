import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

// projects tablosundaki gerçek kolonlar (join'li 'companies' alanı hariç)
const PROJECT_COLS = ["name","description","company_id","phase","status","start_date","end_date","assigned_to","notes","billed","billed_date"] as const;
function pickProjectFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of PROJECT_COLS) if (k in body) out[k] = body[k];
  return out;
}

export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("*, companies(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...pickProjectFields(body), created_by: user.name })
    .select("*, companies(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const { data, error } = await supabase
    .from("projects")
    .update({ ...pickProjectFields(body), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, companies(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
