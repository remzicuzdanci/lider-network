import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

async function nextReceiptNo(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("receipts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`);
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `MKB-${year}-${seq}`;
}

/* ── GET /api/admin/receipts ─────────────────────────────────── */
export async function GET(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");

  let query = supabase
    .from("receipts")
    .select("*, companies(name, address, tax_no, tax_office)")
    .order("created_at", { ascending: false });

  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipts: data || [] });
}

/* ── POST /api/admin/receipts ────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { company_id, payment_type, amount, currency = "TRY",
          receipt_date, due_date, check_no, bank_name, check_image_url, notes } = body;

  if (!company_id || !payment_type || !amount || !receipt_date)
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });

  const receipt_no = await nextReceiptNo();

  const { data, error } = await supabase
    .from("receipts")
    .insert({ company_id, payment_type, amount: Number(amount), currency,
              receipt_date, due_date: due_date || null,
              check_no: check_no || null, bank_name: bank_name || null,
              check_image_url: check_image_url || null,
              notes: notes || null, receipt_no })
    .select("*, companies(name, address, tax_no, tax_office)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipt: data });
}

/* ── PATCH /api/admin/receipts ───────────────────────────────── */
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, check_no, bank_name, due_date, check_image_url, notes, amount, receipt_date } = body;
  if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (check_no       !== undefined) updates.check_no        = check_no || null;
  if (bank_name      !== undefined) updates.bank_name       = bank_name || null;
  if (due_date       !== undefined) updates.due_date        = due_date || null;
  if (check_image_url !== undefined) updates.check_image_url = check_image_url || null;
  if (notes          !== undefined) updates.notes           = notes || null;
  if (amount         !== undefined) updates.amount          = Number(amount);
  if (receipt_date   !== undefined) updates.receipt_date    = receipt_date;

  const { data, error } = await supabase
    .from("receipts")
    .update(updates)
    .eq("id", id)
    .select("*, companies(name, address, tax_no, tax_office)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipt: data });
}

/* ── DELETE /api/admin/receipts ──────────────────────────────── */
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
