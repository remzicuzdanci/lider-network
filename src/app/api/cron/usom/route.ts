import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const USOM = "https://www.usom.gov.tr/api/address/index.json";
const PER = 2000;
const CONCURRENCY = 6;
const TIMEOUT_MS = 50_000; // 50s bütçe — 60s limit içinde güvenli

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface UsomRecord {
  url?: string;
  addr?: string;
  type?: string;
  date?: string;
}

interface UsomResponse {
  data?: UsomRecord[];
  models?: UsomRecord[];
  meta?: {
    pagination?: {
      "page-count"?: number;
      "total-pages"?: number;
      pageCount?: number;
      totalPages?: number;
      total?: number;
      "per-page"?: number;
    };
  };
}

function getPageCount(j: UsomResponse): number {
  const p = j?.meta?.pagination;
  if (!p) return 1;
  return (
    p["page-count"] ??
    p["total-pages"] ??
    p.pageCount ??
    p.totalPages ??
    (p.total && p["per-page"] ? Math.ceil(p.total / p["per-page"]) : 1)
  );
}

function getRecords(j: UsomResponse): UsomRecord[] {
  return Array.isArray(j?.data) ? j.data : Array.isArray(j?.models) ? j.models : [];
}

async function fetchPage(page: number): Promise<{ records: UsomRecord[]; pageCount?: number } | null> {
  try {
    const r = await fetch(`${USOM}?page=${page}&per-page=${PER}`, {
      headers: { "User-Agent": "LiderNetwork-ThreatFeed/1.0 (+https://threat.lidernetwork.com.tr)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const j: UsomResponse = await r.json();
    return { records: getRecords(j), pageCount: page === 1 ? getPageCount(j) : undefined };
  } catch {
    return null;
  }
}

type FeedType = "domain" | "ipv4" | "ipv6" | "url";

function classify(raw: string): FeedType | null {
  const v = raw.trim();
  if (!v || v.length < 3) return null;

  // URL — protokol içeriyorsa
  if (/^https?:\/\//i.test(v) || /^ftp:\/\//i.test(v)) return "url";

  // IPv6 — birden fazla iki nokta üst üste
  if (v.includes(":") && v.split(":").length > 2) return "ipv6";

  // IPv4 (CIDR dahil)
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v)) {
    return v.split(".").every(o => parseInt(o) <= 255) ? "ipv4" : null;
  }

  // Domain — geçerli karakter seti ve en az bir nokta
  if (/^[a-z0-9*_-]([a-z0-9*._-]*[a-z0-9-])?$/i.test(v) && v.includes(".")) {
    return "domain";
  }

  return null;
}

function recordValue(r: UsomRecord): string {
  return (r.url ?? r.addr ?? "").trim();
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

  // İlk sayfayı al + toplam sayfa sayısını öğren
  const first = await fetchPage(1);
  if (!first) {
    return NextResponse.json({ error: "USOM API erişilemiyor" }, { status: 502 });
  }

  const totalPages = first.pageCount ?? 1;
  const all: UsomRecord[] = [...first.records];

  // Kalan sayfaları paralel chunk'larla çek
  let pagesFetched = 1;
  for (let p = 2; p <= totalPages; p += CONCURRENCY) {
    if (Date.now() - started > TIMEOUT_MS) break;
    const batch = Array.from(
      { length: Math.min(CONCURRENCY, totalPages - p + 1) },
      (_, i) => p + i
    );
    const results = await Promise.all(batch.map(fetchPage));
    for (const r of results) if (r) { all.push(...r.records); pagesFetched++; }
  }

  // Tip sınıflandır + deduplicate
  const buckets: Record<FeedType, Set<string>> = {
    domain: new Set(), ipv4: new Set(), ipv6: new Set(), url: new Set(),
  };

  for (const r of all) {
    const val = recordValue(r);
    const apiType = (r.type ?? "").toLowerCase().trim();

    let ft: FeedType | null = classify(val);

    // API tipini de değerlendir: sınıflandırılamayan ama API tipi bilinen
    if (!ft && apiType) {
      if (apiType.includes("domain")) ft = "domain";
      else if (apiType.includes("url")) ft = "url";
      else if (apiType.includes("ip")) ft = val.includes(":") ? "ipv6" : "ipv4";
    }

    if (ft) buckets[ft].add(val);
  }

  const client = sb();
  const now = new Date().toISOString();

  const feeds: { feed_type: string; records: string[] }[] = [
    { feed_type: "domain", records: [...buckets.domain].sort() },
    { feed_type: "ipv4",   records: [...buckets.ipv4].sort() },
    { feed_type: "ipv6",   records: [...buckets.ipv6].sort() },
    { feed_type: "url",    records: [...buckets.url] },
  ];

  for (const f of feeds) {
    const content = f.records.join("\n");
    await client.from("threat_feeds").upsert({
      feed_type: f.feed_type,
      content,
      record_count: f.records.length,
      size_bytes: Buffer.byteLength(content, "utf8"),
      updated_at: now,
      pages_fetched: pagesFetched,
      total_pages: totalPages,
      partial: pagesFetched < totalPages,
    });
  }

  return NextResponse.json({
    success: true,
    elapsed_ms: Date.now() - started,
    total_raw: all.length,
    domain: buckets.domain.size,
    ipv4:   buckets.ipv4.size,
    ipv6:   buckets.ipv6.size,
    url:    buckets.url.size,
    pages_fetched: pagesFetched,
    total_pages: totalPages,
    partial: pagesFetched < totalPages,
  });
}
