/**
 * Lider Network — SGB/USOM Threat Feed Worker
 * Environment Variables: SUPABASE_URL, SUPABASE_KEY
 */

const BATCH = 8;
const MAX_SGB_PAGES = 240;

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/run") {
      ctx.waitUntil(run(env));
      return new Response("Feed güncelleme başlatıldı ✓", { status: 200 });
    }
    if (pathname === "/debug") {
      const log = [];
      try {
        const r = await fetch("https://siberguvenlik.gov.tr/api/address/index?page=1&per-page=100", {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
          signal: AbortSignal.timeout(10000)
        });
        const data = await r.json();
        log.push(`SGB Status: ${r.status}, totalCount: ${data.totalCount}, count: ${data.count}`);
        const wb = await fetch(`${env.SUPABASE_URL}/rest/v1/threat_feeds`, {
          method: "POST",
          headers: {
            "apikey": env.SUPABASE_KEY,
            "Authorization": `Bearer ${env.SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify([{ feed_type: "debug_test", content: "test", record_count: 1, updated_at: new Date().toISOString() }]),
        });
        log.push(`Supabase write: ${wb.status}`);
      } catch(e) { log.push(`HATA: ${e.message}`); }
      return new Response(log.join("\n"), { status: 200 });
    }
    return new Response("SGB/USOM Feed Worker — /run ile manuel tetikle");
  },
};

async function run(env) {
  const buckets = { domain: new Set(), ipv4: new Set(), ipv6: new Set(), url: new Set() };

  // 1. SGB API (siberguvenlik.gov.tr)
  console.log("SGB API çekiliyor...");
  let usom_ok = false;
  try {
    const pageSize = 2000;
    const first = await fetchJSON(
      `https://siberguvenlik.gov.tr/api/address/index?page=1&per-page=${pageSize}`
    );
    if (first && first.totalCount) {
      const total = Math.min(Math.ceil(first.totalCount / pageSize), MAX_SGB_PAGES);
      console.log(`Toplam: ${first.totalCount} kayıt, ${total} sayfa çekilecek`);
      processItems(first.models ?? [], buckets);
      for (let s = 2; s <= total; s += BATCH) {
        const pages = Array.from(
          { length: Math.min(BATCH, total - s + 1) },
          (_, i) => fetchJSON(`https://siberguvenlik.gov.tr/api/address/index?page=${s + i}&per-page=${pageSize}`)
        );
        const results = await Promise.allSettled(pages);
        for (const r of results)
          if (r.status === "fulfilled" && r.value) processItems(r.value.models ?? [], buckets);
        if (s % 40 === 2) console.log(`  Sayfa ${s}/${total}...`);
      }
      usom_ok = true;
      console.log(`SGB OK — domain:${buckets.domain.size} ipv4:${buckets.ipv4.size} ipv6:${buckets.ipv6.size} url:${buckets.url.size}`);
    }
  } catch (e) { console.error("SGB hatası:", e.message); }

  // 2. Fallback
  if (!usom_ok) {
    console.log("Fallback: StevenBlack/hosts...");
    const hosts = await fetchText("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts");
    if (hosts) for (const line of hosts.split("\n")) {
      if (line.startsWith("0.0.0.0 ")) {
        const d = line.trim().split(/\s+/)[1];
        if (d && d !== "0.0.0.0" && d !== "localhost") buckets.domain.add(d);
      }
    }
    const ipsum = await fetchText("https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt");
    if (ipsum) for (const line of ipsum.split("\n")) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      const ip = l.split(/\s+/)[0];
      if (ip.includes(":")) buckets.ipv6.add(ip); else buckets.ipv4.add(ip);
    }
  }

  // 3. Feodo Tracker
  console.log("Feodo Tracker çekiliyor...");
  const feodo = await fetchText("https://feodotracker.abuse.ch/downloads/ipblocklist.txt");
  if (feodo) for (const line of feodo.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const ip = l.split(/\s+/)[0];
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(ip)) buckets.ipv4.add(ip);
  }

  // 4. CINS Score
  console.log("CINS Score çekiliyor...");
  const cins = await fetchText("https://cinsscore.com/list/ci-badguys.txt");
  if (cins) for (const line of cins.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(l)) buckets.ipv4.add(l);
  }

  // 5. URLhaus
  console.log("URLhaus çekiliyor...");
  const urlhaus = await fetchText("https://urlhaus.abuse.ch/downloads/text/");
  if (urlhaus) for (const line of urlhaus.split("\n")) {
    const l = line.trim();
    if (l && !l.startsWith("#") && l.startsWith("http")) buckets.url.add(l);
  }

  // 6. ThreatFox (abuse.ch)
  console.log("ThreatFox çekiliyor...");
  try {
    const tf = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ query: "get_iocs", days: 90 }),
      signal: AbortSignal.timeout(30_000),
    });
    const tfData = await tf.json();
    if (tfData.query_status === "ok" && tfData.data) {
      const before = { d: buckets.domain.size, i: buckets.ipv4.size, u: buckets.url.size };
      for (const ioc of tfData.data) {
        const val = (ioc.ioc || "").trim();
        if (!val) continue;
        if (ioc.ioc_type === "domain") buckets.domain.add(val);
        else if (ioc.ioc_type === "url") buckets.url.add(val);
        else if (ioc.ioc_type === "ip:port") {
          const ip = val.split(":")[0];
          if (/^\d{1,3}(\.\d{1,3}){3}/.test(ip)) buckets.ipv4.add(ip);
          else if (ip.includes(":")) buckets.ipv6.add(ip);
        }
      }
      console.log(`  ThreatFox: +${buckets.domain.size - before.d} domain, +${buckets.ipv4.size - before.i} IP, +${buckets.url.size - before.u} URL`);
    }
  } catch(e) { console.error("ThreatFox hatası:", e.message); }

  // 7. EmergingThreats compromised IPs
  console.log("EmergingThreats çekiliyor...");
  const et = await fetchText("https://rules.emergingthreats.net/blockrules/compromised-ips.txt");
  if (et) {
    const before = buckets.ipv4.size;
    for (const line of et.split("\n")) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      if (/^\d{1,3}(\.\d{1,3}){3}/.test(l)) buckets.ipv4.add(l);
    }
    console.log(`  EmergingThreats: +${buckets.ipv4.size - before} IP`);
  }

  // 8. OpenPhish
  console.log("OpenPhish çekiliyor...");
  const openphish = await fetchText("https://openphish.com/feed.txt");
  if (openphish) {
    const before = buckets.url.size;
    for (const line of openphish.split("\n")) {
      const l = line.trim();
      if (l && l.startsWith("http")) buckets.url.add(l);
    }
    console.log(`  OpenPhish: +${buckets.url.size - before} URL`);
  }

  // 9. Spamhaus DROP
  console.log("Spamhaus DROP çekiliyor...");
  for (const url of [
    "https://www.spamhaus.org/drop/drop.txt",
    "https://www.spamhaus.org/drop/edrop.txt",
  ]) {
    const drop = await fetchText(url);
    if (drop) {
      const before = buckets.ipv4.size;
      for (const line of drop.split("\n")) {
        const l = line.trim().split(";")[0].trim();
        if (!l || l.startsWith(";") || l.startsWith("#")) continue;
        const ip = l.split("/")[0];
        if (/^\d{1,3}(\.\d{1,3}){3}/.test(ip)) buckets.ipv4.add(ip);
      }
      console.log(`  Spamhaus: +${buckets.ipv4.size - before} IP`);
    }
  }

  // 10. Supabase'e yaz
  console.log("Supabase'e yazılıyor...");
  let errors = 0;
  for (const [type, set] of Object.entries(buckets)) {
    const records = [...set].sort();
    const ok = await supabaseUpsert(env, type, records);
    if (!ok) errors++;
    console.log(`  ${ok ? "✓" : "✗"} ${type}: ${records.length} kayıt`);
  }

  // 11. Lite feed'ler
  for (const type of ["domain", "ipv4"]) {
    const all = [...buckets[type]].sort();
    for (const [key, ratio] of [["90d", 0.25], ["180d", 0.50], ["365d", 1.00]]) {
      const slice = all.slice(0, Math.ceil(all.length * ratio));
      const ok = await supabaseUpsert(env, `${type}_${key}`, slice);
      if (!ok) errors++;
    }
  }

  const total = [...Object.values(buckets)].reduce((s, set) => s + set.size, 0);
  console.log(`Tamamlandı — ${total} kayıt | Hata: ${errors} | Kaynak: ${usom_ok ? "SGB" : "Fallback"} + Feodo + CINS + URLhaus + ThreatFox + ET + OpenPhish + Spamhaus`);
}

function classify(type, value) {
  const t = (type || "").toLowerCase().trim();
  const v = (value || "").trim();
  if (!v) return null;
  if (t === "domain") return "domain";
  if (t === "url") return "url";
  if (t === "ip") return v.includes(":") ? "ipv6" : "ipv4";
  if (v.startsWith("http")) return "url";
  if (v.includes(":")) return "ipv6";
  if (/^\d{1,3}(\.\d{1,3}){3}/.test(v)) return "ipv4";
  if (v.includes(".")) return "domain";
  return null;
}

function processItems(items, buckets) {
  for (const item of items) {
    const v = (item.url || "").trim();
    if (!v) continue;
    const cat = classify(item.type, v);
    if (cat) buckets[cat].add(v);
  }
}

async function fetchText(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(30_000),
    });
    return r.ok ? r.text() : null;
  } catch { return null; }
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function supabaseUpsert(env, feedType, records) {
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/threat_feeds`, {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{
        feed_type: feedType,
        content: records.join("\n"),
        record_count: records.length,
        updated_at: new Date().toISOString(),
      }]),
      signal: AbortSignal.timeout(60_000),
    });
    return r.ok;
  } catch { return false; }
}
