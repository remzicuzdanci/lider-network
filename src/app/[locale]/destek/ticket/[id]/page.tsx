import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Ticket, TicketMessage } from "@/lib/supabase";
import TicketTrackClient from "./TicketTrackClient";

export const dynamic = "force-dynamic";

export default async function TicketTrackPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ticket) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .eq("is_internal_note", false)
    .order("created_at", { ascending: true });

  return (
    <TicketTrackClient
      ticket={ticket as Ticket}
      messages={(messages || []) as TicketMessage[]}
    />
  );
}
