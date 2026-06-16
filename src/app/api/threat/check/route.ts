import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function guessFeeds(q: string): string[] {
  if (q.startsWith("http://") || q.startsWith("https://")) return ["url"];
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d+)?$/.test(q))            return ["ipv4"];
  if (q.includes(":") && !q.includes("/"))                    return ["ipv6"];
  if (/^[a-z0-9][a-z0-9.-]{1,250}\.[a-z]{2,}$/.test(q))     return ["domain"];
  return ["domain", "ipv4", "ipv6", "url"];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw  = (body.query ?? "").trim();

  if (!raw || raw.length > 512) {
    return NextResponse.json({ error: "Geçersiz sorgu" }, { status: 400, headers: CORS });
  }

  const query = raw.toLowerCase();
  const feeds = guessFeeds(query);

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await sb
    .from("threat_feeds")
    .select("feed_type, content")
    .in("feed_type", feeds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  const results: Record<string, boolean> = {};
  for (const row of data ?? []) {
    const haystack = "\n" + (row.content ?? "").toLowerCase() + "\n";
    results[row.feed_type] = haystack.includes("\n" + query + "\n");
  }

  const found    = Object.values(results).some(Boolean);
  const found_in = Object.keys(results).filter(k => results[k]);

  return NextResponse.json(
    { query: raw, found, found_in, results, checked: feeds },
    { headers: CORS }
  );
}
