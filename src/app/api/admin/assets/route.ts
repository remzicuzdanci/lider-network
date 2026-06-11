import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Cihaz / Asset Envanteri ────────────────────────────────────── */

// GET — tüm cihazlar (firma + tür sıralı)
export async function GET() {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("company_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data || [] });
}

// POST — yeni cihaz
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  if (!b.model && !b.type) {
    return NextResponse.json({ error: "Cihaz tipi veya model gerekli" }, { status: 400 });
  }

  const row = {
    company_id:    b.company_id || null,
    company_name:  b.company_name || null,
    type:          b.type || "firewall",
    brand:         b.brand || "Fortinet",
    model:         b.model || null,
    serial_no:     b.serial_no || null,
    firmware:      b.firmware || null,
    ip_address:    b.ip_address || null,
    location:      b.location || null,
    purchase_date: b.purchase_date || null,
    warranty_end:  b.warranty_end || null,
    status:        b.status || "active",
    notes:         b.notes || null,
    created_by:    user.name || null,
  };

  const { data, error } = await supabase.from("assets").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data }, { status: 201 });
}

// PATCH — güncelle
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const allowed = ["company_id", "company_name", "type", "brand", "model", "serial_no", "firmware", "ip_address", "location", "purchase_date", "warranty_end", "status", "notes"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in updates) patch[k] = updates[k];

  const { data, error } = await supabase.from("assets").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
