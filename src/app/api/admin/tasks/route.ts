import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendTaskAssignedEmail } from "@/lib/task-digest-mail";

interface TaskRow {
  title: string; description?: string | null; priority?: string | null;
  category?: string | null; due_date?: string | null;
  assigned_to?: string | null; company_id?: string | null;
}

/* Göreve atanan personele anında bildirim e-postası gönderir.
   Hata olursa API isteğini düşürmez; yalnızca loglar. */
async function notifyAssignment(task: TaskRow, assignedBy?: string) {
  try {
    if (!task.assigned_to) return;
    const { data: staff } = await supabase
      .from("staff_users")
      .select("name, email")
      .eq("name", task.assigned_to)
      .eq("active", true)
      .maybeSingle();
    if (!staff?.email) return;

    let companyName: string | undefined;
    if (task.company_id) {
      const { data: c } = await supabase
        .from("companies")
        .select("name")
        .eq("id", task.company_id)
        .maybeSingle();
      companyName = c?.name;
    }

    await sendTaskAssignedEmail({
      staffName: task.assigned_to,
      staffEmail: staff.email,
      title: task.title,
      description: task.description || undefined,
      priority: task.priority || undefined,
      category: task.category || undefined,
      due_date: task.due_date || undefined,
      company_name: companyName,
      assignedBy,
    });
  } catch (e) {
    console.error("Görev atama maili gönderilemedi:", e);
  }
}

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
      billed:       body.billed       || false,
      billed_date:  body.billed_date  || null,
      products:     body.products     || null,
      amount:       body.amount ?? null,
      created_by:   user.name,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Yeni görev birine atandıysa anında bildirim gönder
  if (data?.assigned_to) {
    await notifyAssignment(data, user.name);
  }

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
  const ALLOWED = ["title","description","category","priority","status","assigned_to","company_id","due_date","billed","billed_date","products","amount"] as const;
  const fields: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in body) fields[k] = body[k];
  }

  // Atanan kişi değişti mi? (yalnızca değişince mail atmak için eski değeri al)
  let prevAssignee: string | null = null;
  if ("assigned_to" in fields) {
    const { data: prev } = await supabase
      .from("work_tasks")
      .select("assigned_to")
      .eq("id", id)
      .maybeSingle();
    prevAssignee = prev?.assigned_to ?? null;
  }

  const { data, error } = await supabase
    .from("work_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Görev yeni birine atandıysa (değişti ve boş değilse) bildirim gönder
  const user = await getSessionUser();
  if (data?.assigned_to && data.assigned_to !== prevAssignee) {
    await notifyAssignment(data, user?.name);
  }

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
