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

// Meşru servisler — bu domainler ve alt domainleri feed'e asla girmez
const DOMAIN_WHITELIST = new Set([
  // Sosyal medya & mesajlaşma
  "whatsapp.com", "whatsapp.net",
  "facebook.com", "fb.com", "fbcdn.net", "fb.me",
  "instagram.com", "cdninstagram.com",
  "twitter.com", "x.com", "t.co", "twimg.com",
  "tiktok.com", "tiktokcdn.com", "tiktokv.com",
  "linkedin.com", "licdn.com",
  "pinterest.com",
  "reddit.com", "redd.it", "redditmedia.com", "reddituploads.com",
  "snapchat.com", "sc-cdn.net",
  "telegram.org", "t.me",
  "discord.com", "discordapp.com", "discordapp.net",
  "signal.org",
  "threads.net",
  // Video & eğlence
  "youtube.com", "youtu.be", "ytimg.com", "googlevideo.com", "yt3.ggpht.com",
  "netflix.com", "nflxvideo.net", "nflximg.com",
  "twitch.tv", "twitchsvc.net",
  "spotify.com", "scdn.co",
  // Google servisleri
  "google.com", "googleapis.com", "gstatic.com", "googleusercontent.com",
  "gmail.com", "google.com.tr",
  "chrome.com", "chromium.org",
  "android.com", "goo.gl",
  // Microsoft servisleri
  "microsoft.com", "microsoftonline.com", "live.com", "outlook.com",
  "office.com", "office365.com", "sharepoint.com", "teams.microsoft.com",
  "windows.com", "windowsupdate.com", "msftconnecttest.com",
  "azure.com", "azureedge.net", "azurewebsites.net",
  "skype.com", "sfbassets.com",
  "bing.com", "msn.com",
  // Apple servisleri
  "apple.com", "icloud.com", "mzstatic.com", "aaplimg.com",
  // Amazon / AWS
  "amazon.com", "amazonaws.com", "cloudfront.net",
  // CDN & altyapı
  "cloudflare.com", "cloudflare-dns.com",
  "akamai.com", "akamaihd.net", "akamaized.net",
  "fastly.com", "fastly.net",
  "jsdelivr.net", "unpkg.com",
  // Fortinet / FortiGate — cihazın kendi update & lisans sunucuları
  "fortinet.com", "fortiguard.com", "forticloud.com", "fortigate.com",
  // Video konferans
  "zoom.us", "zoom.com", "zoomgov.com", "zoomcdn.com",
  "webex.com", "webexapis.com", "webex.com.tr",
  "gotomeeting.com", "logmein.com",
  // Kurumsal iletişim & iş birliği
  "slack.com", "slack-edge.com", "slackb.com",
  "dropbox.com", "dropboxstatic.com",
  "box.com", "boxcdn.net",
  "notion.so", "notion.com",
  "trello.com", "atlassian.com", "atlassian.net", "jira.com",
  // Geliştirici araçları
  "github.com", "github.io", "githubusercontent.com", "githubassets.com",
  "gitlab.com",
  "npmjs.com", "npm.community",
  // Adobe — lisans & CC sunucuları
  "adobe.com", "adobecc.com", "typekit.com", "adobedtm.com", "adobeaemcloud.com",
  // Oyun & eğlence platformları
  "steampowered.com", "steamcontent.com", "steamstatic.com",
  "epicgames.com", "unrealengine.com",
  "ea.com", "eaassets-a.akamaihd.net",
  "battle.net", "blizzard.com",
  // Türkiye e-devlet & kamu
  "turkiye.gov.tr", "e-devlet.com",
  "sgk.gov.tr", "gib.gov.tr", "gib.gov.tr",
  "nvi.gov.tr", "meb.gov.tr", "saglik.gov.tr",
  "btk.gov.tr", "icisleri.gov.tr",
  // Uzak masaüstü & destek araçları
  "anydesk.com", "anydesk.net",
  "teamviewer.com", "teamviewer.net",
  "rustdesk.com",
  "supremocontrol.com",
  "splashtop.com",
  "parsec.app",
  "remotepc.com",
  "showmypc.com",
  // Türk bankaları & finans
  "garanti.com.tr", "garantibbva.com.tr", "garantibbvafilo.com.tr",
  "isbank.com.tr",
  "akbank.com",
  "yapikredi.com.tr", "ykb.com",
  "halkbank.com.tr",
  "ziraatbank.com.tr", "ziraat.com.tr",
  "vakifbank.com.tr",
  "enpara.com", "fibabanka.com.tr",
  "iyzico.com", "paytr.com", "param.com.tr",
]);

// Meşru servis IP aralıkları — feed'e asla girmez
// [network_uint32, mask_uint32]
function ipToU32(ip: string): number {
  return ip.split(".").reduce((a, o) => ((a << 8) + parseInt(o)) >>> 0, 0) >>> 0;
}
const IP_WHITELIST_CIDRS: [number, number][] = [
  // Apple — tüm 17.0.0.0/8 bloğu (Mac, iPhone, iCloud, App Store, güncelleme sunucuları)
  [ipToU32("17.0.0.0"),   0xFF000000],
  // Cloudflare — 1.1.1.0/24, 1.0.0.0/24 (DNS), 104.16.0.0/13, 104.24.0.0/14 (CDN)
  [ipToU32("1.1.1.0"),    0xFFFFFF00],
  [ipToU32("1.0.0.0"),    0xFFFFFF00],
  [ipToU32("104.16.0.0"), 0xFFF80000],
  [ipToU32("104.24.0.0"), 0xFFFC0000],
  // Google DNS & NTP
  [ipToU32("8.8.8.0"),    0xFFFFFF00],
  [ipToU32("8.8.4.0"),    0xFFFFFF00],
  // Fortinet FortiGuard güncelleme sunucuları
  [ipToU32("208.91.112.0"), 0xFFFFF000],
];
function isIpWhitelisted(ip: string): boolean {
  const n = ipToU32(ip.split("/")[0]); // CIDR notasyonunu temizle
  return IP_WHITELIST_CIDRS.some(([net, mask]) => (n & mask) === (net & mask));
}

function isDomainWhitelisted(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DOMAIN_WHITELIST.has(d)) return true;
  // Alt domain kontrolü: "sub.whatsapp.net" → "whatsapp.net" eşleşir
  const parts = d.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    if (DOMAIN_WHITELIST.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

// Türk TLD'leri — uluslararası listelerden bu uzantılar çıkarılır
// USOM zaten Türk tehditleri takip ediyor, Hagezi/StevenBlack bilmiyor
const TR_TLDS = [".tr"];

function hasTurkishTld(domain: string): boolean {
  return TR_TLDS.some(tld => domain.endsWith(tld));
}

// Uluslararası domain kaynakları — Türk TLD'leri filtrelenir
const INTL_DOMAIN_SOURCES: { url: string; fmt: "hosts" | "plain" }[] = [
  { url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts", fmt: "hosts" },
];

// Türkiye güvenlik kaynakları — .com.tr dahil tüm domainler korunur
const TR_DOMAIN_SOURCES: { url: string; fmt: "hosts" | "plain" }[] = [
  { url: "https://www.usom.gov.tr/url-list.txt",                                fmt: "plain" },
  { url: "https://raw.githubusercontent.com/anil-yelken/usom/main/usom-domain.txt", fmt: "plain" },
];

// Tüm IPv4 kaynakları — paralel çekilir, birleştirilir
const IPV4_SOURCES = [
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/1.txt",  // seviye 1 — en kapsamlı
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/2.txt",
  "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
  "https://feodotracker.abuse.ch/downloads/ipblocklist.txt",               // Feodo botnet C2
  "https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt",      // Emerging Threats
  "https://cinsscore.com/list/ci-badguys.txt",                             // CINS Score — bilinen kötü IP'ler
  "https://www.spamhaus.org/drop/drop.txt",                                // Spamhaus DROP — suç örgütü IP blokları
  "https://www.spamhaus.org/drop/edrop.txt",                               // Spamhaus eDROP — genişletilmiş liste
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
    // DELETE + INSERT: unique constraint olmasa da çalışır
    await sb.from("threat_feeds").delete().eq("feed_type", type);
    const { error } = await sb
      .from("threat_feeds")
      .insert({ feed_type: type, content: data, record_count: cnt, updated_at: now });
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

  // Tüm kaynakları paralel çek
  const [usom, intlRes, trRes, ipv4Res, ipv6Res, urlRes] = await Promise.all([
    fetchUsomJson(),
    fetchAndMerge(INTL_DOMAIN_SOURCES, (raw, fmt) => fmt === "hosts" ? parseHosts(raw) : parsePlain(raw)),
    fetchAndMerge(TR_DOMAIN_SOURCES,   (raw, fmt) => fmt === "hosts" ? parseHosts(raw) : parsePlain(raw)),
    fetchAndMergeUrls(IPV4_SOURCES, parseIpv4),
    fetchAndMergeUrls(IPV6_SOURCES, parseIpv6),
    fetchAndMergeUrls(URL_SOURCES,  parsePlain),
  ]);

  // Uluslararası listelerden .tr uzantıları çıkar — USOM zaten Türk tehditleri takip ediyor
  const intlDomains = intlRes.records.filter(d => !hasTurkishTld(d));

  // USOM JSON verilerini diğer kaynaklarla birleştir
  const mergeWithUsom = (base: string[], usom: string[] | undefined) =>
    usom?.length ? [...new Set([...base, ...usom])].sort() : base;

  const domainRecords = mergeWithUsom(
    [...new Set([...intlDomains, ...trRes.records])].sort(),
    usom?.domain
  ).filter(d => !isDomainWhitelisted(d));
  const ipv4Records   = mergeWithUsom(ipv4Res.records,   usom?.ipv4).filter(ip => !isIpWhitelisted(ip));
  const ipv6Records   = mergeWithUsom(ipv6Res.records,   usom?.ipv6);
  const urlRecords    = mergeWithUsom(urlRes.records,     usom?.url);

  const usomLog = usom
    ? `usom-api(d:${usom.domain.length},ip:${usom.ipv4.length},url:${usom.url.length})`
    : "usom-api:blocked";

  const feeds = [
    { type: "domain", records: domainRecords, sources: [...intlRes.sourceLog, ...trRes.sourceLog, usomLog] },
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
