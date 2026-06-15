import { NextRequest, NextResponse } from "next/server";
import tls from "tls";

export const runtime = "nodejs";
export const maxDuration = 20;

/* ── Lider Network DNS Aracı API'si ──────────────────────────────
   GET /api/dns?domain=example.com&type=records|mail|whois|ssl|propagation
   Tümü HTTPS tabanlı (DoH + RDAP + TLS) — ekstra altyapı gerektirmez.
─────────────────────────────────────────────────────────────────── */

function cleanDomain(raw: string): string {
  let d = (raw || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  d = d.split("@").pop() || d; // e-posta verildiyse domain'i al
  return d.replace(/[^a-z0-9.-]/g, "");
}
function isValidDomain(d: string): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d);
}

interface DohAnswer { name: string; type: number; TTL: number; data: string }
async function doh(name: string, type: string): Promise<DohAnswer[]> {
  try {
    const u = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
    const r = await fetch(u, { headers: { accept: "application/dns-json" }, cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.Answer || []) as DohAnswer[];
  } catch { return []; }
}
const unq = (s: string) => s.replace(/^"|"$/g, "").replace(/" "/g, "");

async function getRecords(domain: string) {
  const types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "CAA"];
  const out: Record<string, { value: string; ttl: number; priority?: number }[]> = {};
  await Promise.all(types.map(async t => {
    const ans = await doh(domain, t);
    out[t] = ans.filter(a => a.data).map(a => {
      if (t === "MX") {
        const [pr, host] = a.data.split(/\s+/);
        return { value: (host || "").replace(/\.$/, ""), ttl: a.TTL, priority: Number(pr) || 0 };
      }
      return { value: t === "TXT" ? unq(a.data) : a.data.replace(/\.$/, t === "A" || t === "AAAA" ? "" : ""), ttl: a.TTL };
    });
  }));
  return out;
}

async function getMail(domain: string) {
  const mxAns = await doh(domain, "MX");
  const mx = mxAns.filter(a => a.data).map(a => {
    const [pr, host] = a.data.split(/\s+/);
    return { priority: Number(pr) || 0, host: (host || "").replace(/\.$/, "") };
  }).sort((a, b) => a.priority - b.priority);

  const txtAns = await doh(domain, "TXT");
  const txts = txtAns.map(a => unq(a.data));
  const spf = txts.find(t => /^v=spf1/i.test(t)) || null;

  const dmarcAns = await doh(`_dmarc.${domain}`, "TXT");
  const dmarc = dmarcAns.map(a => unq(a.data)).find(t => /v=DMARC1/i.test(t)) || null;

  const selectors = ["google", "default", "selector1", "selector2", "k1", "s1", "s2", "dkim", "mail", "mandrill", "mxvault", "zoho", "protonmail", "protonmail2", "protonmail3", "fm1", "fm2"];
  const dkim: { selector: string; value: string }[] = [];
  await Promise.all(selectors.map(async sel => {
    const ans = await doh(`${sel}._domainkey.${domain}`, "TXT");
    const v = ans.map(a => unq(a.data)).find(t => /v=DKIM1|(^|;)\s*p=/i.test(t));
    if (v) dkim.push({ selector: sel, value: v });
  }));

  // Sağlayıcı tahmini (MX'e göre)
  let provider = "Bilinmiyor";
  const mxStr = mx.map(m => m.host).join(" ").toLowerCase();
  if (/google|googlemail|aspmx/.test(mxStr)) provider = "Google Workspace";
  else if (/outlook|office365|microsoft/.test(mxStr)) provider = "Microsoft 365";
  else if (/yandex/.test(mxStr)) provider = "Yandex";
  else if (/zoho/.test(mxStr)) provider = "Zoho";
  else if (/protonmail/.test(mxStr)) provider = "Proton";
  else if (mxStr) provider = "Özel / Hosting";

  return { mx, spf, dmarc, dkim, provider, hasMx: mx.length > 0 };
}

interface RdapEntity { roles?: string[]; vcardArray?: unknown[] }
interface RdapEvent { eventAction: string; eventDate: string }
async function getWhois(domain: string) {
  try {
    const r = await fetch(`https://rdap.org/domain/${domain}`, { headers: { accept: "application/rdap+json" }, redirect: "follow", cache: "no-store" });
    if (!r.ok) return { error: "WHOIS bilgisi alınamadı (bu uzantı RDAP desteklemiyor olabilir, ör. .com.tr)." };
    const j = await r.json();
    const events: RdapEvent[] = j.events || [];
    const ev = (a: string) => events.find(e => e.eventAction === a)?.eventDate || null;
    let registrar: string | null = null;
    for (const e of (j.entities || []) as RdapEntity[]) {
      if (e.roles?.includes("registrar")) {
        const vc = (e.vcardArray?.[1] as unknown[]) || [];
        const fn = (vc as unknown[]).find((x) => Array.isArray(x) && (x as unknown[])[0] === "fn") as unknown[] | undefined;
        registrar = (fn?.[3] as string) || null;
      }
    }
    return {
      domain: j.ldhName || domain,
      status: (j.status || []) as string[],
      registrar,
      created: ev("registration"),
      updated: ev("last changed"),
      expires: ev("expiration"),
      nameservers: ((j.nameservers || []) as { ldhName?: string }[]).map(n => (n.ldhName || "").toLowerCase()),
      dnssec: j.secureDNS?.delegationSigned ?? null,
    };
  } catch {
    return { error: "WHOIS sorgusu başarısız oldu." };
  }
}

function getSsl(domain: string): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: Record<string, unknown>) => { if (!settled) { settled = true; resolve(v); } };
    try {
      const socket = tls.connect({ host: domain, port: 443, servername: domain, timeout: 8000 }, () => {
        const c = socket.getPeerCertificate();
        socket.end();
        if (!c || !c.valid_to) return done({ error: "Sertifika alınamadı." });
        const validTo = new Date(c.valid_to);
        const validFrom = new Date(c.valid_from);
        const days = Math.ceil((validTo.getTime() - Date.now()) / 86400000);
        done({
          subject: c.subject?.CN || domain,
          issuer: c.issuer?.O || c.issuer?.CN || "—",
          valid_from: validFrom.toISOString(),
          valid_to: validTo.toISOString(),
          daysRemaining: days,
          valid: days > 0,
          san: (c.subjectaltname || "").replace(/DNS:/g, "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 30),
        });
      });
      socket.on("timeout", () => { socket.destroy(); done({ error: "Bağlantı zaman aşımı (443 portu kapalı olabilir)." }); });
      socket.on("error", (e) => done({ error: "SSL bağlantısı kurulamadı: " + e.message }));
    } catch (e) {
      done({ error: e instanceof Error ? e.message : "SSL hatası" });
    }
  });
}

async function getPropagation(domain: string) {
  const resolvers = [
    { name: "Google", flag: "🇺🇸", url: (n: string) => `https://dns.google/resolve?name=${n}&type=A` },
    { name: "Cloudflare", flag: "🌐", url: (n: string) => `https://cloudflare-dns.com/dns-query?name=${n}&type=A` },
    { name: "AdGuard", flag: "🇨🇾", url: (n: string) => `https://dns.adguard-dns.com/resolve?name=${n}&type=A` },
    { name: "DNS.SB", flag: "🇩🇪", url: (n: string) => `https://doh.sb/dns-query?name=${n}&type=A` },
  ];
  const results = await Promise.all(resolvers.map(async r => {
    try {
      const res = await fetch(r.url(domain), { headers: { accept: "application/dns-json" }, cache: "no-store" });
      if (!res.ok) return { name: r.name, flag: r.flag, ok: false, ips: [] as string[] };
      const j = await res.json();
      const ips = ((j.Answer || []) as DohAnswer[]).filter(a => a.type === 1).map(a => a.data);
      return { name: r.name, flag: r.flag, ok: ips.length > 0, ips };
    } catch { return { name: r.name, flag: r.flag, ok: false, ips: [] as string[] }; }
  }));
  const allIps = new Set(results.flatMap(r => r.ips));
  return { results, consistent: allIps.size <= 1, distinct: [...allIps] };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const domain = cleanDomain(sp.get("domain") || "");
  const type = sp.get("type") || "records";
  if (!domain || !isValidDomain(domain)) {
    return NextResponse.json({ error: "Geçerli bir alan adı girin (ör. example.com)" }, { status: 400 });
  }

  try {
    let data: unknown;
    switch (type) {
      case "records":     data = await getRecords(domain); break;
      case "mail":        data = await getMail(domain); break;
      case "whois":       data = await getWhois(domain); break;
      case "ssl":         data = await getSsl(domain); break;
      case "propagation": data = await getPropagation(domain); break;
      default: return NextResponse.json({ error: "Geçersiz sorgu tipi" }, { status: 400 });
    }
    return NextResponse.json({ domain, type, data });
  } catch (e) {
    return NextResponse.json({ error: "Sorgu başarısız: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }
}
