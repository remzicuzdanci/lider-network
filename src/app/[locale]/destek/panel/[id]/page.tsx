import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import type { Ticket, TicketMessage } from "@/lib/supabase";
import TalepDetayClient from "./TalepDetayClient";

export const dynamic = "force-dynamic";

export default async function TalepDetayPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const loginPath = host.startsWith("destek.") ? "/giris" : "/tr/destek/giris";

  const { id } = await params;
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(loginPath);

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, company, approved")
    .eq("id", user.id)
    .single();

  if (!profile?.approved) redirect(loginPath);

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  // Security: only show tickets belonging to this customer
  if (ticket.customer_email !== user.email && ticket.user_id !== user.id) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .eq("is_internal_note", false)
    .order("created_at", { ascending: true });

  return (
    <TalepDetayClient
      ticket={ticket as Ticket}
      messages={(messages || []) as TicketMessage[]}
      userEmail={user.email!}
      fullName={profile.full_name}
    />
  );
}
