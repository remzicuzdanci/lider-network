import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LiderNetwork-ThreatFeed/1.0)",
  "Accept": "text/plain,*/*",
};

// USOM JSON API — Türkiye IP'si gibi görünmek için tarayıcı başlıkları
const USOM_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "tr-TR,tr;q=0.9",
  "Referer": "https://www.usom.gov.tr/",
  "Origin": "https://www.usom.gov.tr",
};

const USOM_API = "https://www.usom.gov.tr/api/address/index.json";
const USOM_PER_PAGE = 2000;

interface UsomRecord { url: string; type: string; }

// USOM JSON API'den sayfalama ile veri çek (geo-block yoksa çalışır)
async function fetchUsomJson(): Promise<{ domain: string[]; ipv4: string[]; ipv6: string[]; url: string[] } | null> {
  try {
    // Meta çek
    const metaRes = await fetch(`${USOM_API}?page=1&per-page=${USOM_PER_PAGE}`, {
      headers: USOM_HEADERS,
      signal: AbortSignal.timeout(10_000),
    });
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();
    const pg = meta?.meta?.pagination ?? meta?.pagination ?? {};
    const totalPages = Number(pg["page-count"] ?? pg.pageCount ?? pg.totalPages ?? 1);
    if (!totalPages) return null;

    const all: UsomRecord[] = Array.isArray(meta?.models) ? meta.models : Array.isArray(meta?.data) ? meta.data : [];

    // Kalan sayfaları paralel çek (bütçe: 120 saniye)
    const started = Date.now();
    const CONCURRENCY = 10;
    for (let p = 2; p <= totalPages; p += CONCURRENCY) {
      if (Date.now() - started > 120_000) break;
      const batch = Array.from({ length: Math.min(CONCURRENCY, totalPages - p + 1) }, (_, i) => p + i);
      const pages = await Promise.all(batch.map(async page => {
        try {
          const r = await fetch(`${USOM_API}?page=${page}&per-page=${USOM_PER_PAGE}`, {
            headers: USOM_HEADERS, signal: AbortSignal.timeout(10_000),
          });
          if (!r.ok) return [];
          const j = await r.json();
          return Array.isArray(j?.models) ? j.models : Array.isArray(j?.data) ? j.data : [];
        } catch { return []; }
      }));
      for (const page of pages) all.push(...page);
    }

    if (all.length === 0) return null;

    const norm = (s: string) => s.trim().toLowerCase();
    return {
      domain: [...new Set(all.filter(r => norm(r.type) === "domain").map(r => r.url.trim()).filter(Boolean))].sort(),
      ipv4:   [...new Set(all.filter(r => norm(r.type) === "ip" && !r.url.includes(":")).map(r => r.url.trim()).filter(Boolean))].sort(),
      ipv6:   [...new Set(all.filter(r => norm(r.type) === "ip" && r.url.includes(":")).map(r => r.url.trim()).filter(Boolean))].sort(),
      url:    [...new Set(all.filter(r => norm(r.type) === "url").map(r => r.url.trim()).filter(Boolean))].sort(),
    };
  } catch { return null; }
}

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

// Büyük içerik için chunk boyutu (~800KB) — güvenli sınır
const CHUNK_SIZE = 800_000;

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function supabaseUpsert(feedType: string, content: string, count: number): Promise<boolean> {
  const sb  = getSb();
  const now = new Date().toISOString();

  const write = async (type: string, data: string, cnt: number) => {
    const { error } = await sb
      .from("threat_feeds")
      .upsert(
        { feed_type: type, content: data, record_count: cnt, updated_at: now },
        { onConflict: "feed_type" }
      );
    return !error;
  };

  // Küçük içerik → tek satırda yaz
  if (content.length <= CHUNK_SIZE) return write(feedType, content, count);

  // Büyük içerik → satır sınırlarında parçala
  const chunks: string[] = [];
  let cur = "";
  for (const line of content.split("\n")) {
    const candidate = cur ? cur + "\n" + line : line;
    if (candidate.length > CHUNK_SIZE) {
      if (cur) chunks.push(cur);
      cur = line;
    } else {
      cur = candidate;
    }
  }
  if (cur) chunks.push(cur);

  // Ana satır: chunk sayısı işareti
  if (!await write(feedType, `chunked:${chunks.length}`, count)) return false;

  // Chunk satırları: domain__0, domain__1, …
  for (let i = 0; i < chunks.length; i++) {
    if (!await write(`${feedType}__${i}`, chunks[i], 0)) return false;
  }
  return true;
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

  // USOM JSON API ve diğer kaynakları paralel başlat
  const [usom, domainRes, ipv4Res, ipv6Res, urlRes] = await Promise.all([
    fetchUsomJson(),
    fetchAndMerge(DOMAIN_SOURCES, (raw, fmt) => fmt === "hosts" ? parseHosts(raw) : parsePlain(raw)),
    fetchAndMergeUrls(IPV4_SOURCES, parseIpv4),
    fetchAndMergeUrls(IPV6_SOURCES, parseIpv6),
    fetchAndMergeUrls(URL_SOURCES,  parsePlain),
  ]);

  // USOM JSON verilerini diğer kaynaklarla birleştir
  const mergeWithUsom = (base: string[], usom: string[] | undefined) =>
    usom?.length ? [...new Set([...base, ...usom])].sort() : base;

  const domainRecords = mergeWithUsom(domainRes.records, usom?.domain);
  const ipv4Records   = mergeWithUsom(ipv4Res.records,   usom?.ipv4);
  const ipv6Records   = mergeWithUsom(ipv6Res.records,   usom?.ipv6);
  const urlRecords    = mergeWithUsom(urlRes.records,     usom?.url);

  const usomLog = usom
    ? `usom-api(d:${usom.domain.length},ip:${usom.ipv4.length},url:${usom.url.length})`
    : "usom-api:blocked";

  const feeds = [
    { type: "domain", records: domainRecords, sources: [...domainRes.sourceLog, usomLog] },
    { type: "ipv4",   records: ipv4Records,   sources: [...ipv4Res.sourceLog,   usomLog] },
    { type: "ipv6",   records: ipv6Records,   sources: [...ipv6Res.sourceLog,   usomLog] },
    { type: "url",    records: urlRecords,     sources: [...urlRes.sourceLog,    usomLog] },
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
