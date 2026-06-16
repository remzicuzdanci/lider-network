import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

export const runtime = "nodejs";
export const maxDuration = 25;

const CORS = { "Access-Control-Allow-Origin": "*" };

/* ── DNSBL Listesi ─────────────────────────────────────────── */
export const LISTS = [
  // Spamhaus
  { zone: "zen.spamhaus.org",       name: "Spamhaus ZEN",      cat: "Spam",    desc: "SBL+XBL+PBL birleşik — en önemli liste" },
  { zone: "sbl.spamhaus.org",       name: "Spamhaus SBL",      cat: "Spam",    desc: "Doğrudan spam kaynakları" },
  { zone: "xbl.spamhaus.org",       name: "Spamhaus XBL",      cat: "Exploit", desc: "Ele geçirilmiş / malware enfekte makineler" },
  { zone: "pbl.spamhaus.org",       name: "Spamhaus PBL",      cat: "Policy",  desc: "ISP'nin son kullanıcı politika listesi" },
  // SpamCop
  { zone: "bl.spamcop.net",         name: "SpamCop",           cat: "Spam",    desc: "Kullanıcı raporlarına dayalı spam listesi" },
  // Barracuda
  { zone: "b.barracudacentral.org", name: "Barracuda BRBL",    cat: "Spam",    desc: "Barracuda Networks itibar listesi" },
  // SORBS
  { zone: "dnsbl.sorbs.net",        name: "SORBS Birleşik",    cat: "Spam",    desc: "SORBS tüm listeler" },
  { zone: "spam.dnsbl.sorbs.net",   name: "SORBS Spam",        cat: "Spam",    desc: "SORBS spam kaynak listesi" },
  { zone: "dul.dnsbl.sorbs.net",    name: "SORBS DUL",         cat: "DUL",     desc: "Dinamik kullanıcı IP'leri" },
  { zone: "smtp.dnsbl.sorbs.net",   name: "SORBS SMTP",        cat: "Spam",    desc: "Yetkisiz SMTP relay'ler" },
  // UCEPROTECT
  { zone: "dnsbl-1.uceprotect.net", name: "UCEPROTECT L1",     cat: "Spam",    desc: "Bireysel IP seviyesi" },
  { zone: "dnsbl-2.uceprotect.net", name: "UCEPROTECT L2",     cat: "Spam",    desc: "C sınıfı ağ bloğu seviyesi" },
  { zone: "dnsbl-3.uceprotect.net", name: "UCEPROTECT L3",     cat: "Spam",    desc: "ASN (otonom sistem) seviyesi" },
  // CBL / Abusix
  { zone: "cbl.abuseat.org",        name: "CBL / Abusix",      cat: "Exploit", desc: "Composite Blocking List — botnet/spam makineleri" },
  // SpamRats
  { zone: "all.spamrats.com",       name: "SpamRats",          cat: "Spam",    desc: "SpamRats birleşik liste" },
  { zone: "spam.spamrats.com",      name: "SpamRats Spam",     cat: "Spam",    desc: "Doğrudan spam göndericiler" },
  { zone: "dyna.spamrats.com",      name: "SpamRats Dyna",     cat: "DUL",     desc: "Dinamik IP'ler" },
  { zone: "noptr.spamrats.com",     name: "SpamRats NoPTR",    cat: "Policy",  desc: "PTR kaydı olmayan IP'ler" },
  // MailSpike
  { zone: "bl.mailspike.net",       name: "MailSpike BL",      cat: "Spam",    desc: "MailSpike kara liste" },
  { zone: "z.mailspike.net",        name: "MailSpike Z",       cat: "Spam",    desc: "MailSpike sıfır itibar" },
  // DroneBL
  { zone: "dnsbl.dronebl.org",      name: "DroneBL",           cat: "Exploit", desc: "IRC bot, proxy ve exploit'li IP'ler" },
  // PSBL
  { zone: "psbl.surriel.com",       name: "PSBL",              cat: "Spam",    desc: "Passive Spam Block List" },
  // GBUdb
  { zone: "truncate.gbudb.net",     name: "GBUdb Truncate",    cat: "Spam",    desc: "GBUdb anlık spam listesi" },
  // WPBL
  { zone: "db.wpbl.info",           name: "WPBL",              cat: "Spam",    desc: "Weighted Private Block List" },
  // Manitu
  { zone: "ix.dnsbl.manitu.net",    name: "Manitu NiX Spam",   cat: "Spam",    desc: "Alman NiX Spam DNSBL" },
  // 0spam
  { zone: "bl.0spam.org",           name: "0spam",             cat: "Spam",    desc: "0spam kara liste" },
  // SPFBL
  { zone: "dnsbl.spfbl.net",        name: "SPFBL",             cat: "Policy",  desc: "SPFBL politika listesi" },
  // MegaRBL
  { zone: "rbl.megarbl.net",        name: "MegaRBL",           cat: "Spam",    desc: "MegaRBL birleşik" },
  // Woody's
  { zone: "blacklist.woody.ch",     name: "Woody's Blacklist", cat: "Spam",    desc: "İsviçre bazlı SMTP kara listesi" },
  // RBLDNS.ru
  { zone: "rbl.rbldns.ru",          name: "RBLDNS.ru",         cat: "Spam",    desc: "Rusya bazlı DNSBL" },
];

function reverseIp(ip: string): string {
  return ip.split(".").reverse().join(".");
}

function isValidIpv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split(".").every(n => +n <= 255);
}

function isDomain(s: string): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(s);
}

async function checkOne(query: string, zone: string): Promise<{ listed: boolean; response: string | null }> {
  const lookup = `${query}.${zone}`;
  try {
    const addrs = await Promise.race([
      dns.resolve4(lookup),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return { listed: true, response: (addrs as string[])[0] || null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "timeout") return { listed: false, response: "timeout" };
    return { listed: false, response: null };
  }
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ip") || "").trim();
  if (!raw) return NextResponse.json({ error: "ip parametresi gerekli" }, { status: 400, headers: CORS });

  let ip = raw;

  // Domain → IP çözümle
  if (!isValidIpv4(raw) && isDomain(raw)) {
    try {
      const addrs = await dns.resolve4(raw);
      if (!addrs[0]) throw new Error("no addr");
      ip = addrs[0];
    } catch {
      return NextResponse.json({ error: `"${raw}" için A kaydı bulunamadı` }, { status: 404, headers: CORS });
    }
  } else if (!isValidIpv4(raw)) {
    return NextResponse.json({ error: "Geçersiz IPv4 adresi veya domain" }, { status: 400, headers: CORS });
  }

  const reversed = reverseIp(ip);

  const results = await Promise.all(
    LISTS.map(async (l) => {
      const r = await checkOne(reversed, l.zone);
      return { zone: l.zone, name: l.name, cat: l.cat, desc: l.desc, ...r };
    })
  );

  const listed = results.filter(r => r.listed).length;
  const clean  = results.filter(r => !r.listed && r.response !== "timeout").length;
  const errors = results.filter(r => r.response === "timeout").length;

  return NextResponse.json({ ip, query: raw, listed, clean, errors, total: results.length, results }, { headers: CORS });
}
