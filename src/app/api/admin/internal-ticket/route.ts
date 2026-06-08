/**
 * Admin creates an internal ticket on behalf of a contract company.
 * ticket_source = "internal"
 * No email sent to company on creation (admin flow).
 * When resolved → email auto-sent to company_contact_email.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { sendNewTicketAdminEmail, sendTicketCreatedEmail } from "@/lib/ticket-mail";
import { sendWhatsAppUrgentAlert } from "@/lib/whatsapp";
import type { Ticket } from "@/lib/supabase";

const schema = z.object({
  company_id:    z.string().uuid(),
  subject:       z.string().min(3).max(200),
  description:   z.string().min(5).max(5000),
  category:      z.enum(["technical", "billing", "general", "feature_request"]).default("technical"),
  priority:      z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  notify_email:  z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const staffUser = await getSessionUser();

  try {
    const body = schema.parse(await req.json());

    // Fetch company for contact info
    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", body.company_id)
      .eq("active", true)
      .single();

    if (cErr || !company) {
      return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });
    }

    // Bildirim e-postası girildiyse şirket kartındaki mail yerine onu kullan
    const notifyEmail = body.notify_email || company.contact_email;

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        subject:                body.subject,
        description:            body.description,
        category:               body.category,
        priority:               body.priority,
        status:                 "open",
        customer_name:          company.contact_name,
        customer_email:         notifyEmail,
        company:                company.name,
        phone:                  company.phone || null,
        ticket_source:          "internal",
        company_id:             company.id,
        company_contact_email:  notifyEmail,
        created_by_staff:       staffUser?.email || null,
        assigned_to:            staffUser?.email || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Internal ticket error:", error);
      return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });
    }

    // Notify all admins (same as external tickets)
    sendNewTicketAdminEmail(ticket as Ticket).catch(console.error);

    // Bildirim e-postası girildiyse, açılış bildirimini o adrese gönder
    if (body.notify_email) {
      sendTicketCreatedEmail(ticket as Ticket).catch(console.error);
    }

    // WhatsApp urgent alert
    if (body.priority === "urgent") {
      sendWhatsAppUrgentAlert({
        ticket_number: (ticket as Ticket).ticket_number,
        subject: (ticket as Ticket).subject,
        priority: (ticket as Ticket).priority,
        company: (ticket as Ticket).company,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, ticket_id: ticket.id, ticket_number: ticket.ticket_number }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Doğrulama hatası", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
