import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Ürün Teslim Tutanakları ────────────────────────────────────── */

async function nextNoteNo(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("delivery_notes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`);
  return `TES-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
}

// GET — liste
export async function GET() {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("delivery_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data || [] });
}

// POST — yeni tutanak
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  const items = Array.isArray(b.items) ? b.items : [];

  const row = {
    note_no:          b.note_no || await nextNoteNo(),
    company_id:       b.company_id || null,
    customer_name:    b.customer_name || null,
    customer_address: b.customer_address || null,
    customer_email:   b.customer_email || null,
    customer_phone:   b.customer_phone || null,
    items,
    delivered_by:     b.delivered_by || user.name || null,
    received_by:      b.received_by || null,
    delivery_date:    b.delivery_date || new Date().toISOString().slice(0, 10),
    notes:            b.notes || null,
    status:           b.status || "draft",
    created_by:       user.name || null,
  };

  const { data, error } = await supabase.from("delivery_notes").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}

// PATCH — güncelle
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const allowed = ["company_id", "customer_name", "customer_address", "customer_email", "customer_phone", "items", "delivered_by", "received_by", "delivery_date", "notes", "status"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in updates) patch[k] = updates[k];

  const { data, error } = await supabase.from("delivery_notes").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const { error } = await supabase.from("delivery_notes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
