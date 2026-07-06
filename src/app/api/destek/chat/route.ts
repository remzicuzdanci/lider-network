import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

// GET — fetch messages for the customer's active chat ticket
export async function GET(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ticketId = new URL(req.url).searchParams.get("ticket_id");
  if (!ticketId) return NextResponse.json({ messages: [], ticket: null });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, status, subject, created_at")
    .eq("id", ticketId)
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .single();

  if (!ticket) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, content, sender_type, sender_name, is_internal_note, created_at")
    .eq("ticket_id", ticketId)
    .eq("is_internal_note", false)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ticket, messages: messages || [] });
}

// POST — create new chat ticket or add message to existing
export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { message, ticket_id } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, company, approved")
    .eq("id", user.id)
    .single();

  if (!profile?.approved) return NextResponse.json({ error: "Hesap onaylanmamış" }, { status: 403 });

  const senderName = profile.full_name || user.email || "Müşteri";

  // Add to existing ticket
  if (ticket_id) {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, status")
      .eq("id", ticket_id)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .single();

    if (ticket && ticket.status !== "closed" && ticket.status !== "resolved") {
      await supabase.from("ticket_messages").insert({
        ticket_id,
        content: message.trim(),
        sender_type: "customer",
        sender_name: senderName,
        sender_email: user.email,
        is_internal_note: false,
      });
      await supabase.from("tickets").update({ updated_at: new Date().toISOString(), status: "open" }).eq("id", ticket_id);
      return NextResponse.json({ ticket_id, created: false });
    }
  }

  // Create new chat ticket
  const { data: newTicket, error } = await supabase
    .from("tickets")
    .insert({
      subject: "💬 Anlık Destek",
      description: message.trim(),
      customer_name: senderName,
      customer_email: user.email || "",
      company: profile.company || null,
      category: "general",
      priority: "medium",
      status: "open",
      user_id: user.id,
      ticket_source: "chat",
    })
    .select()
    .single();

  if (error || !newTicket) return NextResponse.json({ error: "Talep oluşturulamadı" }, { status: 500 });

  return NextResponse.json({ ticket_id: newTicket.id, created: true });
}
