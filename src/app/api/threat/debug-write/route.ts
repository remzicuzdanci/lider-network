import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const keyUsed = serviceKey ? "service_role" : "anon";
  const key = serviceKey || anonKey;

  if (!url || !key) {
    return NextResponse.json({ error: "ENV eksik", url: !!url, serviceKey: !!serviceKey, anonKey: !!anonKey });
  }

  // Cron ile aynı şekilde yaz
  const payload = [{
    feed_type: "domain",
    content: "test.com\nmalware.example.com",
    record_count: 2,
    updated_at: new Date().toISOString(),
  }];

  const writeRes = await fetch(`${url}/rest/v1/threat_feeds`, {
    method: "POST",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  const writeBody = await writeRes.text();

  // Sonra oku
  const readRes = await fetch(`${url}/rest/v1/threat_feeds?select=feed_type,record_count,updated_at`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` },
  });
  const readBody = await readRes.json();

  return NextResponse.json({
    key_used: keyUsed,
    service_key_length: serviceKey?.length ?? 0,
    anon_key_length: anonKey?.length ?? 0,
    supabase_url: url.slice(0, 50),
    write: {
      status: writeRes.status,
      statusText: writeRes.statusText,
      ok: writeRes.ok,
      body: writeBody.slice(0, 500),
    },
    read: readBody,
  });
}
