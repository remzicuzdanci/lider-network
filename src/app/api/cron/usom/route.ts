import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

// Supabase anon key yeterli — threat_feeds tablosunda RLS kapalı olmalı
function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const USOM = "https://www.usom.gov.tr/api/address/index.json";
const PER = 2000;
const CONCURRENCY = 8;

interface UsomRecord {
  url: string;
  type: string;
}

async function fetchPage(page: number): Promise<UsomRecord[] | null> {
  try {
    const r = await fetch(`${USOM}?page=${page}&per-page=${PER}`, {
      headers: { "User-Agent": "LiderNetwork-ThreatFeed/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data : null;
  } catch {
    return null;
  }
}

async function fetchTotalPages(): Promise<number> {
  try {
    const r = await fetch(`${USOM}?page=1&per-page=${PER}`, {
      headers: { "User-Agent": "LiderNetwork-ThreatFeed/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return 0;
    const j = await r.json();
    return j?.meta?.pagination?.["page-count"] ?? j?.meta?.pagination?.pageCount ?? 1;
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  // Vercel Cron, Authorization header ile CRON_SECRET gönderir
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();

  const totalPages = await fetchTotalPages();
  if (!totalPages) {
    return NextResponse.json({ error: "USOM API erişilemiyor" }, { status: 502 });
  }

  const all: UsomRecord[] = [];

  // İlk sayfayı zaten çektik (meta için), şimdi veriyi alalım
  const firstData = await fetchPage(1);
  if (firstData) all.push(...firstData);

  // Kalan sayfaları CONCURRENCY kadar paralel çek
  for (let p = 2; p <= totalPages; p += CONCURRENCY) {
    if (Date.now() - started > 240_000) break; // 4dk sınırı
    const pages = Array.from(
      { length: Math.min(CONCURRENCY, totalPages - p + 1) },
      (_, i) => p + i
    );
    const results = await Promise.all(pages.map(fetchPage));
    for (const r of results) if (r) all.push(...r);
  }

  // Tip sınıflandır
  const normalize = (s: string) => s.trim().toLowerCase();
  const domains = all
    .filter(r => normalize(r.type) === "domain")
    .map(r => r.url.trim())
    .filter(Boolean);
  const ipv4 = all
    .filter(r => normalize(r.type) === "ip" && !r.url.includes(":"))
    .map(r => r.url.trim())
    .filter(Boolean);
  const ipv6 = all
    .filter(r => normalize(r.type) === "ip" && r.url.includes(":"))
    .map(r => r.url.trim())
    .filter(Boolean);
  const urls = all
    .filter(r => normalize(r.type) === "url")
    .map(r => r.url.trim())
    .filter(Boolean);

  const client = sb();
  const now = new Date().toISOString();

  const feeds = [
    { feed_type: "domain", records: domains },
    { feed_type: "ipv4",   records: ipv4 },
    { feed_type: "ipv6",   records: ipv6 },
    { feed_type: "url",    records: urls },
  ];

  for (const f of feeds) {
    await client.from("threat_feeds").upsert({
      feed_type: f.feed_type,
      content: f.records.join("\n"),
      record_count: f.records.length,
      updated_at: now,
    });
  }

  return NextResponse.json({
    success: true,
    elapsed_ms: Date.now() - started,
    total: all.length,
    domain: domains.length,
    ipv4: ipv4.length,
    ipv6: ipv6.length,
    url: urls.length,
    pages_fetched: totalPages,
  });
}
