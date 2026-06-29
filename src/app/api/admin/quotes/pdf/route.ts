import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { buildQuoteHtml } from "@/lib/quote-html";
import { htmlToPdf } from "@/lib/html-to-pdf";

export const maxDuration = 60;
const SITE_BASE = process.env.PDF_ASSET_BASE || "https://www.lidernetwork.com.tr";

// GET /api/admin/quotes/pdf?id=xxx
export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { data: q, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !q) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });

  let company: { name?: string; address?: string; tax_office?: string; tax_no?: string; contact_name?: string } | null = null;
  if (q.company_id) {
    const { data: c } = await supabase.from("companies").select("name, address, tax_office, tax_no, contact_name").eq("id", q.company_id).maybeSingle();
    company = c;
  }

  const html = buildQuoteHtml({
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
      net_total: q.net_total,
      kdv_total: q.kdv_total,
      grand_total: q.grand_total,
    },
    qr: `${SITE_BASE}/teklif/onay/${id}`,
  });
  const pdf = await htmlToPdf(html);

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Teklif-${q.quote_no}.pdf"`,
    },
  });
}
