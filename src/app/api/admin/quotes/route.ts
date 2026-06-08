import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── Teklifler ──────────────────────────────────────────────────── */

interface QuoteItem {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;   // yüzde (%)
  kdv_rate: number;   // yüzde (%)
  unit?: string;
}

function num(v: unknown): number { const n = Number(v); return isNaN(n) ? 0 : n; }

function computeTotals(items: QuoteItem[]) {
  let subtotal = 0, discount_total = 0, net_total = 0, kdv_total = 0;
  for (const it of items) {
    const gross = num(it.quantity) * num(it.unit_price);
    const disc  = gross * num(it.discount) / 100;
    const net   = gross - disc;
    const kdv   = net * num(it.kdv_rate) / 100;
    subtotal += gross; discount_total += disc; net_total += net; kdv_total += kdv;
  }
  const grand_total = net_total + kdv_total;
  const r = (n: number) => Math.round(n * 100) / 100;
  return { subtotal: r(subtotal), discount_total: r(discount_total), net_total: r(net_total), kdv_total: r(kdv_total), grand_total: r(grand_total) };
}

async function nextQuoteNo(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`);
  return `TKF-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
}

// GET — liste
export async function GET() {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data || [] });
}

// POST — yeni teklif
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  const items: QuoteItem[] = Array.isArray(b.items) ? b.items : [];
  const totals = computeTotals(items);
  const quote_no = b.quote_no?.trim() || await nextQuoteNo();

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      quote_no,
      company_id:    b.company_id || null,
      customer_name: b.customer_name || null,
      quote_date:    b.quote_date || new Date().toISOString().slice(0, 10),
      valid_until:   b.valid_until || null,
      currency:      b.currency || "TL",
      exchange_rate: b.exchange_rate ?? 1,
      description:   b.description || null,
      items,
      ...totals,
      status:        b.status || "draft",
      created_by:    b.created_by || user.name,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — güncelle
export async function PATCH(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const ALLOWED = ["quote_no","company_id","customer_name","quote_date","valid_until","currency","exchange_rate","description","status","created_by"] as const;
  for (const k of ALLOWED) if (k in b) fields[k] = b[k];

  if ("items" in b) {
    const items: QuoteItem[] = Array.isArray(b.items) ? b.items : [];
    fields.items = items;
    Object.assign(fields, computeTotals(items));
  }

  const { data, error } = await supabase
    .from("quotes").update(fields).eq("id", b.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE
export async function DELETE(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
