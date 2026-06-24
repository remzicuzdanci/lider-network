import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

// GET /api/destek/quotes — customer's company quotes (sent/approved/ordered only)
export async function GET() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("company, approved")
    .eq("id", user.id)
    .single();

  if (!profile?.approved || !profile?.company) {
    return NextResponse.json({ quotes: [] });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", profile.company)
    .single();

  if (!company) return NextResponse.json({ quotes: [] });

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, created_at, status, grand_total, currency, notes")
    .eq("company_id", company.id)
    .in("status", ["sent", "approved", "ordered", "completed"])
    .order("created_at", { ascending: false });

  return NextResponse.json({ quotes: quotes || [] });
}
