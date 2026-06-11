import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Sözleşmeler & Yenileme Takibi ──────────────────────────────── */

// GET — tüm sözleşmeler (bitiş tarihine göre yakın olanlar önce)
export async function GET() {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("end_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contracts: data || [] });
}

// POST — yeni sözleşme
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  if (!b.title || !b.end_date) {
    return NextResponse.json({ error: "Başlık ve bitiş tarihi gerekli" }, { status: 400 });
  }

  const row = {
    company_id:   b.company_id || null,
    company_name: b.company_name || null,
    title:        String(b.title).slice(0, 200),
    type:         b.type || "fortinet",
    serial_no:    b.serial_no || null,
    start_date:   b.start_date || null,
    end_date:     b.end_date,
    amount:       Number(b.amount) || 0,
    currency:     b.currency || "TL",
    status:       b.status || "active",
    auto_remind:  b.auto_remind !== false,
    notes:        b.notes || null,
    created_by:   user.name || null,
  };

  const { data, error } = await supabase.from("contracts").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contract: data }, { status: 201 });
}

// PATCH — güncelle
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const allowed = ["company_id", "company_name", "title", "type", "serial_no", "start_date", "end_date", "amount", "currency", "status", "auto_remind", "notes"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in updates) patch[k] = updates[k];

  const { data, error } = await supabase.from("contracts").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contract: data });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
