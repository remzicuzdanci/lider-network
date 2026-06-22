import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Cihaz / Asset Envanteri ────────────────────────────────────── */

// GET — cihazlar (sayfalı, filtrelenebilir)
export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const page  = Math.max(1, parseInt(sp.get("page")  || "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") || "50"));
  const q          = sp.get("q")?.trim();
  const type       = sp.get("type");
  const company_id = sp.get("company_id");
  const all        = sp.get("all") === "1";

  let query = supabase
    .from("assets")
    .select("*", { count: "exact" })
    .order("company_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (type && type !== "all") query = query.eq("type", type);
  if (company_id) query = query.eq("company_id", company_id);
  if (q) query = query.or(`company_name.ilike.%${q}%,model.ilike.%${q}%,serial_no.ilike.%${q}%,brand.ilike.%${q}%,ip_address.ilike.%${q}%`);

  if (!all) query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data || [], total: count ?? 0, page, limit });
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
    address:       b.address || null,
    purchase_date: b.purchase_date || null,
    warranty_end:  b.warranty_end || null,
    licensed:      b.licensed !== false,
    image_url:     b.image_url || null,
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

  const allowed = ["company_id", "company_name", "type", "brand", "model", "serial_no", "firmware", "ip_address", "location", "address", "purchase_date", "warranty_end", "licensed", "image_url", "status", "notes"];
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
