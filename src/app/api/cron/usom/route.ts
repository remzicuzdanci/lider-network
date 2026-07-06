import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCES: Record<string, string[]> = {
  domain: [
    "https://www.usom.gov.tr/url-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt",
  ],
  ipv4: [
    "https://www.usom.gov.tr/ip-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ip.txt",
    "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
  ],
  ipv6: [
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ipv6.txt",
  ],
  url: [
    "https://www.usom.gov.tr/zararli-baglantilar.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-url.txt",
    "https://urlhaus.abuse.ch/downloads/text_online/",
    "https://openphish.com/feed.txt",
  ],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-ThreatFeed/1.0; +https://threat.lidernetwork.com.tr)",
  "Accept": "text/plain,text/html,*/*",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  "Referer": "https://www.usom.gov.tr/",
};

async function fetchText(urls: string[]): Promise<{ content: string; source: string } | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) continue;
      const text = await r.text();
      if (text && text.trim().length > 10) return { content: text, source: url };
    } catch { continue; }
  }
  return null;
}

function isValidIpv4(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(s) &&
    s.replace(/\/\d+$/, "").split(".").every(o => parseInt(o) <= 255);
}

function parseLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && !l.startsWith("//") && l.length > 3);
}

async function supabaseUpsert(feedType: string, content: string, count: number): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const r = await fetch(`${url}/rest/v1/threat_feeds`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{
        feed_type: feedType,
        content,
        record_count: count,
        updated_at: new Date().toISOString(),
      }]),
      signal: AbortSignal.timeout(15_000),
    });
    return r.ok;
  } catch { return false; }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();
  const results: Record<string, { count: number; source: string; ok: boolean }> = {};

  await Promise.all(
    Object.entries(SOURCES).map(async ([type, urls]) => {
      const res = await fetchText(urls);
      if (!res) {
        results[type] = { count: 0, source: "unavailable", ok: false };
        return;
      }

      let lines = parseLines(res.content);
      if (type === "ipv4") lines = lines.filter(l => isValidIpv4(l));

      const unique = [...new Set(lines)].sort();
      if (unique.length === 0) {
        results[type] = { count: 0, source: res.source, ok: false };
        return;
      }

      const ok = await supabaseUpsert(type, unique.join("\n"), unique.length);
      results[type] = { count: unique.length, source: res.source, ok };
    })
  );

  const total = Object.values(results).reduce((s, v) => s + v.count, 0);

  return NextResponse.json({
    success: Object.values(results).some(v => v.ok),
    elapsed_ms: Date.now() - started,
    total,
    results,
  });
}
