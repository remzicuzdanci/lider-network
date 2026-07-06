import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-ThreatFeed/1.0)",
  "Accept": "text/plain,*/*",
};

// Tüm domain kaynakları — paralel çekilir, birleştirilir
const DOMAIN_SOURCES: { url: string; fmt: "hosts" | "plain" }[] = [
  // Hagezi Pro hosts formatı ~400k domain — GitHub CDN
  { url: "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/pro.txt",            fmt: "hosts" },
  // Steven Black base ~130k
  { url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",                      fmt: "hosts" },
  // Steven Black fakenews+gambling+porn+social ek domainler
  { url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts", fmt: "hosts" },
  // USOM / anil-yelken mirror
  { url: "https://www.usom.gov.tr/url-list.txt",                                                   fmt: "plain" },
  { url: "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt",               fmt: "plain" },
];

// Tüm IPv4 kaynakları — paralel çekilir, birleştirilir
const IPV4_SOURCES = [
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/1.txt",  // seviye 1 — en kapsamlı
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/2.txt",
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
  "https://feodotracker.abuse.ch/downloads/ipblocklist.txt",               // Feodo botnet C2
  "https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt",      // Emerging Threats
  "https://www.usom.gov.tr/ip-list.txt",
  "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ip.txt",
];

// IPv6 kaynakları
const IPV6_SOURCES = [
  "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ipv6.txt",
];

// URL kaynakları — paralel çekilir, birleştirilir
const URL_SOURCES = [
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

function parseHosts(raw: string): string[] {
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const m = l.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)/);
    if (m) {
      const h = m[1].toLowerCase();
      if (h !== "0.0.0.0" && h !== "localhost" && h !== "localhost.localdomain" && h.includes(".")) {
        out.push(h);
      }
    }
  }
  return out;
}

function parsePlain(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && !l.startsWith("!") && !l.startsWith("//") && l.length > 3);
}

function parseIpv4(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim().split(/\s+/)[0])
    .filter(l => l && !l.startsWith("#") && /^(\d{1,3}\.){3}\d{1,3}/.test(l));
}

function parseIpv6(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes(":"));
}

// Kaynakları paralel çek ve birleştir
async function fetchAndMerge(
  sources: { url: string; fmt: "hosts" | "plain" }[],
  parse: (raw: string, fmt: "hosts" | "plain") => string[]
): Promise<{ records: string[]; sourceLog: string[] }> {
  const results = await Promise.all(
    sources.map(async ({ url, fmt }) => {
      const text = await fetchText(url);
      if (!text) return { items: [] as string[], label: "", ok: false };
      const items = parse(text, fmt);
      const label = url.split("/").pop() ?? url;
      return { items, label: `${label}(${items.length})`, ok: items.length > 0 };
    })
  );
  const set = new Set<string>();
  const log: string[] = [];
  for (const r of results) {
    if (r.ok) { r.items.forEach(i => set.add(i)); log.push(r.label); }
  }
  return { records: [...set].sort(), sourceLog: log };
}

async function fetchAndMergeUrls(urls: string[], parse: (raw: string) => string[]): Promise<{ records: string[]; sourceLog: string[] }> {
  const results = await Promise.all(
    urls.map(async url => {
      const text = await fetchText(url);
      if (!text) return { items: [] as string[], label: "", ok: false };
      const items = parse(text);
      const label = url.split("/").pop() ?? url;
      return { items, label: `${label}(${items.length})`, ok: items.length > 0 };
    })
  );
  const set = new Set<string>();
  const log: string[] = [];
  for (const r of results) {
    if (r.ok) { r.items.forEach(i => set.add(i)); log.push(r.label); }
  }
  return { records: [...set].sort(), sourceLog: log };
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
    fetchAndMerge(DOMAIN_SOURCES, (raw, fmt) => fmt === "hosts" ? parseHosts(raw) : parsePlain(raw)),
    fetchAndMergeUrls(IPV4_SOURCES, parseIpv4),
    fetchAndMergeUrls(IPV6_SOURCES, parseIpv6),
    fetchAndMergeUrls(URL_SOURCES,  parsePlain),
  ]);

  const feeds = [
    { type: "domain", records: domainRes.records, sources: domainRes.sourceLog },
    { type: "ipv4",   records: ipv4Res.records,   sources: ipv4Res.sourceLog },
    { type: "ipv6",   records: ipv6Res.records,   sources: ipv6Res.sourceLog },
    { type: "url",    records: urlRes.records,     sources: urlRes.sourceLog },
  ];

  const results: Record<string, { count: number; sources: string[]; ok: boolean }> = {};
  for (const f of feeds) {
    if (f.records.length === 0) {
      results[f.type] = { count: 0, sources: f.sources, ok: false };
      continue;
    }
    const ok = await supabaseUpsert(f.type, f.records.join("\n"), f.records.length);
    results[f.type] = { count: f.records.length, sources: f.sources, ok };
  }

  return NextResponse.json({
    success: Object.values(results).some(r => r.ok),
    elapsed_ms: Date.now() - started,
    total: Object.values(results).reduce((s, v) => s + v.count, 0),
    results,
  });
}
