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

// USOM/SGB'nin herkese açık txt export URL'leri
// Erişilemeyen varsa sonraki denenir (fallback zinciri)
const SOURCES: Record<string, string[]> = {
  domain: [
    "https://www.usom.gov.tr/url-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt",
  ],
  ipv4: [
    "https://www.usom.gov.tr/ip-list.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-ip.txt",
  ],
  url: [
    "https://www.usom.gov.tr/zararli-baglantilar.txt",
    "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-url.txt",
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
      const r = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(20_000),
      });
      if (!r.ok) continue;
      const text = await r.text();
      if (text && text.trim().length > 10) {
        return { content: text, source: url };
      }
    } catch {
      continue;
    }
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
  const results: Record<string, { count: number; source: string; ok: boolean }> = {};

  // Her feed tipi için paralel çekme
  await Promise.all(
    Object.entries(SOURCES).map(async ([type, urls]) => {
      const res = await fetchText(urls);
      if (!res) {
        results[type] = { count: 0, source: "unavailable", ok: false };
        return;
      }

      let lines = parseLines(res.content);

      // IPv4 listesi için geçerlilik filtresi
      if (type === "ipv4") {
        lines = lines.filter(l => isValidIpv4(l));
      }

      // Deduplicate + sırala
      const unique = [...new Set(lines)].sort();
      const content = unique.join("\n");

      await client.from("threat_feeds").upsert({
        feed_type: type,
        content,
        record_count: unique.length,
        size_bytes: Buffer.byteLength(content, "utf8"),
        updated_at: now,
        pages_fetched: 1,
        total_pages: 1,
        partial: false,
      });

      results[type] = { count: unique.length, source: res.source, ok: true };
    })
  );

  const total = Object.values(results).reduce((s, v) => s + v.count, 0);
  const allOk = Object.values(results).every(v => v.ok);

  return NextResponse.json({
    success: allOk,
    elapsed_ms: Date.now() - started,
    total,
    results,
  });
}
