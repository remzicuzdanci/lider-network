import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon       = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key        = serviceKey || anon;
  const keyUsed    = serviceKey ? "service_role" : "anon";

  if (!url || !key) {
    return NextResponse.json({ error: "Env vars eksik", url: !!url, serviceKey: !!serviceKey, anon: !!anon });
  }

  const sb = createClient(url, key);

  // Tek satır, küçük veri — başarısız olacak bir şey yok
  const { data, error, status, statusText } = await sb
    .from("threat_feeds")
    .upsert(
      { feed_type: "domain", content: "test.com\nexample.com", record_count: 2, updated_at: new Date().toISOString() },
      { onConflict: "feed_type" }
    )
    .select("feed_type, record_count, updated_at");

  // Tabloyu da oku
  const { data: rows, error: readErr } = await sb
    .from("threat_feeds")
    .select("feed_type, record_count, updated_at");

  return NextResponse.json({
    key_used: keyUsed,
    write: { data, error, status, statusText },
    read:  { rows, error: readErr },
    env:   { url: url.slice(0, 40), keyLen: key.length },
  });
}
