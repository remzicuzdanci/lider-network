import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/service-forms ──────────────────────────────── */
export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("service_forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── POST /api/admin/service-forms ─────────────────────────────── */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("service_forms")
    .insert({
      task_id: body.task_id || null,
      project_id: body.project_id || null,
      company_id: body.company_id || null,
      customer_name: body.customer_name || null,
      customer_phone: body.customer_phone || null,
      customer_email: body.customer_email || null,
      customer_address: body.customer_address || null,
      service_description: body.service_description || null,
      items_delivered: body.items_delivered || null,
      notes: body.notes || null,
      signed_by: body.signed_by || null,
      signed_at: body.signed_at || null,
      sent_to_email: body.sent_to_email || null,
      status: body.status || "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* ── PATCH /api/admin/service-forms ────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { data, error } = await supabase
    .from("service_forms")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── DELETE /api/admin/service-forms ───────────────────────────── */
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { error } = await supabase.from("service_forms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
