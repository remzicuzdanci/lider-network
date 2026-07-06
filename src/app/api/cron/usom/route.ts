import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const USOM_API = "https://www.usom.gov.tr/api/address/index.json";
const PER_PAGE = 2000;
const CONCURRENCY = 12;

interface UsomRecord { url: string; type: string; }

async function fetchPage(page: number): Promise<UsomRecord[] | null> {
  try {
    const r = await fetch(`${USOM_API}?page=${page}&per-page=${PER_PAGE}`, {
      headers: { "User-Agent": "LiderNetwork-ThreatFeed/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.models) ? j.models : Array.isArray(j?.data) ? j.data : null;
  } catch { return null; }
}

async function fetchMeta(): Promise<{ totalPages: number; totalRecords: number } | null> {
  try {
    const r = await fetch(`${USOM_API}?page=1&per-page=${PER_PAGE}`, {
      headers: { "User-Agent": "LiderNetwork-ThreatFeed/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const pg = j?.meta?.pagination ?? j?.pagination ?? {};
    const totalPages = pg["page-count"] ?? pg.pageCount ?? pg.totalPages ?? 1;
    const totalRecords = pg["total-count"] ?? pg.totalCount ?? pg.total ?? 0;
    return { totalPages: Number(totalPages), totalRecords: Number(totalRecords) };
  } catch { return null; }
}

// Ek kaynaklar — USOM JSON başarısız olursa devreye girer
const FALLBACK_SOURCES = {
  domain: ["https://www.usom.gov.tr/url-list.txt", "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt"],
  ipv4:   ["https://www.usom.gov.tr/ip-list.txt",  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt"],
  url:    ["https://urlhaus.abuse.ch/downloads/text_online/", "https://openphish.com/feed.txt"],
};

async function fetchFallback(urls: string[]): Promise<string[]> {
  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!r.ok) continue;
      const text = await r.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#") && l.length > 3);
      if (lines.length > 0) return [...new Set(lines)].sort();
    } catch { continue; }
  }
  return [];
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
      body: JSON.stringify([{ feed_type: feedType, content, record_count: count, updated_at: new Date().toISOString() }]),
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
  const budget = 50_000; // 50 saniye bütçe, sonra yazar

  // Meta çek
  const meta = await fetchMeta();
  const usomAvailable = !!meta && meta.totalPages > 0;

  const all: UsomRecord[] = [];

  if (usomAvailable) {
    // İlk sayfayı zaten meta için çektik, tekrar çek
    const firstData = await fetchPage(1);
    if (firstData) all.push(...firstData);

    // Kalan sayfaları CONCURRENCY kadar paralel çek, bütçe bitince dur
    for (let p = 2; p <= meta!.totalPages; p += CONCURRENCY) {
      if (Date.now() - started > budget) break;
      const batch = Array.from({ length: Math.min(CONCURRENCY, meta!.totalPages - p + 1) }, (_, i) => p + i);
      const results = await Promise.all(batch.map(fetchPage));
      for (const r of results) if (r) all.push(...r);
    }
  }

  const norm = (s: string) => s.trim().toLowerCase();

  let domains = usomAvailable
    ? [...new Set(all.filter(r => norm(r.type) === "domain").map(r => r.url.trim()).filter(Boolean))].sort()
    : await fetchFallback(FALLBACK_SOURCES.domain);

  let ipv4s = usomAvailable
    ? [...new Set(all.filter(r => norm(r.type) === "ip" && !r.url.includes(":")).map(r => r.url.trim()).filter(Boolean))].sort()
    : await fetchFallback(FALLBACK_SOURCES.ipv4);

  const ipv6s = [...new Set(all.filter(r => norm(r.type) === "ip" && r.url.includes(":")).map(r => r.url.trim()).filter(Boolean))].sort();

  let urls = usomAvailable
    ? [...new Set(all.filter(r => norm(r.type) === "url").map(r => r.url.trim()).filter(Boolean))].sort()
    : await fetchFallback(FALLBACK_SOURCES.url);

  // USOM az veri döndürdüyse ek kaynaklarla zenginleştir
  if (urls.length < 1000) {
    const extra = await fetchFallback(FALLBACK_SOURCES.url);
    urls = [...new Set([...urls, ...extra])].sort();
  }
  if (ipv4s.length < 1000) {
    const extra = await fetchFallback(FALLBACK_SOURCES.ipv4);
    ipv4s = [...new Set([...ipv4s, ...extra])].sort();
  }

  const feeds = [
    { type: "domain", records: domains },
    { type: "ipv4",   records: ipv4s },
    { type: "ipv6",   records: ipv6s },
    { type: "url",    records: urls },
  ];

  const writeResults: Record<string, { count: number; ok: boolean }> = {};
  for (const f of feeds) {
    if (f.records.length === 0) { writeResults[f.type] = { count: 0, ok: false }; continue; }
    const ok = await supabaseUpsert(f.type, f.records.join("\n"), f.records.length);
    writeResults[f.type] = { count: f.records.length, ok };
  }

  return NextResponse.json({
    success: Object.values(writeResults).some(r => r.ok),
    elapsed_ms: Date.now() - started,
    usom_api: usomAvailable ? `${meta!.totalPages} sayfa / ${meta!.totalRecords} kayıt` : "erişilemiyor",
    usom_fetched: all.length,
    results: writeResults,
  });
}
