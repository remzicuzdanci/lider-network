import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendReplyEmail } from "@/lib/ticket-mail";

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  is_internal_note: z.boolean().default(false),
  // Customer-side only
  sender_name: z.string().max(100).optional(),
  sender_email: z.string().email().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await getAdminSession();

  try {
    const body = await request.json();
    const data = messageSchema.parse(body);

    // Non-admins cannot post internal notes
    if (!isAdmin && data.is_internal_note) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // Fetch parent ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (ticketErr || !ticket)
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

    const now = new Date().toISOString();

    const messageData = {
      ticket_id: id,
      sender_type: isAdmin ? "admin" : "customer",
      sender_name: isAdmin
        ? "Lider Network Destek"
        : data.sender_name || ticket.customer_name,
      sender_email: isAdmin
        ? process.env.SMTP_TO || "info@lidernetwork.com.tr"
        : data.sender_email || ticket.customer_email,
      content: data.content,
      is_internal_note: isAdmin ? data.is_internal_note : false,
    };

    const { data: message, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert(messageData)
      .select()
      .single();

    if (msgErr)
      return NextResponse.json({ error: "Mesaj gönderilemedi" }, { status: 500 });

    // Update ticket metadata
    const ticketUpdate: Record<string, unknown> = { updated_at: now };

    if (isAdmin && !data.is_internal_note) {
      // First real admin response
      if (!ticket.first_response_at)
        ticketUpdate.first_response_at = now;
      // Advance status from open → in_progress
      if (ticket.status === "open")
        ticketUpdate.status = "in_progress";
    }

    await supabase.from("tickets").update(ticketUpdate).eq("id", id);

    // Notify customer when admin replies (not for internal notes)
    if (isAdmin && !data.is_internal_note) {
      sendReplyEmail(ticket, data.content).catch(console.error);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "Doğrulama hatası", details: err.errors }, { status: 400 });
    console.error("Add message error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
