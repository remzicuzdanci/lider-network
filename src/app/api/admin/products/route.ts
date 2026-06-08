import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Ürün Kataloğu ─────────────────────────────────────────────── */

// GET /api/admin/products?q=arama
export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();

  let query = supabase
    .from("products")
    .select("id, name, code, barcode, brand, category, unit_price, currency, kdv_rate, unit, vat_included, type")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(50);

  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,barcode.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "Ürün adı gerekli" }, { status: 400 });

  const { data, error } = await supabase
    .from("products")
    .insert({
      name:         b.name.trim(),
      code:         b.code || null,
      barcode:      b.barcode || null,
      brand:        b.brand || null,
      category:     b.category || null,
      unit_price:   b.unit_price ?? 0,
      currency:     b.currency || "TL",
      kdv_rate:     b.kdv_rate ?? 20,
      unit:         b.unit || "Adet",
      vat_included: !!b.vat_included,
      type:         b.type || "stoklu",
      active:       true,
    })
    .select("id, name, code, barcode, brand, category, unit_price, currency, kdv_rate, unit, vat_included, type")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/products
export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const ALLOWED = ["name","code","barcode","brand","category","unit_price","currency","kdv_rate","unit","vat_included","type","active"] as const;
  const fields: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in b) fields[k] = b[k];

  const { data, error } = await supabase
    .from("products").update(fields).eq("id", b.id)
    .select("id, name, code, barcode, brand, category, unit_price, currency, kdv_rate, unit, vat_included, type")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/products (soft delete)
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
