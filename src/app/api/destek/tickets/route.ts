import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

// GET — customer's tickets (?view=company to include all company tickets)
export async function GET(req: NextRequest) {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const viewCompany = new URL(req.url).searchParams.get("view") === "company";

  let query = supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (viewCompany) {
    // Get the user's company name from their profile first
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("company, approved")
      .eq("id", user.id)
      .single();

    // Only approved users with a company can see company-wide tickets
    if (!profile?.approved || !profile?.company) {
      return NextResponse.json({ tickets: [], companyView: false });
    }

    // Show all tickets from the same company (matched by company name) OR their own tickets
    const safeCompany = profile.company.replace(/[",]/g, "");
    query = query.or(`company.eq.${safeCompany},user_id.eq.${user.id},customer_email.eq.${user.email}`);
  } else {
    query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
  }

  const { data: tickets, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets || [] });
}
