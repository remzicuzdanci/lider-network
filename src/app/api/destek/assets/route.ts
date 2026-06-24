import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

// GET /api/destek/assets — customer's company devices (read-only)
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
    return NextResponse.json({ assets: [] });
  }

  // Resolve company_id from company name
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", profile.company)
    .single();

  if (!company) return NextResponse.json({ assets: [] });

  const { data: assets } = await supabase
    .from("assets")
    .select("id, type, brand, model, serial_no, firmware, ip_address, location, warranty_end, purchase_date")
    .eq("company_id", company.id)
    .order("type")
    .order("created_at", { ascending: false });

  return NextResponse.json({ assets: assets || [] });
}
