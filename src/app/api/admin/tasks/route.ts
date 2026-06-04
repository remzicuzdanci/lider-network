import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/tasks ──────────────────────────────────────── */
export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("work_tasks")
    .select(`*, companies(name)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── POST /api/admin/tasks ─────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("work_tasks")
    .insert({
      title:        body.title,
      description:  body.description  || null,
      category:     body.category     || "general",
      priority:     body.priority     || "medium",
      status:       body.status       || "todo",
      assigned_to:  body.assigned_to  || null,
      company_id:   body.company_id   || null,
      due_date:     body.due_date     || null,
      created_by:   user.name,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* ── PATCH /api/admin/tasks ────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // Yalnızca gerçek kolonları güncelle (join'li 'companies' gibi alanları ele)
  const ALLOWED = ["title","description","category","priority","status","assigned_to","company_id","due_date","billed","billed_date"] as const;
  const fields: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in body) fields[k] = body[k];
  }

  const { data, error } = await supabase
    .from("work_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── DELETE /api/admin/tasks ───────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { error } = await supabase.from("work_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
