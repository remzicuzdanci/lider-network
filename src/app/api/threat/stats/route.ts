import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("feed_type, record_count, updated_at")
    .order("feed_type");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  const stats: Record<string, { count: number; updated_at: string | null }> = {
    domain: { count: 0, updated_at: null },
    ipv4:   { count: 0, updated_at: null },
    ipv6:   { count: 0, updated_at: null },
    url:    { count: 0, updated_at: null },
  };

  for (const row of data ?? []) {
    if (row.feed_type in stats) {
      stats[row.feed_type] = {
        count: row.record_count ?? 0,
        updated_at: row.updated_at ?? null,
      };
    }
  }

  const total = Object.values(stats).reduce((s, v) => s + v.count, 0);
  const lastUpdated = data?.[0]?.updated_at ?? null;

  return NextResponse.json({ stats, total, last_updated: lastUpdated }, { headers: CORS });
}
