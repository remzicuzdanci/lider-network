import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

// GET /api/destek/me — server-side profile check using service role key
export async function GET() {
  try {
    const sb = await createSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ approved: false, reason: "not_authenticated" });
    }

    // Use service role client — bypasses all RLS / permission issues
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("approved, full_name, company")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      approved: profile?.approved ?? false,
      fullName: profile?.full_name ?? "",
      company:  profile?.company ?? null,
    });
  } catch {
    return NextResponse.json({ approved: false, reason: "error" });
  }
}
