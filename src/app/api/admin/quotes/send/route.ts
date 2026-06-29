import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendQuoteEmail } from "@/lib/quote-mail";
import { buildQuotePdf } from "@/lib/quote-pdf";

export const maxDuration = 30;
const SITE_BASE = process.env.PDF_ASSET_BASE || "https://www.lidernetwork.com.tr";

// POST /api/admin/quotes/send  { id, email }
export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, email } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Alıcı e-postası gerekli" }, { status: 400 });

  const { data: q, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !q) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });

  // Firma detayını (adres/vergi) PDF için çek
  let company: { name?: string; address?: string; tax_office?: string; tax_no?: string; contact_name?: string } | null = null;
  if (q.company_id) {
    const { data: c } = await supabase.from("companies").select("name, address, tax_office, tax_no, contact_name").eq("id", q.company_id).maybeSingle();
    company = c;
  }

  // Teklif PDF'ini üret (ekte gidecek). Hata olursa eksiz devam et.
  let pdf: Buffer | undefined;
  try {
    pdf = await buildQuotePdf({
      quote_no: q.quote_no,
      customer_name: q.customer_name || company?.name,
      customer_address: company?.address,
      tax_office: company?.tax_office,
      tax_no: company?.tax_no,
      contact_name: company?.contact_name,
      quote_date: q.quote_date,
      valid_until: q.valid_until,
      currency: q.currency || "TL",
      prepared_by: q.created_by,
      description: q.description,
      quote_note: q.quote_note,
      items: q.items || [],
      totals: {
        subtotal: q.subtotal,
        discount_total: (q.discount_total || 0) + (q.extra_discount || 0),
        net_total: q.net_total, kdv_total: q.kdv_total, grand_total: q.grand_total,
      },
      approvalUrl: `${SITE_BASE}/teklif/onay/${id}`,
    });
  } catch (e) {
    console.error("Teklif PDF üretilemedi (eksiz gönderilecek):", e);
  }

  try {
    await sendQuoteEmail({
      quote_no: q.quote_no,
      customer_name: q.customer_name,
      company_name: q.companies?.name,
      quote_date: q.quote_date,
      valid_until: q.valid_until,
      currency: q.currency || "TL",
      description: q.description,
      items: q.items || [],
      subtotal: q.subtotal,
      discount_total: (q.discount_total || 0) + (q.extra_discount || 0),
      net_total: q.net_total, kdv_total: q.kdv_total, grand_total: q.grand_total,
      toEmail: email,
      pdf,
      pdfName: `Teklif-${q.quote_no}.pdf`,
      approvalUrl: `${SITE_BASE}/teklif/onay/${id}`,
    });
  } catch (e) {
    console.error("Teklif maili gönderilemedi:", e);
    return NextResponse.json({ error: "E-posta gönderilemedi: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }

  // Durumu "gönderildi" yap
  const { data: updated } = await supabase
    .from("quotes")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  return NextResponse.json(updated || { success: true });
}
