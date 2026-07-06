import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-ThreatFeed/1.0)",
  "Accept": "text/plain,*/*",
};

// Her feed için kaynak listesi — ilk başarılı olan kullanılır
const SOURCES: Record<string, string[]> = {
  domain: [
    // Hagezi Pro Plus ~500k domain, GitHub CDN üzerinden hızlı
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/pro.plus.txt",
    // Yedek: Hagezi Pro ~400k
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/pro.txt",
    // Son çare: USOM TXT (az kayıt ama erişilebilir)
    "https://www.usom.gov.tr/url-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt",
  ],
  ipv4: [
    "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
    "https://www.usom.gov.tr/ip-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ip.txt",
  ],
  ipv6: [
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ipv6.txt",
  ],
  url: [
    "https://urlhaus.abuse.ch/downloads/text_online/",
    "https://openphish.com/feed.txt",
    "https://www.usom.gov.tr/zararli-baglantilar.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-url.txt",
  ],
};

// Minimum kayıt eşiği — altında kalırsa bir sonraki kaynağa geçilir
const MIN_RECORDS: Record<string, number> = {
  domain: 10_000,
  ipv4:   1_000,
  ipv6:   1,
  url:    100,
};

async function fetchText(url: string, timeoutMs = 45_000): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) return null;
    const text = await r.text();
    return text && text.trim().length > 10 ? text : null;
  } catch { return null; }
}

function parseLines(raw: string, feedType: string): string[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  if (feedType === "ipv4") {
    return lines.filter(l => l && !l.startsWith("#") && /^(\d{1,3}\.){3}\d{1,3}/.test(l));
  }
  // Domain / URL: yorum satırlarını at, boş olmayanları al
  return lines.filter(l => l && !l.startsWith("#") && !l.startsWith("!") && !l.startsWith("//") && l.length > 3);
}

async function fetchBest(feedType: string): Promise<{ records: string[]; source: string }> {
  const min = MIN_RECORDS[feedType] ?? 1;
  for (const url of SOURCES[feedType] ?? []) {
    const text = await fetchText(url);
    if (!text) continue;
    const records = [...new Set(parseLines(text, feedType))].sort();
    if (records.length >= min) return { records, source: url };
  }
  return { records: [], source: "none" };
}

async function supabaseUpsert(feedType: string, content: string, count: number): Promise<boolean> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key   = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !key) return false;
  try {
    const r = await fetch(`${sbUrl}/rest/v1/threat_feeds`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{ feed_type: feedType, content, record_count: count, updated_at: new Date().toISOString() }]),
      signal: AbortSignal.timeout(20_000),
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

  // Tüm feed'leri paralel çek
  const [domainRes, ipv4Res, ipv6Res, urlRes] = await Promise.all([
    fetchBest("domain"),
    fetchBest("ipv4"),
    fetchBest("ipv6"),
    fetchBest("url"),
  ]);

  const feeds = [
    { type: "domain", ...domainRes },
    { type: "ipv4",   ...ipv4Res },
    { type: "ipv6",   ...ipv6Res },
    { type: "url",    ...urlRes },
  ];

  const results: Record<string, { count: number; source: string; ok: boolean }> = {};

  for (const f of feeds) {
    if (f.records.length === 0) {
      results[f.type] = { count: 0, source: f.source, ok: false };
      continue;
    }
    const ok = await supabaseUpsert(f.type, f.records.join("\n"), f.records.length);
    results[f.type] = { count: f.records.length, source: f.source, ok };
  }

  return NextResponse.json({
    success: Object.values(results).some(r => r.ok),
    elapsed_ms: Date.now() - started,
    total: Object.values(results).reduce((s, v) => s + v.count, 0),
    results,
  });
}
