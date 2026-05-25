import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin)
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: open },
    { count: inProgress },
    { count: resolvedToday },
    { count: total },
    { count: urgent },
    { data: recentTickets },
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte("resolved_at", today.toISOString()),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("priority", "urgent")
      .in("status", ["open", "in_progress"]),
    // For avg first response calc
    supabase
      .from("tickets")
      .select("created_at,first_response_at")
      .not("first_response_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Calculate average first response time in minutes
  let avgResponseMin: number | null = null;
  if (recentTickets && recentTickets.length > 0) {
    const diffs = recentTickets.map((t) => {
      const created = new Date(t.created_at).getTime();
      const responded = new Date(t.first_response_at!).getTime();
      return (responded - created) / 60000;
    });
    avgResponseMin = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }

  return NextResponse.json({
    open: open ?? 0,
    in_progress: inProgress ?? 0,
    resolved_today: resolvedToday ?? 0,
    total: total ?? 0,
    urgent: urgent ?? 0,
    avg_response_min: avgResponseMin,
  });
}
