import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("feed_type, record_count, updated_at")
    .order("feed_type");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  type FeedStat = {
    count: number;
    size_bytes: number;
    updated_at: string | null;
    partial: boolean;
    pages_fetched: number | null;
    total_pages: number | null;
  };

  const stats: Record<string, FeedStat> = {
    domain: { count: 0, size_bytes: 0, updated_at: null, partial: false, pages_fetched: null, total_pages: null },
    ipv4:   { count: 0, size_bytes: 0, updated_at: null, partial: false, pages_fetched: null, total_pages: null },
    ipv6:   { count: 0, size_bytes: 0, updated_at: null, partial: false, pages_fetched: null, total_pages: null },
    url:    { count: 0, size_bytes: 0, updated_at: null, partial: false, pages_fetched: null, total_pages: null },
  };

  for (const row of data ?? []) {
    if (row.feed_type in stats) {
      stats[row.feed_type] = {
        count:         row.record_count ?? 0,
        size_bytes:    0,
        updated_at:    row.updated_at  ?? null,
        partial:       false,
        pages_fetched: null,
        total_pages:   null,
      };
    }
  }

  const total = Object.values(stats).reduce((s, v) => s + v.count, 0);
  const last_updated = data?.find(r => r.updated_at)?.updated_at ?? null;

  return NextResponse.json(
    { stats, total, last_updated, is_partial: false },
    { headers: CORS }
  );
}
