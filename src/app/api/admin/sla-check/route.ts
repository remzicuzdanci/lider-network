import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendSLAWarningEmail } from "@/lib/ticket-mail";
import type { Ticket } from "@/lib/supabase";

const SLA_HOURS: Record<string, number> = {
  urgent: 2,
  high: 4,
  medium: 8,
  low: 24,
};

export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Fetch open/in_progress tickets
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .in("status", ["open", "in_progress"]);

  if (error) {
    return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });
  }

  const adminEmail =
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.SMTP_TO ||
    process.env.SMTP_USER;

  let warnings = 0;
  const now = Date.now();

  for (const ticket of (tickets || []) as Ticket[]) {
    const slaHours = SLA_HOURS[ticket.priority] ?? 8;
    const elapsedHours = (now - new Date(ticket.created_at).getTime()) / 3600000;
    const remainingHours = slaHours - elapsedHours;

    // Warn if 0 < remaining < 1 hour
    if (remainingHours > 0 && remainingHours < 1) {
      const remainingMinutes = Math.round(remainingHours * 60);
      const notifyEmail = ticket.assigned_to || adminEmail;
      if (notifyEmail) {
        sendSLAWarningEmail(ticket, notifyEmail, remainingMinutes).catch(console.error);
        warnings++;
      }
    }
  }

  return NextResponse.json({
    checked: (tickets || []).length,
    warnings,
    message: `${(tickets || []).length} talep kontrol edildi, ${warnings} SLA uyarısı gönderildi`,
  });
}
