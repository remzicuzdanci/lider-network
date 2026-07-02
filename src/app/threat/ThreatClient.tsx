"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  bg:       "#070d1c",
  bg2:      "#0c1427",
  surface:  "#111d35",
  surface2: "#162240",
  border:   "#1f3155",
  borderLo: "#172545",
  text:     "#e8f0ff",
  sub:      "#7a93c0",
  dim:      "#38527a",
  blue:     "#4d8cf5",
  green:    "#1ed98a",
  red:      "#f24f6a",
  amber:    "#f5a623",
  teal:     "#12d4ef",
  purple:   "#a46fff",
  orange:   "#ff8c42",
};

const FEEDS = [
  { key: "domain", label: "Domain",  icon: "🌐", color: C.blue,   desc: "Zararlı alan adları",    src: "SGB · USOM" },
  { key: "ipv4",   label: "IPv4",    icon: "🖥",  color: C.teal,   desc: "Zararlı IP adresleri",   src: "SGB · Feodo · CINS · ET · Spamhaus" },
  { key: "url",    label: "URL",     icon: "🔗",  color: C.purple, desc: "Zararlı URL'ler",        src: "SGB · URLhaus · ThreatFox · OpenPhish" },
  { key: "ipv6",   label: "IPv6",    icon: "⬡",   color: C.amber,  desc: "Zararlı IPv6 adresleri", src: "SGB" },
];

const LITE_WINDOWS = [
  { label: "90 Gün",  days: 90,  key: "90d"  },
  { label: "180 Gün", days: 180, key: "180d" },
  { label: "365 Gün", days: 365, key: "365d" },
];

const SOURCES = [
  { icon: "🏛", name: "SGB / USOM",          desc: "Siber Güvenlik Başkanlığı — resmi Türkiye tehdit listesi (~477K kayıt)",        color: C.blue,   href: "https://siberguvenlik.gov.tr" },
  { icon: "🦠", name: "URLhaus",              desc: "abuse.ch — aktif malware dağıtım URL'leri (~75K URL)",                          color: C.purple, href: "https://urlhaus.abuse.ch" },
  { icon: "🤖", name: "Feodo Tracker",        desc: "abuse.ch — botnet Command & Control sunucu IP'leri",                            color: C.teal,   href: "https://feodotracker.abuse.ch" },
  { icon: "📊", name: "CINS Score",           desc: "Collective Intelligence — kötü aktör IP listesi",                              color: C.orange, href: "https://cinsscore.com" },
  { icon: "🦊", name: "ThreatFox",            desc: "abuse.ch — son 90 günlük IOC: domain, IP:port, URL",                           color: C.purple, href: "https://threatfox.abuse.ch" },
  { icon: "⚡", name: "EmergingThreats",      desc: "ET — aktif olarak ele geçirilmiş IP adresleri",                                color: C.red,    href: "https://rules.emergingthreats.net" },
  { icon: "🎣", name: "OpenPhish",            desc: "Gerçek zamanlı phishing URL tespit listesi",                                   color: C.amber,  href: "https://openphish.com" },
  { icon: "🛡", name: "Spamhaus DROP/EDROP",  desc: "Spam kaynaklı subnet'ler — DROP ve EDROP listeleri",                           color: C.green,  href: "https://www.spamhaus.org/drop/" },
];

const STEPS = [
  {
    n: "1", icon: "🔌",
    title: "External Connector'ları oluşturun (3 adet)",
    body: "Security Fabric → External Connectors → Create New → Threat Feed seçin. Her feed türü için ayrı connector oluşturun:",
    list: [
      "Domain feed → Type: Domain Name — URL: threat.lidernetwork.com.tr/feeds/domain.txt",
      "IP feed → Type: IP Address — URL: threat.lidernetwork.com.tr/feeds/ipv4.txt",
      "URL feed → Type: URL — URL: threat.lidernetwork.com.tr/feeds/url.txt",
    ],
    urls: null,
    tip: "Refresh Rate: 60 dakika. Her connector için Status: Enabled olduğunu doğrulayın. 60F/80F gibi küçük cihazlar için Lite Feed URL'lerini kullanın.",
  },
  {
    n: "2", icon: "🌐",
    title: "DNS Filter'a Domain feed'ini ekleyin ve engelleyin",
    body: "Security Profiles → DNS Filter → Create New (veya mevcut profili düzenle). 'DNS Translation' veya 'Domain Filter' bölümünde:",
    list: [
      "External Feed Entries → Add → Domain Name connector'ı seçin",
      "Action: Block olarak ayarlayın",
      "Profili kaydedin",
    ],
    urls: null,
    tip: "DNS Filter profil adını not edin, Adım 5'te Firewall Policy'e eklenecek.",
  },
  {
    n: "3", icon: "🔗",
    title: "Web Filter'a URL feed'ini ekleyin ve engelleyin",
    body: "Security Profiles → Web Filter → Create New (veya mevcut profili düzenle). 'URL Filter' bölümünde:",
    list: [
      "Create → Type: Simple seçin",
      "External Feed Entries → URL connector'ı seçin",
      "Action: Block olarak ayarlayın",
      "Profili kaydedin",
    ],
    urls: null,
    tip: "Web Filter profil adını not edin, Adım 5'te Firewall Policy'e eklenecek.",
  },
  {
    n: "4", icon: "🚫",
    title: "IP engelleme için Firewall Policy kuralı oluşturun",
    body: "Policy & Objects → Firewall Policy → Create New. IP feed'ini doğrudan kural içinde engelleyin:",
    list: [
      "Name: Threat-IP-Block",
      "Incoming Interface: LAN (iç ağ arayüzü)",
      "Outgoing Interface: WAN",
      "Destination Address → Create → External Resource → IPv4 connector'ı seçin",
      "Action: DENY",
      "Log Violation Traffic: Enable",
    ],
    urls: null,
    tip: "Bu kural IP listesindeki zararlı adreslere tüm bağlantıları keser. Kural sıralamasında üst sıralara alın.",
  },
  {
    n: "5", icon: "🛡",
    title: "DNS ve Web Filter profillerini Firewall Policy'e bağlayın",
    body: "Mevcut internet erişim policy'nizi düzenleyin (LAN→WAN Allow kuralı). Security Profiles bölümünde:",
    list: [
      "DNS Filter → Adım 2'de oluşturduğunuz profili seçin",
      "Web Filter → Adım 3'te oluşturduğunuz profili seçin",
      "Kaydedip policy'yi etkinleştirin",
    ],
    urls: null,
    tip: "Policy değişikliği sonrası FortiGate feed'leri otomatik çekmeye başlar. İlk aktivasyonda 5–10 dakika DNS propagasyon gecikmesi yaşanabilir.",
  },
];

type FeedStat = { count: number; size_bytes: number; updated_at: string | null; partial: boolean };
interface Stats { stats: Record<string, FeedStat>; total: number; last_updated: string | null; is_partial: boolean }
interface CheckResult { query: string; found: boolean; found_in: string[]; results: Record<string, boolean>; checked: string[] }

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = prev.current;
    const diff  = target - start;
    const t0    = performance.now();
    let raf: number;
    function step(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + diff * ease));
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} saat önce` : `${Math.floor(h / 24)} gün önce`;
}

function absTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function useCountdown(lastUpdated: string | null) {
  const [display, setDisplay] = useState(""); const [pct, setPct] = useState(0);
  useEffect(() => {
    function tick() {
      if (!lastUpdated) { setDisplay("—"); setPct(0); return; }
      const rem = new Date(lastUpdated).getTime() + 7_200_000 - Date.now();
      if (rem <= 0) { setDisplay("Güncelleniyor…"); setPct(100); return; }
      const min = Math.floor(rem / 60000), sec = Math.floor((rem % 60000) / 1000);
      setDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
      setPct(Math.round(((7_200_000 - rem) / 7_200_000) * 100));
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [lastUpdated]);
  return { display, pct };
}

function useDailyNew(total: number | null) {
  const [dailyNew, setDailyNew] = useState<number | null>(null);
  const [syncsToday, setSyncsToday] = useState(1);
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
    setSyncsToday(Math.max(1, Math.floor((now.getTime() - midnight.getTime()) / (2 * 3600_000))));
  }, []);
  useEffect(() => {
    if (!total) return;
    try {
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem("tn-date");
      const storedTotal = localStorage.getItem("tn-prev");
      if (storedDate === today && storedTotal) {
        const prev = parseInt(storedTotal);
        if (total > prev) setDailyNew(total - prev);
      } else {
        localStorage.setItem("tn-date", today);
        localStorage.setItem("tn-prev", String(total));
      }
    } catch {}
  }, [total]);
  return { dailyNew, syncsToday };
}

function StatCard({ feed, stat, max }: { feed: typeof FEEDS[0]; stat?: FeedStat; max: number }) {
  const count = useCountUp(stat?.count ?? 0);
  const hasData = (stat?.count ?? 0) > 0;
  const pct = max > 0 ? Math.round(((stat?.count ?? 0) / max) * 100) : 0;
  return (
    <div style={{
      background: `linear-gradient(145deg, ${C.surface} 0%, ${C.surface2} 100%)`,
      border: `1px solid ${hasData ? feed.color + "35" : C.borderLo}`,
      borderRadius: 16, padding: "22px 22px 18px",
      boxShadow: hasData ? `0 4px 32px ${feed.color}15` : "none",
      transition: "all .22s",
      position: "relative", overflow: "hidden",
    }}>
      {hasData && <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${feed.color}20 0%, transparent 70%)`, pointerEvents: "none" }} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${feed.color}18`, border: `1.5px solid ${feed.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{feed.icon}</div>
        <span style={{ fontSize: 9, color: hasData ? feed.color : C.dim, background: `${hasData ? feed.color : C.dim}12`, border: `1px solid ${hasData ? feed.color : C.dim}28`, padding: "2px 8px", borderRadius: 99, fontWeight: 700, letterSpacing: ".04em" }}>
          {hasData ? "AKTİF" : "BEKLENIYOR"}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: hasData ? feed.color : C.dim, fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: -1.5 }}>
        {hasData ? count.toLocaleString("tr-TR") : <span style={{ fontSize: 24 }}>—</span>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 6 }}>{feed.label}</div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 2, marginBottom: 14 }}>{feed.desc}</div>
      <div style={{ width: "100%", height: 3, background: C.bg2, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${feed.color},${feed.color}88)`, transition: "width 1.2s ease", borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 10, color: C.dim }}>{feed.src}</div>
    </div>
  );
}

function ThreatCheck({ origin }: { origin: string }) {
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function doCheck(q?: string) {
    const val = (q ?? query).trim();
    if (!val) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${origin}/api/threat/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: val }) });
      setResult(await r.json());
    } catch { setResult(null); }
    setLoading(false);
  }

  const EXAMPLES = ["185.220.101.1", "malware.example.com", "https://phishing.site/login"];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`,
      border: `1px solid ${C.border}`,
      borderRadius: 20, padding: "26px",
      boxShadow: "0 8px 48px rgba(0,0,0,.35)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(77,140,245,.15)", border: "1.5px solid rgba(77,140,245,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔍</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Anlık Tehdit Sorgulama</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>IP adresi, domain veya URL'nin zararlı listede olup olmadığını saniyeler içinde kontrol edin</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={query} onChange={e => { setQuery(e.target.value); if (result) setResult(null); }}
          onKeyDown={e => e.key === "Enter" && doCheck()}
          placeholder="185.220.101.1  ·  kötü-site.com  ·  https://phishing.site/..."
          style={{ flex: 1, padding: "14px 18px", borderRadius: 12, background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "monospace,sans-serif", outline: "none" }}
          onFocus={e => e.target.style.borderColor = C.blue}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button onClick={() => doCheck()} disabled={loading || !query.trim()}
          style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: loading ? C.surface2 : `linear-gradient(135deg,${C.blue},#3060d0)`, color: loading ? C.sub : "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 4px 20px rgba(77,140,245,.4)", transition: "all .15s" }}>
          {loading ? "Sorgulanıyor…" : "Sorgula →"}
        </button>
      </div>

      {!result && !loading && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.dim }}>Örnek:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => { setQuery(ex); doCheck(ex); }}
              style={{ fontSize: 11, color: C.sub, background: `${C.dim}20`, border: `1px solid ${C.border}`, padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "monospace" }}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: "18px 20px", borderRadius: 14, background: result.found ? "rgba(242,79,106,.06)" : "rgba(30,217,138,.06)", border: `1.5px solid ${result.found ? C.red + "45" : C.green + "45"}`, animation: "fadein .25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{result.found ? "⚠️" : "✅"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: result.found ? C.red : C.green }}>
                {result.found ? "Zararlı Listede Bulundu!" : "Temiz — Listede Bulunamadı"}
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2, fontFamily: "monospace" }}>{result.query}</div>
            </div>
          </div>
          {result.found && result.found_in.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {result.found_in.map(f => (
                <span key={f} style={{ fontSize: 11, fontWeight: 700, color: C.red, background: "rgba(242,79,106,.12)", border: "1px solid rgba(242,79,106,.3)", padding: "4px 12px", borderRadius: 99 }}>
                  {f.toUpperCase()} feed
                </span>
              ))}
            </div>
          )}
          {!result.found && (
            <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
              Kontrol edilen: {result.checked.join(", ")} · {new Date().toLocaleTimeString("tr-TR")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); });
  }
  return (
    <button onClick={copy} style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${done ? C.green + "50" : C.border}`, background: done ? "rgba(30,217,138,.1)" : "transparent", color: done ? C.green : C.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
      {done ? "✓ Kopyalandı" : (label ?? "Kopyala")}
    </button>
  );
}

export default function ThreatClient() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"feeds" | "install" | "sources">("feeds");
  const [feedTab, setFeedTab]     = useState<"full" | "lite">("full");
  const [origin, setOrigin] = useState("https://threat.lidernetwork.com.tr");

  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/threat/stats"); if (r.ok) setStats(await r.json()); } catch {}
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  const totalCount = useCountUp(stats?.total ?? 0);
  const isLive = stats?.last_updated ? Date.now() - new Date(stats.last_updated).getTime() < 14_400_000 : false;
  const { display: countdown, pct: countdownPct } = useCountdown(stats?.last_updated ?? null);
  const { dailyNew, syncsToday } = useDailyNew(stats?.total ?? null);
  const maxCount = Math.max(...FEEDS.map(f => stats?.stats?.[f.key]?.count ?? 0));

  const MAIN_TABS = [
    { key: "feeds",   label: "📡 Feed URL'leri" },
    { key: "install", label: "⚙️ FortiGate Kurulum" },
    { key: "sources", label: "📚 Veri Kaynakları" },
  ] as const;

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "5%",  left: "15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,140,245,.06) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "40%", right: 0,    width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(18,212,239,.04) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "5%",  width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(164,111,255,.04) 0%, transparent 65%)" }} />
      </div>

      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes countup{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        .fade{animation:fadein .3s ease}
        .card-hover{transition:all .2s}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.4)!important}
        .row-hover{transition:all .18s}
        .row-hover:hover{background:#162240!important;border-color:rgba(77,140,245,.35)!important}
        .tab-main{transition:all .2s;cursor:pointer;border:none;white-space:nowrap}
        .tab-main:hover{background:rgba(77,140,245,.1)!important}
        .step-card{transition:all .2s}
        .step-card:hover{border-color:rgba(77,140,245,.4)!important}
      `}</style>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 20px 80px", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <header style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 14px", flexWrap: "wrap", gap: 10 }}>
            <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <span style={{ background: "#fff", borderRadius: 9, padding: "5px 10px", display: "inline-flex", boxShadow: "0 2px 10px rgba(0,0,0,.35)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 24 }} />
              </span>
              <span style={{ fontSize: 13, color: C.dim }}>lidernetwork.com.tr</span>
            </a>
            <nav style={{ display: "flex", gap: 6 }}>
              {[["Kara Liste", "https://blacklist.lidernetwork.com.tr"], ["IP Sorgu", "https://ip.lidernetwork.com.tr"], ["DNS", "https://dns.lidernetwork.com.tr"]].map(([label, href]) => (
                <a key={href} href={href} style={{ color: C.sub, fontSize: 12, textDecoration: "none", padding: "6px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, transition: "all .15s" }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = C.blue + "60"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  {label} ↗
                </a>
              ))}
            </nav>
          </div>

          {/* Brand hero band */}
          <div style={{
            background: `linear-gradient(135deg, #0a1730 0%, #0d1e3d 50%, #091527 100%)`,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: "0 4px 40px rgba(77,140,245,.1)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* bg glow */}
            <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,140,245,.1) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <span style={{ background: "#fff", borderRadius: 16, padding: "12px 20px", display: "inline-flex", boxShadow: "0 8px 32px rgba(0,0,0,.5)", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 46 }} />
              </span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: C.blue, marginBottom: 4 }}>LİDER NETWORK</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.text, lineHeight: 1.15, letterSpacing: -.5 }}>
                  Tehdit İstihbaratı Servisi
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                  FortiGate External Connector uyumlu · Her 2 saatte bir otomatik güncelleme · 8 küresel kaynak
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: "rgba(30,217,138,.1)", border: `1px solid rgba(30,217,138,.3)`, padding: "6px 16px", borderRadius: 99, letterSpacing: ".05em" }}>
                ✓ Fortinet Yetkili Partner
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: "rgba(77,140,245,.1)", border: `1px solid rgba(77,140,245,.3)`, padding: "6px 16px", borderRadius: 99 }}>
                FortiOS 6.4+
              </span>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ padding: "36px 0 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: isLive ? C.green : C.amber, background: isLive ? "rgba(30,217,138,.1)" : "rgba(245,166,35,.1)", border: `1px solid ${isLive ? C.green : C.amber}35`, padding: "5px 12px", borderRadius: 99, letterSpacing: ".06em" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLive ? C.green : C.amber, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                  {isLive ? "CANLI" : "BEKLENIYOR"}
                </span>
                {dailyNew && dailyNew > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, background: "rgba(18,212,239,.1)", border: `1px solid rgba(18,212,239,.3)`, padding: "5px 12px", borderRadius: 99, animation: "fadein .5s ease" }}>
                    +{dailyNew.toLocaleString("tr-TR")} yeni kayıt (bugün)
                  </span>
                )}
                <span style={{ fontSize: 11, color: C.sub, background: C.surface, border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: 99 }}>
                  Bugün {syncsToday}× güncellendi
                </span>
              </div>
              <h1 style={{ margin: "0 0 12px", fontSize: 38, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.15, color: C.text }}>
                SGB / USOM<br />
                <span style={{ background: `linear-gradient(135deg,${C.blue},${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Zararlı Bağlantı Feed&apos;i
                </span>
              </h1>
              <p style={{ margin: "0 0 20px", color: C.sub, fontSize: 14, maxWidth: 520, lineHeight: 1.8 }}>
                Siber Güvenlik Başkanlığı ve 7 küresel kaynaktan toplanan tehdit listelerini <strong style={{ color: C.text }}>FortiGate External Connector</strong> uyumlu TXT formatında sunar. Her 2 saatte bir otomatik güncelleme, sıfır kurulum.
              </p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {[["SGB / USOM", C.blue], ["URLhaus", C.purple], ["ThreatFox", C.purple], ["Feodo", C.teal], ["EmergingThreats", C.red], ["OpenPhish", C.amber], ["CINS Score", C.orange], ["Spamhaus", C.green], ["Her 2 Saat", C.green], ["FortiOS 6.4+", C.blue]].map(([l, c]) => (
                  <span key={l} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", color: c, background: `${c}10`, border: `1px solid ${c}28`, padding: "4px 10px", borderRadius: 99 }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Hero counter */}
            <div style={{ background: `linear-gradient(145deg, ${C.surface} 0%, ${C.surface2} 100%)`, border: `1.5px solid ${C.blue}30`, borderRadius: 24, padding: "30px 36px", textAlign: "center", minWidth: 210, boxShadow: "0 0 60px rgba(77,140,245,.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: C.sub, marginBottom: 8 }}>TOPLAM TEHDİT</div>
              <div style={{ fontSize: 50, fontWeight: 900, color: C.blue, lineHeight: 1, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>
                {stats ? totalCount.toLocaleString("tr-TR") : <span style={{ color: C.dim, fontSize: 32 }}>—</span>}
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>aktif kayıt</div>
              <div style={{ marginTop: 16, padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 8 }}>Sonraki güncelleme</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.teal, fontFamily: "monospace", letterSpacing: 2 }}>{countdown}</div>
                <div style={{ width: "100%", height: 3, background: C.bg, borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${countdownPct}%`, background: `linear-gradient(90deg,${C.blue},${C.teal})`, transition: "width 1s linear", borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: C.dim }}>
                {stats?.last_updated ? absTime(stats.last_updated) : "—"}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 32 }}>
          {FEEDS.map(f => <StatCard key={f.key} feed={f} stat={stats?.stats?.[f.key]} max={maxCount} />)}
        </div>

        {/* ── THREAT CHECK ── */}
        <div style={{ marginBottom: 32 }}>
          <ThreatCheck origin={origin} />
        </div>

        {/* ── MAIN TABS ── */}
        <div style={{ marginBottom: 28 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 20, width: "fit-content" }}>
            {MAIN_TABS.map(t => (
              <button key={t.key} className="tab-main" onClick={() => setActiveTab(t.key as typeof activeTab)}
                style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: activeTab === t.key ? C.blue : "transparent", color: activeTab === t.key ? "#fff" : C.sub, boxShadow: activeTab === t.key ? "0 2px 12px rgba(77,140,245,.4)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: FEEDS ── */}
          {activeTab === "feeds" && (
            <div className="fade">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>External Connector Feed URL&apos;leri</h2>
                <div style={{ display: "flex", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
                  {(["full", "lite"] as const).map(tab => (
                    <button key={tab} onClick={() => setFeedTab(tab)} style={{ padding: "6px 18px", borderRadius: 7, fontSize: 11, fontWeight: 800, letterSpacing: ".05em", background: feedTab === tab ? C.blue : "transparent", color: feedTab === tab ? "#fff" : C.sub, border: "none", cursor: "pointer", transition: "all .15s" }}>
                      {tab === "full" ? "TAM" : "LİTE"}
                    </button>
                  ))}
                </div>
              </div>

              {feedTab === "full" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {FEEDS.map(f => {
                    const url = `${origin}/feeds/${f.key}.txt`;
                    const count = stats?.stats?.[f.key]?.count ?? 0;
                    return (
                      <div key={f.key} className="row-hover" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{f.label}</span>
                            {count > 0 && <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "2px 9px", borderRadius: 99, fontWeight: 700 }}>{count.toLocaleString("tr-TR")} kayıt</span>}
                            <span style={{ fontSize: 10, color: C.dim, background: `${C.dim}15`, padding: "1px 7px", borderRadius: 99 }}>{f.src}</span>
                          </div>
                          <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <CopyBtn text={url} label="📋 Kopyala" />
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Aç ↗</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {feedTab === "lite" && (
                <div>
                  <div style={{ padding: "14px 18px", background: "rgba(77,140,245,.06)", border: `1px solid rgba(77,140,245,.2)`, borderRadius: 12, marginBottom: 14, fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
                    <strong style={{ color: C.text }}>Lite Feed</strong> — FortiGate 60F/80F gibi düşük hafızalı cihazlar için son 90/180/365 gün içindeki kayıtları içerir. Tam listeye göre çok daha küçük, koruma düzeyi aynı.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FEEDS.filter(f => f.key === "domain" || f.key === "ipv4" || f.key === "url").map(f =>
                      LITE_WINDOWS.map(w => {
                        const url = `${origin}/feeds/${f.key}-${w.key}.txt`;
                        return (
                          <div key={`${f.key}-${w.key}`} className="row-hover" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{f.label}</span>
                                <span style={{ fontSize: 10, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}28`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{w.label}</span>
                                <span style={{ fontSize: 9, color: C.green, background: "rgba(30,217,138,.1)", border: "1px solid rgba(30,217,138,.25)", padding: "1px 7px", borderRadius: 99, fontWeight: 700 }}>KÜÇÜK CİHAZ</span>
                              </div>
                              <code style={{ fontSize: 11, color: C.sub, wordBreak: "break-all" }}>{url}</code>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <CopyBtn text={url} label="📋 Kopyala" />
                              <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, color: C.sub, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Aç ↗</a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: INSTALL ── */}
          {activeTab === "install" && (
            <div className="fade">
              {/* Banner */}
              <div style={{ background: `linear-gradient(135deg, #0d2340 0%, #0a1a30 100%)`, border: `1.5px solid ${C.blue}30`, borderRadius: 18, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(77,140,245,.2)", border: `1.5px solid rgba(77,140,245,.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🔧</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>FortiGate External Connector Kurulumu</h2>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>FortiOS 6.4 ve üstü · 5 adımda tamamlanır · Sıfır kesinti, sıfır maliyet</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: "rgba(30,217,138,.1)", border: `1px solid rgba(30,217,138,.3)`, padding: "6px 14px", borderRadius: 99 }}>FortiOS 6.4+</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: "rgba(77,140,245,.1)", border: `1px solid rgba(77,140,245,.3)`, padding: "6px 14px", borderRadius: 99 }}>~5 Dakika</span>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {STEPS.map((s, idx) => (
                  <div key={s.n} className="step-card" style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", gap: 18, position: "relative", overflow: "hidden" }}>
                    {/* Step number accent line */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(to bottom,${C.blue},${C.teal})`, borderRadius: "16px 0 0 16px", opacity: 0.6 }} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(77,140,245,.15)", border: "1.5px solid rgba(77,140,245,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                      {idx < STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 12, background: C.border, borderRadius: 99 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: C.blue, background: "rgba(77,140,245,.12)", border: "1px solid rgba(77,140,245,.3)", width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{s.title}</span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{s.body}</p>
                      {s.list && (
                        <ul style={{ margin: "0 0 8px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                          {s.list.map(item => (
                            <li key={item} style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {s.urls && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "10px 0" }}>
                          {s.urls.map(url => (
                            <div key={url} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px" }}>
                              <code style={{ flex: 1, fontSize: 12, color: C.teal, wordBreak: "break-all" }}>{url}</code>
                              <CopyBtn text={url} />
                            </div>
                          ))}
                        </div>
                      )}
                      {s.tip && (
                        <div style={{ background: "rgba(245,166,35,.07)", border: "1px solid rgba(245,166,35,.25)", borderRadius: 9, padding: "9px 14px", fontSize: 12, color: C.amber, lineHeight: 1.6 }}>
                          💡 {s.tip}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div style={{ marginTop: 18, padding: "16px 20px", background: "rgba(245,166,35,.05)", border: "1px solid rgba(245,166,35,.2)", borderRadius: 12, fontSize: 12, color: C.amber, lineHeight: 1.7 }}>
                <strong>Not:</strong> FortiGate, Refresh Rate süresinde feed'i yeniden çeker. DNS propagasyonu nedeniyle ilk aktivasyonda 5–10 dakika gecikme yaşanabilir. Ayrıntılı bilgi için{" "}
                <a href="https://docs.fortinet.com" target="_blank" rel="noopener noreferrer" style={{ color: C.amber, textDecoration: "underline" }}>Fortinet dokümantasyonunu</a> inceleyebilirsiniz.
              </div>
            </div>
          )}

          {/* ── TAB: SOURCES ── */}
          {activeTab === "sources" && (
            <div className="fade">
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: C.text }}>Veri Kaynakları</h2>
                <p style={{ margin: 0, fontSize: 13, color: C.sub }}>8 farklı güvenilir tehdit istihbaratı kaynağından toplanan veriler birleştirilerek sunulmaktadır.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {SOURCES.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="card-hover"
                    style={{ textDecoration: "none", background: C.surface, border: `1.5px solid ${s.color}20`, borderRadius: 16, padding: "18px 20px", display: "block", boxShadow: `0 4px 24px ${s.color}08` }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + "55"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + "20"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 22, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 10 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: C.dim }}>↗ Kaynağa git</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{s.desc}</div>
                  </a>
                ))}
              </div>
              {/* Summary bar */}
              <div style={{ marginTop: 20, padding: "16px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[["8", "Aktif Kaynak"], [String(syncsToday), "Bugünkü Senkronizasyon"], ["Her 2 Saat", "Güncelleme Periyodu"], [stats?.total ? stats.total.toLocaleString("tr-TR") : "—", "Toplam Kayıt"]].map(([v, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.blue }}>{v}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ textAlign: "center", paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {[["SGB/USOM", "https://siberguvenlik.gov.tr"], ["URLhaus", "https://urlhaus.abuse.ch"], ["ThreatFox", "https://threatfox.abuse.ch"], ["Feodo Tracker", "https://feodotracker.abuse.ch"], ["CINS Score", "https://cinsscore.com"], ["EmergingThreats", "https://rules.emergingthreats.net"], ["OpenPhish", "https://openphish.com"], ["Spamhaus", "https://www.spamhaus.org/drop/"], ["Lider Network", "https://www.lidernetwork.com.tr"]].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: C.dim, textDecoration: "none", padding: "4px 10px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.surface, transition: "all .15s" }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = C.sub; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = C.dim; }}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: C.dim, lineHeight: 2 }}>
            Her 2 saatte bir otomatik senkronizasyon · 8 tehdit istihbaratı kaynağı · Veri doğruluğu kaynağa aittir
          </p>
        </footer>
      </div>
    </main>
  );
}
