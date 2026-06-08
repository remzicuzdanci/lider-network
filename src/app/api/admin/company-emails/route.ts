import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

/* ── GET /api/admin/company-emails?company_id=... ───────────────────
   Seçilen şirkete ait, daha önce taleplerde kullanılmış bildirim
   e-postalarını döndürür (şirketin kendi kayıtlı maili + geçmiş
   taleplerdeki adresler). Böylece aynı kişinin mailini her seferinde
   tekrar yazmaya gerek kalmaz.
─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const companyId = new URL(req.url).searchParams.get("company_id");
  if (!companyId) return NextResponse.json({ emails: [] });

  const emails = new Set<string>();

  // Şirketin kayıtlı iletişim maili
  const { data: company } = await supabase
    .from("companies")
    .select("contact_email")
    .eq("id", companyId)
    .maybeSingle();
  if (company?.contact_email) emails.add(company.contact_email.trim());

  // Geçmiş taleplerde kullanılmış adresler (bu şirkete ait)
  const { data: tickets } = await supabase
    .from("tickets")
    .select("customer_email, company_contact_email")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);

  (tickets || []).forEach((t) => {
    if (t.customer_email) emails.add(t.customer_email.trim());
    if (t.company_contact_email) emails.add(t.company_contact_email.trim());
  });

  // Placeholder/boş adresleri ele
  const list = [...emails].filter((e) => e && e.includes("@") && !e.endsWith("@firma.lidernetwork.com.tr"));

  return NextResponse.json({ emails: list });
}
