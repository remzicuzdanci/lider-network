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
    .select("*, companies(name)")
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
          receipt_date, due_date, check_no, bank_name, notes } = body;

  if (!company_id || !payment_type || !amount || !receipt_date)
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });

  const receipt_no = await nextReceiptNo();

  const { data, error } = await supabase
    .from("receipts")
    .insert({ company_id, payment_type, amount: Number(amount), currency,
              receipt_date, due_date: due_date || null,
              check_no: check_no || null, bank_name: bank_name || null,
              notes: notes || null, receipt_no })
    .select()
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
