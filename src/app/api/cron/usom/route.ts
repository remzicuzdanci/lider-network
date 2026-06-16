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
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8",
  "Referer": "https://www.usom.gov.tr/",
};

// URL'leri test et — hangisinin gerçek veri döndürdüğünü gör
const PROBE_URLS = [
  "https://www.usom.gov.tr/url-list.txt",
  "https://www.usom.gov.tr/zararli-baglantilar.txt",
  "https://www.usom.gov.tr/api/address/index.json?page=1&per-page=20",
  "https://www.usom.gov.tr/api/address/index.json",
  "https://www.usom.gov.tr/api/v1/address",
  "https://www.usom.gov.tr/api/address",
];

// Güvenilir genel tehdit feed'leri (US sunucularından erişilebilir)
const FALLBACK_FEEDS: Record<string, string> = {
  domain: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
  ipv4:   "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
};

async function probe(url: string): Promise<{ status: number; size: number; sample: string; contentType: string } | null> {
  try {
    const r = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8_000),
    });
    const text = await r.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return {
      status: r.status,
      size: text.length,
      contentType: r.headers.get("content-type") || "unknown",
      sample: lines.slice(0, 5).join(" | "),
    };
  } catch (e) {
    return { status: 0, size: 0, contentType: "error", sample: String(e).slice(0, 80) };
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

function classifyLine(v: string): "domain" | "ipv4" | "ipv6" | "url" | null {
  const val = v.trim().split(/\s+/)[0].trim();
  if (!val || val.length < 4) return null;
  if (/^https?:\/\//i.test(val)) return "url";
  if (val.includes(":") && val.split(":").length > 2) return "ipv6";
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(val))
    return val.replace(/\/\d+$/, "").split(".").every(o => +o <= 255) ? "ipv4" : null;
  if (/^[a-z0-9*._-]+\.[a-z]{2,}$/i.test(val) && !val.startsWith(".")) return "domain";
  return null;
}

function parseLines(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && !l.startsWith("//") && !l.startsWith(";") && l.length > 3);
}

// StevenBlack hosts formatını parse et (0.0.0.0 domain.com)
function parseHostsFile(raw: string): string[] {
  return raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const m = l.match(/^0\.0\.0\.0\s+(.+)$/);
      return m ? m[1].trim() : null;
    })
    .filter((v): v is string => !!v && v !== "0.0.0.0" && v !== "localhost");
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const isDiag = new URL(req.url).searchParams.has("diag");

  // TANI MODU: USOM URL'lerini test et, gerçek içeriği göster
  if (isDiag) {
    const probes: Record<string, unknown> = {};
    await Promise.all(PROBE_URLS.map(async url => {
      probes[url] = await probe(url);
    }));
    return NextResponse.json({ mode: "diagnostic", probes });
  }

  const started = Date.now();
  const client = sb();
  const now = new Date().toISOString();

  const buckets: Record<string, Set<string>> = {
    domain: new Set(), ipv4: new Set(), ipv6: new Set(), url: new Set(),
  };
  const debug: Record<string, string> = {};

  // Fallback: güvenilir global feed'ler
  const [hostsTxt, ipTxt] = await Promise.all([
    fetchText(FALLBACK_FEEDS.domain),
    fetchText(FALLBACK_FEEDS.ipv4),
  ]);

  if (hostsTxt) {
    const domains = parseHostsFile(hostsTxt);
    domains.forEach(d => buckets.domain.add(d));
    debug["StevenBlack/hosts"] = `${domains.length} domain`;
  } else {
    debug["StevenBlack/hosts"] = "başarısız";
  }

  if (ipTxt) {
    const ips = parseLines(ipTxt).filter(l => classifyLine(l) === "ipv4");
    ips.forEach(ip => buckets.ipv4.add(ip));
    debug["stamparm/ipsum"] = `${ips.length} IPv4`;
  } else {
    debug["stamparm/ipsum"] = "başarısız";
  }

  // Supabase'e yaz — sadece temel kolonlar (ALTER TABLE çalıştırılmamış olabilir)
  const writeErrors: string[] = [];
  for (const [type, set] of Object.entries(buckets)) {
    const records = [...set].sort();
    const content = records.join("\n");

    // Önce tam şema dene, hata alırsa temel şemaya düş
    const { error: e1 } = await client.from("threat_feeds").upsert({
      feed_type: type,
      content,
      record_count: records.length,
      size_bytes: Buffer.byteLength(content, "utf8"),
      updated_at: now,
      pages_fetched: 1,
      total_pages: 1,
      partial: false,
    });

    if (e1) {
      // Kolon eksik — temel şema ile yaz
      const { error: e2 } = await client.from("threat_feeds").upsert({
        feed_type: type,
        content,
        record_count: records.length,
        updated_at: now,
      });
      if (e2) writeErrors.push(`${type}: ${e2.message}`);
    }
  }

  const total = Object.values(buckets).reduce((s, b) => s + b.size, 0);

  return NextResponse.json({
    success: writeErrors.length === 0,
    elapsed_ms: Date.now() - started,
    total,
    domain: buckets.domain.size,
    ipv4:   buckets.ipv4.size,
    ipv6:   buckets.ipv6.size,
    url:    buckets.url.size,
    write_errors: writeErrors,
    debug,
    note: "USOM direkt erişim engelli. Tanı için ?diag parametresi ekle.",
  });
}
