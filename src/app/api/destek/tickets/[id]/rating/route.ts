import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

// POST /api/destek/tickets/[id]/rating — save satisfaction rating (1-5)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { rating } = await req.json();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Geçersiz puan (1-5)" }, { status: 400 });
  }

  // Verify ticket belongs to this customer
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, status")
    .eq("id", id)
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .single();

  if (!ticket) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    return NextResponse.json({ error: "Yalnızca tamamlanan talepler puanlanabilir" }, { status: 400 });
  }

  await supabase
    .from("tickets")
    .update({ satisfaction_rating: rating })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
