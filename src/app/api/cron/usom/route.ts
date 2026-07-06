import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-ThreatFeed/1.0)",
  "Accept": "text/plain,*/*",
};

// Domain: TÜM kaynaklar paralel çekilir ve birleştirilir
const DOMAIN_SOURCES = [
  { url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts", fmt: "hosts" as const },
  { url: "https://www.usom.gov.tr/url-list.txt",                              fmt: "plain" as const },
  { url: "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt", fmt: "plain" as const },
];

// Diğer feed'ler: ilk başarılı kaynak kullanılır
const IP_SOURCES   = [
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
  "https://www.usom.gov.tr/ip-list.txt",
  "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ip.txt",
];
const IPV6_SOURCES = [
  "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ipv6.txt",
];
const URL_SOURCES  = [
  "https://urlhaus.abuse.ch/downloads/text_online/",
  "https://openphish.com/feed.txt",
  "https://www.usom.gov.tr/zararli-baglantilar.txt",
  "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-url.txt",
];

async function fetchText(url: string, timeoutMs = 45_000): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) return null;
    const text = await r.text();
    return text && text.trim().length > 10 ? text : null;
  } catch { return null; }
}

// hosts dosyası: "0.0.0.0 hostname" formatından hostname çıkar
function parseHostsFormat(raw: string): string[] {
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const m = l.match(/^0\.0\.0\.0\s+(\S+)/);
    if (m && m[1] !== "0.0.0.0" && m[1] !== "localhost" && m[1].includes(".")) {
      out.push(m[1].toLowerCase());
    }
  }
  return out;
}

// Plain metin: her satır bir kayıt
function parsePlainFormat(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && !l.startsWith("!") && !l.startsWith("//") && l.length > 3);
}

function parseIpv4(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim().split(/\s+/)[0])
    .filter(l => l && !l.startsWith("#") && /^(\d{1,3}\.){3}\d{1,3}/.test(l));
}

// Tüm domain kaynaklarını paralel çek ve birleştir
async function fetchDomains(): Promise<{ records: string[]; sources: string[] }> {
  const results = await Promise.all(
    DOMAIN_SOURCES.map(async ({ url, fmt }) => {
      const text = await fetchText(url);
      if (!text) return { domains: [] as string[], url, success: false };
      const domains = fmt === "hosts" ? parseHostsFormat(text) : parsePlainFormat(text);
      return { domains, url, success: domains.length > 0 };
    })
  );

  const combined = new Set<string>();
  const usedSources: string[] = [];
  for (const r of results) {
    if (r.success) {
      r.domains.forEach(d => combined.add(d));
      usedSources.push(`${r.url.split("/").slice(-1)[0]}(${r.domains.length})`);
    }
  }
  return { records: [...combined].sort(), sources: usedSources };
}

// İlk başarılı kaynaktan veri çek
async function fetchFirst(urls: string[], parse: (raw: string) => string[]): Promise<{ records: string[]; source: string }> {
  for (const url of urls) {
    const text = await fetchText(url);
    if (!text) continue;
    const records = [...new Set(parse(text))].sort();
    if (records.length > 0) return { records, source: url.split("/").slice(-1)[0] };
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

  const [domainRes, ipv4Res, ipv6Res, urlRes] = await Promise.all([
    fetchDomains(),
    fetchFirst(IP_SOURCES,   parseIpv4),
    fetchFirst(IPV6_SOURCES, parsePlainFormat),
    fetchFirst(URL_SOURCES,  parsePlainFormat),
  ]);

  const feeds = [
    { type: "domain", records: domainRes.records, source: domainRes.sources.join("+") || "none" },
    { type: "ipv4",   records: ipv4Res.records,   source: ipv4Res.source },
    { type: "ipv6",   records: ipv6Res.records,   source: ipv6Res.source },
    { type: "url",    records: urlRes.records,     source: urlRes.source },
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
