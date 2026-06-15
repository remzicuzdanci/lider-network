import { NextRequest, NextResponse } from "next/server";
import tls from "tls";
import net from "net";

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

  // Autodiscover (Microsoft için kritik)
  const adAns = await doh(`autodiscover.${domain}`, "CNAME");
  const autodiscover = adAns.map(a => a.data.replace(/\.$/, "")).find(Boolean) || null;

  // Sağlayıcı tahmini (MX'e göre)
  let provider = "Bilinmiyor";
  const mxStr = mx.map(m => m.host).join(" ").toLowerCase();
  const spfStr = (spf || "").toLowerCase();
  const dkimSel = dkim.map(d => d.selector);
  if (/google|googlemail|aspmx/.test(mxStr)) provider = "Google Workspace";
  else if (/outlook|office365|microsoft|protection\.outlook/.test(mxStr)) provider = "Microsoft 365 / Exchange";
  else if (/yandex/.test(mxStr)) provider = "Yandex";
  else if (/zoho/.test(mxStr)) provider = "Zoho";
  else if (/protonmail|proton\.me/.test(mxStr)) provider = "Proton";
  else if (mxStr) provider = "Özel / Hosting";

  const chk = (ok: boolean, label: string, found: string, expected: string) => ({ ok, label, found, expected });

  // Google Workspace beklenen yapılandırma
  const gMxOk = /aspmx\.l\.google\.com|smtp\.google\.com|googlemail\.com/.test(mxStr);
  const gSpfOk = /_spf\.google\.com/.test(spfStr);
  const gDkimOk = dkimSel.includes("google");
  const google = {
    detected: gMxOk,
    score: [gMxOk, gSpfOk, gDkimOk, !!dmarc].filter(Boolean).length,
    items: [
      chk(gMxOk, "MX kaydı", mx.map(m => m.host).join(", ") || "—", "smtp.google.com (veya aspmx.l.google.com)"),
      chk(gSpfOk, "SPF", spf || "—", "include:_spf.google.com"),
      chk(gDkimOk, "DKIM", gDkimOk ? "google._domainkey ✓" : "—", "google._domainkey (Workspace > kimlik doğrulama)"),
      chk(!!dmarc, "DMARC", dmarc || "—", "v=DMARC1; p=quarantine/reject"),
    ],
  };

  // Microsoft 365 / Exchange beklenen yapılandırma
  const mMxOk = /mail\.protection\.outlook\.com/.test(mxStr);
  const mSpfOk = /spf\.protection\.outlook\.com/.test(spfStr);
  const mAdOk = !!autodiscover && /outlook\.com/.test(autodiscover.toLowerCase());
  const mDkimOk = dkimSel.includes("selector1") || dkimSel.includes("selector2");
  const microsoft = {
    detected: mMxOk,
    score: [mMxOk, mSpfOk, mAdOk, mDkimOk, !!dmarc].filter(Boolean).length,
    items: [
      chk(mMxOk, "MX kaydı", mx.map(m => m.host).join(", ") || "—", "<domain>.mail.protection.outlook.com"),
      chk(mSpfOk, "SPF", spf || "—", "include:spf.protection.outlook.com"),
      chk(mAdOk, "Autodiscover", autodiscover || "—", "autodiscover.outlook.com (CNAME)"),
      chk(mDkimOk, "DKIM", mDkimOk ? "selector1/2._domainkey ✓" : "—", "selector1 & selector2._domainkey (CNAME)"),
      chk(!!dmarc, "DMARC", dmarc || "—", "v=DMARC1; p=quarantine/reject"),
    ],
  };

  return { mx, spf, dmarc, dkim, provider, hasMx: mx.length > 0, autodiscover, google, microsoft };
}

interface RdapEntity { roles?: string[]; vcardArray?: unknown[] }
interface RdapEvent { eventAction: string; eventDate: string }

// Ham WHOIS sorgusu (port 43)
function whoisRaw(server: string, query: string, timeout = 6000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ""; let settled = false;
    const sock = net.connect(43, server);
    sock.setTimeout(timeout);
    sock.on("connect", () => sock.write(query + "\r\n"));
    sock.on("data", d => { data += d.toString("utf8"); });
    sock.on("end", () => { if (!settled) { settled = true; resolve(data); } });
    sock.on("timeout", () => { sock.destroy(); if (!settled) { settled = true; data ? resolve(data) : reject(new Error("timeout")); } });
    sock.on("error", e => { if (!settled) { settled = true; reject(e); } });
  });
}
async function whoisLookup(domain: string): Promise<string> {
  const tld = domain.split(".").pop() || "";
  const known: Record<string, string> = { tr: "whois.trabis.gov.tr" };
  let server = known[tld] || "";
  if (!server) {
    try {
      const iana = await whoisRaw("whois.iana.org", tld);
      const m = iana.match(/refer:\s*(\S+)/i);
      if (m) server = m[1];
    } catch { /* yoksa aşağıda boş kalır */ }
  }
  if (!server) throw new Error("whois sunucusu bulunamadı");
  return whoisRaw(server, domain);
}
function parseWhois(text: string) {
  const pick = (re: RegExp) => { const m = text.match(re); return m ? m[1].trim() : null; };
  const registrar = pick(/Organization Name[.\s]*:\s*(.+)/i) || pick(/Registrar[^\n:]*:\s*(.+)/i) || pick(/Sponsoring Registrar[^\n:]*:\s*(.+)/i);
  const created = pick(/Created on[.\s]*:\s*(.+)/i) || pick(/Creation Date[.\s]*:\s*(.+)/i) || pick(/Created[.\s]*:\s*(.+)/i);
  const expires = pick(/Expires on[.\s]*:\s*(.+)/i) || pick(/Expir\w*\s*Date[.\s]*:\s*(.+)/i) || pick(/Expiry[.\s]*:\s*(.+)/i);
  const updated = pick(/Updated Date[.\s]*:\s*(.+)/i) || pick(/Last Updated[.\s]*:\s*(.+)/i);
  // Name server'lar
  const ns = new Set<string>();
  const nsRe = /(?:Name Server|Domain Server)[s]?[.\s]*:?\s*([a-z0-9.-]+\.[a-z]{2,})/gi;
  let mm: RegExpExecArray | null;
  while ((mm = nsRe.exec(text))) ns.add(mm[1].toLowerCase());
  // nic.tr blok formatı: "** Domain Servers:" sonrası satırlar
  const blk = text.split(/\*\*\s*Domain Servers?:/i)[1];
  if (blk) for (const line of blk.split("\n").slice(0, 12)) { const h = line.trim().match(/^([a-z0-9.-]+\.[a-z]{2,})/i); if (h) ns.add(h[1].toLowerCase()); else if (/\*\*/.test(line)) break; }
  const statusM = [...text.matchAll(/Status[.\s]*:\s*(.+)/gi)].map(x => x[1].trim()).slice(0, 6);
  return { registrar, created, updated, expires, nameservers: [...ns].slice(0, 8), status: statusM };
}

async function getWhois(domain: string) {
  // 1) RDAP (gTLD'ler için en temiz, yapısal)
  try {
    const r = await fetch(`https://rdap.org/domain/${domain}`, { headers: { accept: "application/rdap+json" }, redirect: "follow", cache: "no-store" });
    if (r.ok) {
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
        source: "RDAP",
        domain: j.ldhName || domain,
        status: (j.status || []) as string[],
        registrar,
        created: ev("registration"),
        updated: ev("last changed"),
        expires: ev("expiration"),
        nameservers: ((j.nameservers || []) as { ldhName?: string }[]).map(n => (n.ldhName || "").toLowerCase()),
        dnssec: j.secureDNS?.delegationSigned ?? null,
      };
    }
  } catch { /* RDAP yoksa port-43'e düş */ }

  // 2) Port-43 WHOIS (.tr ve RDAP olmayan uzantılar)
  try {
    const text = await whoisLookup(domain);
    if (text && text.trim().length > 20) {
      const p = parseWhois(text);
      return {
        source: "WHOIS",
        domain,
        registrar: p.registrar,
        created: p.created,
        updated: p.updated,
        expires: p.expires,
        status: p.status,
        nameservers: p.nameservers,
        dnssec: null,
        raw: text.replace(/\r/g, "").trim().slice(0, 4000),
      };
    }
  } catch { /* aşağıda hata döner */ }

  return { error: "WHOIS bilgisi alınamadı. Sunucu yanıt vermedi veya bu uzantı sorgulanamıyor." };
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
