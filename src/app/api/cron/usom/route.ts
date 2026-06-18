import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/plain,*/*",
  "Accept-Language": "tr-TR,tr;q=0.9",
  "Referer": "https://www.usom.gov.tr/",
};

const FALLBACK_FEEDS: Record<string, string> = {
  domain: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
  ipv4:   "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
};

const URL_FEEDS = [
  "https://urlhaus.abuse.ch/downloads/text_online/",
  "https://openphish.com/feed.txt",
];

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(25_000) });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

function parseHostsFile(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => { const m = l.match(/^0\.0\.0\.0\s+(\S+)/); return m ? m[1] : null; })
    .filter((v): v is string => !!v && v !== "0.0.0.0" && v !== "localhost" && !v.startsWith("#"));
}

function parseIpFile(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim().split(/\s+/)[0])
    .filter(v => v && !v.startsWith("#") && /^(\d{1,3}\.){3}\d{1,3}/.test(v));
}

function parseUrlFile(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(v => v && !v.startsWith("#") && (v.startsWith("http://") || v.startsWith("https://")));
}

async function fetchUrlFeeds(): Promise<string[]> {
  const results = await Promise.all(URL_FEEDS.map(u => fetchText(u)));
  const all: string[] = [];
  for (const txt of results) {
    if (txt) all.push(...parseUrlFile(txt));
  }
  return [...new Set(all)].sort();
}

// Supabase'e direkt REST ile yaz — JS client bypass
async function supabaseUpsert(feedType: string, content: string, count: number): Promise<{ ok: boolean; status: number; body: string }> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return { ok: false, status: 0, body: "ENV MISSING" };

  const payload = [{
    feed_type:    feedType,
    content,
    record_count: count,
    updated_at:   new Date().toISOString(),
  }];

  try {
    const r = await fetch(`${url}/rest/v1/threat_feeds`, {
      method: "POST",
      headers: {
        "apikey":       key,
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const body = await r.text();
    return { ok: r.ok, status: r.status, body: body.slice(0, 300) };
  } catch (e) {
    return { ok: false, status: 0, body: String(e) };
  }
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

  // Veri çek
  const [hostsTxt, ipTxt, urls] = await Promise.all([
    fetchText(FALLBACK_FEEDS.domain),
    fetchText(FALLBACK_FEEDS.ipv4),
    fetchUrlFeeds(),
  ]);

  const domains = hostsTxt ? [...new Set(parseHostsFile(hostsTxt))].sort() : [];
  const ipv4s   = ipTxt    ? [...new Set(parseIpFile(ipTxt))].sort()       : [];

  // Her feed için Supabase'e yaz, sonucu kaydet
  const writeResults: Record<string, { ok: boolean; status: number; body: string }> = {};

  const feeds = [
    { type: "domain",   records: domains },
    { type: "ipv4",     records: ipv4s },
    { type: "ipv6",     records: [] as string[] },
    { type: "url",      records: urls },
    // URL lite feeds — URLhaus/OpenPhish zaten aktif kayıtlar, aynı içerik
    { type: "url_90d",  records: urls },
    { type: "url_180d", records: urls },
    { type: "url_365d", records: urls },
  ];

  for (const f of feeds) {
    writeResults[f.type] = await supabaseUpsert(
      f.type,
      f.records.join("\n"),
      f.records.length
    );
  }

  const allOk = Object.values(writeResults).every(r => r.ok);

  return NextResponse.json({
    success: allOk,
    elapsed_ms: Date.now() - started,
    fetched: { domain: domains.length, ipv4: ipv4s.length, url: urls.length },
    supabase_url: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").slice(0, 50),
    using_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    write_results: writeResults,
  });
}
