/**
 * Lider Network — USOM Threat Feed Worker
 * Cloudflare Workers üzerinde çalışır, her 2 saatte bir USOM + diğer kaynaklardan
 * tehdit verisi çekip Supabase'e yazar.
 *
 * Environment Variables (Worker Settings → Variables):
 *   SUPABASE_URL  → https://xxx.supabase.co
 *   SUPABASE_KEY  → service_role key
 */

const BATCH = 8; // Paralel USOM sayfa isteği

export default {
  // Cron trigger (her 2 saatte bir)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },

  // Manuel tetikleme: Worker URL'sine GET /run
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/run") {
      ctx.waitUntil(run(env));
      return new Response("Feed güncelleme başlatıldı ✓", { status: 200 });
    }
    return new Response("USOM Feed Worker — /run ile manuel tetikle");
  },
};

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────
async function run(env) {
  const buckets = {
    domain: new Set(),
    ipv4:   new Set(),
    ipv6:   new Set(),
    url:    new Set(),
  };

  // 1. USOM API
  console.log("USOM API çekiliyor...");
  let usom_ok = false;
  try {
    const first = await fetchJSON(
      "https://www.usom.gov.tr/api/address/index.json?page=1&per-page=2000"
    );
    if (first) {
      const p    = first.meta?.pagination ?? {};
      const total = parseInt(p["page-count"] || p["total-pages"] || p["pageCount"] || "1");
      console.log(`Toplam sayfa: ${total}`);

      processItems(first.data ?? [], buckets);

      // Kalan sayfaları paralel batch'ler halinde çek
      for (let s = 2; s <= total; s += BATCH) {
        const pages = Array.from(
          { length: Math.min(BATCH, total - s + 1) },
          (_, i) =>
            fetchJSON(
              `https://www.usom.gov.tr/api/address/index.json?page=${s + i}&per-page=2000`
            )
        );
        const results = await Promise.allSettled(pages);
        for (const r of results) {
          if (r.status === "fulfilled" && r.value)
            processItems(r.value.data ?? [], buckets);
        }
        if (s % 40 === 2) console.log(`  Sayfa ${s}/${total}...`);
      }

      usom_ok = true;
      console.log(
        `USOM OK — domain:${buckets.domain.size} ipv4:${buckets.ipv4.size} ipv6:${buckets.ipv6.size} url:${buckets.url.size}`
      );
    }
  } catch (e) {
    console.error("USOM hatası:", e.message);
  }

  // 2. Fallback (USOM erişilemezse)
  if (!usom_ok) {
    console.log("Fallback: StevenBlack/hosts çekiliyor...");
    const hosts = await fetchText(
      "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
    );
    if (hosts) {
      for (const line of hosts.split("\n")) {
        if (line.startsWith("0.0.0.0 ")) {
          const parts = line.trim().split(/\s+/);
          const d = parts[1];
          if (d && d !== "0.0.0.0" && d !== "localhost") buckets.domain.add(d);
        }
      }
    }

    console.log("Fallback: stamparm/ipsum IPv4...");
    const ipsum = await fetchText(
      "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt"
    );
    if (ipsum) {
      for (const line of ipsum.split("\n")) {
        const l = line.trim();
        if (!l || l.startsWith("#")) continue;
        const ip = l.split(/\s+/)[0];
        if (ip.includes(":")) buckets.ipv6.add(ip);
        else buckets.ipv4.add(ip);
      }
    }
  }

  // 3. Feodo Tracker (botnet C2 IP'leri)
  console.log("Feodo Tracker çekiliyor...");
  const feodo = await fetchText(
    "https://feodotracker.abuse.ch/downloads/ipblocklist.txt"
  );
  if (feodo) {
    const before = buckets.ipv4.size;
    for (const line of feodo.split("\n")) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      const ip = l.split(/\s+/)[0];
      if (/^\d{1,3}(\.\d{1,3}){3}/.test(ip)) buckets.ipv4.add(ip);
    }
    console.log(`  Feodo: +${buckets.ipv4.size - before} IP`);
  }

  // 4. CINS Score
  console.log("CINS Score çekiliyor...");
  const cins = await fetchText("https://cinsscore.com/list/ci-badguys.txt");
  if (cins) {
    const before = buckets.ipv4.size;
    for (const line of cins.split("\n")) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      if (/^\d{1,3}(\.\d{1,3}){3}/.test(l)) buckets.ipv4.add(l);
    }
    console.log(`  CINS: +${buckets.ipv4.size - before} IP`);
  }

  // 5. URLhaus
  console.log("URLhaus URL çekiliyor...");
  const urlhaus = await fetchText("https://urlhaus.abuse.ch/downloads/text/");
  if (urlhaus) {
    const before = buckets.url.size;
    for (const line of urlhaus.split("\n")) {
      const l = line.trim();
      if (l && !l.startsWith("#") && l.startsWith("http")) buckets.url.add(l);
    }
    console.log(`  URLhaus: +${buckets.url.size - before} URL`);
  }

  // 6. Supabase'e yaz
  console.log("Supabase'e yazılıyor...");
  let errors = 0;

  for (const [type, set] of Object.entries(buckets)) {
    const records = [...set].sort();
    const ok = await supabaseUpsert(env, type, records);
    if (!ok) errors++;
    console.log(`  ${ok ? "✓" : "✗"} ${type}: ${records.length} kayıt`);
  }

  // 7. Lite feed'ler (domain + ipv4)
  console.log("Lite feed'ler yazılıyor...");
  const liteWindows = [
    ["90d",  0.25],
    ["180d", 0.50],
    ["365d", 1.00],
  ];
  for (const type of ["domain", "ipv4"]) {
    const all = [...buckets[type]].sort();
    for (const [key, ratio] of liteWindows) {
      const slice = all.slice(0, Math.ceil(all.length * ratio));
      const ok = await supabaseUpsert(env, `${type}_${key}`, slice);
      if (!ok) errors++;
      console.log(`  ${ok ? "✓" : "✗"} ${type}_${key}: ${slice.length} kayıt`);
    }
  }

  const total = [...Object.values(buckets)].reduce((s, set) => s + set.size, 0);
  console.log(
    `Tamamlandı — Toplam: ${total} kayıt | Hata: ${errors} | Kaynak: ${usom_ok ? "USOM/SGB" : "Fallback"} + Feodo + CINS + URLhaus`
  );
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
function classify(type, value) {
  const t = (type || "").toLowerCase().trim();
  const v = (value || "").trim();
  if (!v) return null;
  if (t === "domain") return "domain";
  if (t === "url")    return "url";
  if (t === "ip")     return v.includes(":") ? "ipv6" : "ipv4";
  if (v.startsWith("http")) return "url";
  if (v.includes(":"))      return "ipv6";
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
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer":    "https://www.usom.gov.tr/",
      },
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
        "Accept":     "application/json",
        "Referer":    "https://www.usom.gov.tr/",
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
        "apikey":        env.SUPABASE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_KEY}`,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{
        feed_type:    feedType,
        content:      records.join("\n"),
        record_count: records.length,
        updated_at:   new Date().toISOString(),
      }]),
      signal: AbortSignal.timeout(30_000),
    });
    return r.ok;
  } catch { return false; }
}
