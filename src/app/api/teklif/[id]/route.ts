import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ── Herkese açık teklif onay API'si (QR linki ile) ──────────────────
   GET  /api/teklif/:id        → teklifin özetini döner (müşteri görür)
   POST /api/teklif/:id {action:"accept"|"reject"} → durumu günceller
   Kimlik doğrulama yok; teklif id (uuid) tahmin edilemez olduğundan
   bağlantıya sahip müşteri onaylayabilir.
─────────────────────────────────────────────────────────────────── */

const PUBLIC_FIELDS = "id, quote_no, customer_name, items, currency, subtotal, discount_total, net_total, kdv_total, grand_total, quote_date, valid_until, description, status, created_by, approved_at";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { data, error } = await supabase.from("quotes").select(PUBLIC_FIELDS).eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  return NextResponse.json({ quote: data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { action } = await req.json().catch(() => ({}));
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const { data: q, error: qErr } = await supabase.from("quotes").select("id, status").eq("id", id).single();
  if (qErr || !q) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });

  // Zaten karara bağlanmışsa tekrar değiştirme
  if (q.status === "accepted" || q.status === "rejected" || q.status === "ordered") {
    return NextResponse.json({ already: true, status: q.status });
  }

  const newStatus = action === "accept" ? "accepted" : "rejected";
  const { error } = await supabase
    .from("quotes")
    .update({ status: newStatus, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, status: newStatus });
}
