import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

// GET — customer's own tickets
export async function GET(_req: NextRequest) {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  // Tickets linked by user_id OR by email match (for pre-existing tickets)
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets || [] });
}
