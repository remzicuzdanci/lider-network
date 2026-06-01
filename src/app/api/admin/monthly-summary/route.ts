import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendMonthlySummaryEmail } from "@/lib/ticket-mail";
import type { Ticket } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { companyId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch active companies
  let companiesQuery = supabase
    .from("companies")
    .select("*")
    .eq("active", true);

  if (body.companyId) {
    companiesQuery = companiesQuery.eq("id", body.companyId);
  }

  const { data: companies, error: compError } = await companiesQuery;

  if (compError || !companies?.length) {
    return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const company of companies) {
    // Fetch tickets for this company in the last 30 days
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("company_id", company.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const ticketList = (tickets || []) as Ticket[];

    // Compute stats
    const total = ticketList.length;
    const resolved = ticketList.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length;
    const open = ticketList.filter(
      (t) => t.status === "open" || t.status === "in_progress"
    ).length;

    // Average resolution time (minutes)
    const resolvedWithTime = ticketList.filter(
      (t) => (t.status === "resolved" || t.status === "closed") && t.resolved_at
    );
    const avgMinutes =
      resolvedWithTime.length > 0
        ? Math.round(
            resolvedWithTime.reduce((sum, t) => {
              return (
                sum +
                (new Date(t.resolved_at!).getTime() -
                  new Date(t.created_at).getTime()) /
                  60000
              );
            }, 0) / resolvedWithTime.length
          )
        : null;

    try {
      await sendMonthlySummaryEmail({
        companyName: company.name,
        contactName: company.contact_name,
        contactEmail: company.contact_email,
        tickets: ticketList,
        stats: { total, resolved, open, avgMinutes },
      });
      sent++;
    } catch (err) {
      console.error(`Monthly summary error for ${company.name}:`, err);
      errors.push(company.name);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    errors,
    message: `${sent} şirkete aylık rapor gönderildi${errors.length ? `, ${errors.length} hata oluştu` : ""}`,
  });
}
