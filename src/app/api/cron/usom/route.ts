import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/plain,text/html,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.usom.gov.tr/",
  "Cache-Control": "no-cache",
};

// USOM tüm zararlı bağlantıları tek dosyada sunuyor — farklı URL varyasyonları deneniyor
const USOM_COMBINED = [
  "https://www.usom.gov.tr/url-list.txt",
  "https://www.usom.gov.tr/zararli-baglantilar.txt",
  "https://www.usom.gov.tr/api/address/index.txt",
];

// Her tip için ayrı kaynak denemeleri
const SOURCES_BY_TYPE: Record<string, string[]> = {
  domain: [
    "https://raw.githubusercontent.com/stamparm/blackbook/master/blackbook.txt",
  ],
  ipv4: [
    "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
  ],
};

async function tryFetch(url: string, timeout = 20_000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(timeout),
    });
    if (!r.ok) return null;
    const text = await r.text();
    return text && text.trim().length > 20 ? text : null;
  } catch {
    return null;
  }
}

function parseLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map(l => l.split(/\s+/)[0].trim())   // satır başındaki token al (IP tabloları için)
    .map(l => l.replace(/^[#*!;]+.*$/, "").trim())  // yorum satırı temizle
    .filter(l => l && l.length > 3 && !l.startsWith("#") && !l.startsWith("//"));
}

function classifyLine(v: string): "domain" | "ipv4" | "ipv6" | "url" | null {
  if (/^https?:\/\//i.test(v) || /^ftp:\/\//i.test(v)) return "url";
  if (v.includes(":") && v.split(":").length > 2) return "ipv6";
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v)) {
    return v.replace(/\/\d+$/, "").split(".").every(o => +o <= 255) ? "ipv4" : null;
  }
  if (/^[a-z0-9*._-]+\.[a-z]{2,}$/i.test(v) && !v.startsWith(".")) return "domain";
  return null;
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
  const client = sb();
  const now = new Date().toISOString();

  const buckets: Record<string, Set<string>> = {
    domain: new Set(), ipv4: new Set(), ipv6: new Set(), url: new Set(),
  };

  const debug: Record<string, string> = {};

  // 1. USOM kombinasyon dosyasını dene — tek dosyada domain+ip+url
  let usomHit = false;
  for (const url of USOM_COMBINED) {
    const text = await tryFetch(url);
    if (!text) { debug[url] = "empty/fail"; continue; }

    const lines = parseLines(text);
    debug[url] = `${lines.length} satır`;

    if (lines.length < 10) continue; // gerçek veri değil

    usomHit = true;
    for (const line of lines) {
      const type = classifyLine(line);
      if (type) buckets[type].add(line);
    }
    break; // ilk çalışan URL yeterli
  }

  // 2. USOM çalışmadıysa fallback kaynaklardan besle
  if (!usomHit) {
    debug["usom"] = "tüm USOM URL'leri başarısız";
    await Promise.all(
      Object.entries(SOURCES_BY_TYPE).map(async ([type, urls]) => {
        for (const url of urls) {
          const text = await tryFetch(url);
          if (!text) continue;
          const lines = parseLines(text);
          debug[`fallback:${type}`] = `${lines.length} satır — ${url}`;
          if (lines.length < 10) continue;
          for (const line of lines) buckets[type].add(line);
          break;
        }
      })
    );
  }

  // 3. Supabase'e yaz
  for (const [type, set] of Object.entries(buckets)) {
    const records = [...set].sort();
    const content = records.join("\n");
    await client.from("threat_feeds").upsert({
      feed_type: type,
      content,
      record_count: records.length,
      size_bytes: Buffer.byteLength(content, "utf8"),
      updated_at: now,
      pages_fetched: 1,
      total_pages: 1,
      partial: false,
    });
  }

  const total = [...Object.values(buckets)].reduce((s, b) => s + b.size, 0);

  return NextResponse.json({
    success: true,
    elapsed_ms: Date.now() - started,
    total,
    domain: buckets.domain.size,
    ipv4:   buckets.ipv4.size,
    ipv6:   buckets.ipv6.size,
    url:    buckets.url.size,
    usom_direct: usomHit,
    debug,
  });
}
