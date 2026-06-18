"use client";
import { useState } from "react";

/* ── FortiBleed Uyarı Bileşeni ──────────────────────────────────────── */
function FortiBleedAlert({ onCheck }: { onCheck: (ip: string) => void }) {
  const [open, setOpen] = useState(true);
  const [ip, setIp] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(251,113,133,.3)", background: "rgba(251,113,133,.06)", color: "#fb7185", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        ⚠️ FortiBleed Kampanyası — Cihazınızı kontrol edin
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 20, borderRadius: 14, border: "1.5px solid rgba(251,113,133,.35)", background: "rgba(251,113,133,.06)", overflow: "hidden" }}>
      {/* Başlık */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(251,113,133,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fb7185" }}>FortiBleed Kampanyası — 73.932 Fortinet Cihazı Ele Geçirildi</div>
            <div style={{ fontSize: 11, color: "#9aa6d6", marginTop: 2 }}>194 ülkede credential stuffing saldırısı · 1,16 milyar kimlik doğrulama denemesi</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#5a6896", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}>×</button>
      </div>

      <div style={{ padding: "14px 18px", display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Sol: Acil önlemler */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fb7185", letterSpacing: ".06em", marginBottom: 8 }}>ACİL YAPILMASI GEREKENLER</div>
          {[
            "Yönetim arayüzünü internetten kapat (Trusted Hosts)",
            "Tüm admin ve VPN şifrelerini değiştir",
            "MFA / FortiToken zorunlu hale getir",
            "Giriş loglarını kontrol et (başarısız denemeler)",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6, fontSize: 12, color: "#9aa6d6" }}>
              <span style={{ color: "#fb7185", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
              {item}
            </div>
          ))}
        </div>

        {/* Sağ: IP kontrol kutusu */}
        <div style={{ minWidth: 240, borderLeft: "1px solid rgba(251,113,133,.2)", paddingLeft: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fb7185", letterSpacing: ".06em", marginBottom: 8 }}>MÜŞTERİ FORTİGATE IP KONTROL</div>
          <div style={{ fontSize: 11, color: "#5a6896", marginBottom: 10, lineHeight: 1.6 }}>
            FortiGate cihazının WAN IP'sini girerek kara listelerde sorgu yap.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={ip}
              onChange={e => setIp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ip.trim() && onCheck(ip.trim())}
              placeholder="FortiGate WAN IP"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(251,113,133,.3)", background: "rgba(0,0,0,.25)", color: "#e8ecff", fontSize: 12, fontFamily: "monospace", outline: "none" }}
            />
            <button
              onClick={() => ip.trim() && onCheck(ip.trim())}
              disabled={!ip.trim()}
              style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: ip.trim() ? "#fb7185" : "rgba(251,113,133,.2)", color: ip.trim() ? "#fff" : "#5a6896", fontSize: 12, fontWeight: 700, cursor: ip.trim() ? "pointer" : "not-allowed" }}
            >
              Sorgula
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <a href="https://cavalier.hudsonrock.com" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#9aa6d6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              ↗ Hudson Rock'ta cihaz ihlali sorgula
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const C = {
  bg: "#0a0e27", card: "#141a3a", card2: "#1b2350", line: "#283166",
  text: "#e8ecff", sub: "#9aa6d6", dim: "#5a6896",
  blue: "#4f7cff", green: "#34d399", red: "#fb7185", amber: "#fbbf24",
};

const CAT_COLORS: Record<string, string> = {
  Spam: "#4f7cff", Exploit: "#fb7185", DUL: "#fbbf24", Policy: "#a78bfa",
};

const CAT_DESC: Record<string, string> = {
  Spam: "Doğrudan spam göndericileri, kötü itibaçlı mail sunucuları ve spam ağlarını listeler.",
  Exploit: "Botnet, kötü amaçlı yazılım, proxy ve ele geçirilmiş makineleri işaret eder.",
  DUL: "ISP'nin son kullanıcılara atadığı dinamik IP bloklarını kapsar.",
  Policy: "PTR kaydı eksikliği veya ISP politika ihlalleri gibi teknik kurallara dayanır.",
};

const ALL_LISTS = [
  { zone: "zen.spamhaus.org",       name: "Spamhaus ZEN",      cat: "Spam",    desc: "SBL+XBL+PBL birleşik — en kritik liste" },
  { zone: "sbl.spamhaus.org",       name: "Spamhaus SBL",      cat: "Spam",    desc: "Doğrudan spam kaynakları" },
  { zone: "xbl.spamhaus.org",       name: "Spamhaus XBL",      cat: "Exploit", desc: "Ele geçirilmiş / malware enfekte makineler" },
  { zone: "pbl.spamhaus.org",       name: "Spamhaus PBL",      cat: "Policy",  desc: "ISP son kullanıcı politika listesi" },
  { zone: "bl.spamcop.net",         name: "SpamCop",           cat: "Spam",    desc: "Kullanıcı raporlarına dayalı spam listesi" },
  { zone: "b.barracudacentral.org", name: "Barracuda BRBL",    cat: "Spam",    desc: "Barracuda Networks itibar listesi" },
  { zone: "dnsbl.sorbs.net",        name: "SORBS Birleşik",    cat: "Spam",    desc: "SORBS tüm listeler" },
  { zone: "spam.dnsbl.sorbs.net",   name: "SORBS Spam",        cat: "Spam",    desc: "SORBS spam kaynak listesi" },
  { zone: "dul.dnsbl.sorbs.net",    name: "SORBS DUL",         cat: "DUL",     desc: "Dinamik kullanıcı IP'leri" },
  { zone: "smtp.dnsbl.sorbs.net",   name: "SORBS SMTP",        cat: "Spam",    desc: "Yetkisiz SMTP relay'ler" },
  { zone: "dnsbl-1.uceprotect.net", name: "UCEPROTECT L1",     cat: "Spam",    desc: "Bireysel IP seviyesi" },
  { zone: "dnsbl-2.uceprotect.net", name: "UCEPROTECT L2",     cat: "Spam",    desc: "C sınıfı ağ bloğu seviyesi" },
  { zone: "dnsbl-3.uceprotect.net", name: "UCEPROTECT L3",     cat: "Spam",    desc: "ASN otonom sistem seviyesi" },
  { zone: "cbl.abuseat.org",        name: "CBL / Abusix",      cat: "Exploit", desc: "Botnet ve spam makineleri" },
  { zone: "all.spamrats.com",       name: "SpamRats",          cat: "Spam",    desc: "SpamRats birleşik liste" },
  { zone: "spam.spamrats.com",      name: "SpamRats Spam",     cat: "Spam",    desc: "Doğrudan spam göndericiler" },
  { zone: "dyna.spamrats.com",      name: "SpamRats Dyna",     cat: "DUL",     desc: "Dinamik IP'ler" },
  { zone: "noptr.spamrats.com",     name: "SpamRats NoPTR",    cat: "Policy",  desc: "PTR kaydı olmayan IP'ler" },
  { zone: "bl.mailspike.net",       name: "MailSpike BL",      cat: "Spam",    desc: "MailSpike kara liste" },
  { zone: "z.mailspike.net",        name: "MailSpike Z",       cat: "Spam",    desc: "MailSpike sıfır itibar" },
  { zone: "dnsbl.dronebl.org",      name: "DroneBL",           cat: "Exploit", desc: "IRC bot, proxy ve exploit'li IP'ler" },
  { zone: "psbl.surriel.com",       name: "PSBL",              cat: "Spam",    desc: "Passive Spam Block List" },
  { zone: "truncate.gbudb.net",     name: "GBUdb Truncate",    cat: "Spam",    desc: "GBUdb anlık spam listesi" },
  { zone: "db.wpbl.info",           name: "WPBL",              cat: "Spam",    desc: "Weighted Private Block List" },
  { zone: "ix.dnsbl.manitu.net",    name: "Manitu NiX Spam",   cat: "Spam",    desc: "Alman NiX Spam DNSBL" },
  { zone: "bl.0spam.org",           name: "0spam",             cat: "Spam",    desc: "0spam kara liste" },
  { zone: "dnsbl.spfbl.net",        name: "SPFBL",             cat: "Policy",  desc: "SPFBL politika listesi" },
  { zone: "rbl.megarbl.net",        name: "MegaRBL",           cat: "Spam",    desc: "MegaRBL birleşik" },
  { zone: "blacklist.woody.ch",     name: "Woody's Blacklist", cat: "Spam",    desc: "İsviçre bazlı SMTP kara listesi" },
  { zone: "rbl.rbldns.ru",          name: "RBLDNS.ru",         cat: "Spam",    desc: "Rusya bazlı DNSBL" },
];

const QUICK_IPS = ["8.8.8.8", "1.1.1.1", "208.91.112.53", "192.168.1.1"];

type Filter = "all" | "listed" | "clean";

interface ListResult {
  zone: string; name: string; cat: string; desc: string;
  listed: boolean; response: string | null;
}
interface ApiResult {
  ip: string; query: string;
  listed: number; clean: number; errors: number; total: number;
  results: ListResult[];
}

export default function BlacklistClient() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [progress, setProgress] = useState(0);
  const [openCat, setOpenCat] = useState<string | null>(null);

  async function check(e: React.FormEvent | null, overrideIp?: string) {
    if (e) e.preventDefault();
    const v = (overrideIp ?? input).trim();
    if (!v) return;
    if (overrideIp) setInput(overrideIp);
    setLoading(true); setError(null); setData(null); setFilter("all"); setProgress(0);

    const prog = setInterval(() => setProgress(p => Math.min(p + 2, 92)), 300);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("ip", v);
      window.history.pushState({}, "", url.toString());

      const r = await fetch(`/api/blacklist?ip=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Sorgu başarısız"); }
      else setData(d);
    } catch { setError("Bağlantı hatası"); }
    finally { clearInterval(prog); setProgress(100); setLoading(false); }
  }

  const filtered = data?.results.filter(r => {
    if (filter === "listed") return r.listed;
    if (filter === "clean") return !r.listed;
    return true;
  }) ?? [];

  const allClean  = data && data.listed === 0;
  const hasListed = data && data.listed > 0;

  const catGroups = ALL_LISTS.reduce<Record<string, typeof ALL_LISTS>>((acc, l) => {
    (acc[l.cat] = acc[l.cat] ?? []).push(l);
    return acc;
  }, {});

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #1a2150 0%, ${C.bg} 60%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        input::placeholder{color:${C.dim}}
        input:focus{outline:none;border-color:${C.blue}!important;box-shadow:0 0 0 3px rgba(79,124,255,.15)}
        button:hover{filter:brightness(1.1)}
        a:hover{opacity:.8}
        .fade{animation:fadein .35s ease}
        .card-item:hover{border-color:rgba(79,124,255,.35)!important}
        .quick-btn:hover{background:rgba(79,124,255,.2)!important;border-color:${C.blue}!important;color:${C.text}!important}
        .cat-row:hover{background:${C.card2}!important}
        .list-row:hover{background:rgba(255,255,255,.03)!important}
        .removal-card:hover{border-color:rgba(79,124,255,.4)!important}
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 13, padding: "8px 16px", display: "inline-flex", boxShadow: "0 6px 22px rgba(0,0,0,.35)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 44 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.red, background: "rgba(251,113,133,.12)", border: "1px solid rgba(251,113,133,.3)", padding: "4px 12px", borderRadius: 20 }}>
              KARA LİSTE SORGU
            </span>
          </a>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="https://threat.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Tehdit Feed ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://dns.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>DNS Checker ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "16px 0 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>IP Kara Liste Sorgulama</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 15 }}>
            {`${ALL_LISTS.length} DNSBL / RBL listesinde gerçek zamanlı itibar kontrolü — Spamhaus, SpamCop, Barracuda ve daha fazlası.`}
          </p>
        </section>

        {/* FortiBleed Uyarı Bölümü */}
        <FortiBleedAlert onCheck={ip => { setInput(ip); check(null, ip); }} />

        {/* Search */}
        <form onSubmit={check} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="IP adresi veya domain — ör. 1.2.3.4 veya mail.example.com"
            style={{ flex: 1, minWidth: 220, padding: "15px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 15 }}
            autoComplete="off" spellCheck={false}
          />
          <button type="submit" disabled={loading}
            style={{ padding: "15px 28px", borderRadius: 12, border: "none", background: loading ? C.card2 : `linear-gradient(135deg,#3a63ff,${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(79,124,255,.35)", transition: "all .2s" }}>
            {loading ? "Sorgulanıyor…" : "Sorgula"}
          </button>
        </form>

        {/* Quick checks */}
        {!data && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.dim }}>Hızlı test:</span>
            {QUICK_IPS.map(ip => (
              <button key={ip} className="quick-btn" onClick={() => check(null, ip)}
                style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 12, cursor: "pointer", fontFamily: "monospace", transition: "all .15s" }}>
                {ip}
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.sub, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 14, border: `2px solid ${C.line}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                {ALL_LISTS.length} liste eş zamanlı sorgulanıyor…
              </span>
              <span style={{ fontSize: 13, color: C.dim }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: C.card, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,#3a63ff,${C.blue})`, borderRadius: 999, transition: "width .3s ease" }} />
            </div>
            <p style={{ fontSize: 12, color: C.dim, margin: "8px 0 0", textAlign: "center" }}>
              DNS sorguları ağ koşullarına göre 5–15 saniye sürebilir.
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(251,113,133,.08)", border: "1px solid rgba(251,113,133,.25)", borderRadius: 14, padding: "18px 22px", color: C.red, fontSize: 14, marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="fade">
            {/* Özet */}
            <div style={{ background: allClean ? "rgba(52,211,153,.07)" : "rgba(251,113,133,.07)", border: `1px solid ${allClean ? "rgba(52,211,153,.3)" : "rgba(251,113,133,.3)"}`, borderRadius: 18, padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ fontSize: 44, lineHeight: 1 }}>{allClean ? "✅" : "🚨"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: allClean ? C.green : C.red, marginBottom: 4 }}>
                    {allClean
                      ? `${data.total} listede temiz — itibarınız sağlam`
                      : `${data.listed} listede listelendi`}
                  </div>
                  <div style={{ fontSize: 14, color: C.sub }}>
                    Sorgulanan: <span style={{ color: C.text, fontFamily: "monospace", fontWeight: 600 }}>{data.ip}</span>
                    {data.query !== data.ip && <span style={{ color: C.dim }}> ({data.query})</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "Listelendi", val: data.listed, color: C.red },
                    { label: "Temiz", val: data.clean, color: C.green },
                    { label: "Zaman Aşımı", val: data.errors, color: C.dim },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, height: 6, background: C.card, borderRadius: 999, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(data.listed / data.total) * 100}%`, background: C.red, transition: "width .5s" }} />
                <div style={{ width: `${(data.clean / data.total) * 100}%`, background: C.green, transition: "width .5s" }} />
              </div>
              {hasListed && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
                  ⚠ Listelenen IP&apos;ler mail teslim sorunlarına yol açabilir.{" "}
                  <a href="https://www.spamhaus.org/removal/" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>Spamhaus listeden çıkarma →</a>
                </p>
              )}
            </div>

            {/* Filtre */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {([["all", "Tümü"], ["listed", "Listelendi"], ["clean", "Temiz"]] as [Filter, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${filter === f ? C.blue : C.line}`, background: filter === f ? "rgba(79,124,255,.15)" : C.card, color: filter === f ? C.text : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {label}
                  <span style={{ marginLeft: 6, fontSize: 12, color: filter === f ? C.blue : C.dim }}>
                    {f === "all" ? data.total : f === "listed" ? data.listed : data.clean}
                  </span>
                </button>
              ))}
            </div>

            {/* Liste grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10 }}>
              {filtered.map(r => (
                <div key={r.zone} className="card-item"
                  style={{ background: C.card, border: `1px solid ${r.listed ? "rgba(251,113,133,.3)" : C.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, transition: "border-color .15s" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.listed ? C.red : r.response === "timeout" ? C.dim : C.green, flexShrink: 0, marginTop: 3, boxShadow: r.listed ? `0 0 0 3px rgba(251,113,133,.2)` : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{r.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${CAT_COLORS[r.cat] || C.blue}18`, color: CAT_COLORS[r.cat] || C.blue, border: `1px solid ${CAT_COLORS[r.cat] || C.blue}40`, flexShrink: 0 }}>
                        {r.cat}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, marginBottom: r.listed ? 4 : 0 }}>{r.desc}</div>
                    {r.listed && r.response && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: C.red, background: "rgba(251,113,133,.08)", padding: "2px 7px", borderRadius: 5, display: "inline-block" }}>
                        {r.response}
                      </div>
                    )}
                    {r.response === "timeout" && (
                      <div style={{ fontSize: 11, color: C.dim }}>Zaman aşımı</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 36, lineHeight: 1.7 }}>
              Sonuçlar DNS sorgusuna dayanır; gerçek zamanlı veri sağlanır.<br />
              <a href="https://ip.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>IP Sorgu</a>
              {" · "}
              <a href="https://dns.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>DNS Checker</a>
              {" · "}
              <a href="https://www.lidernetwork.com.tr" style={{ color: C.blue, textDecoration: "none" }}>Lider Network</a>
            </p>
          </div>
        )}

        {/* Landing content — shown before any search */}
        {!data && !loading && (
          <div className="fade">

            {/* Stats band */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 32 }}>
              {[
                { val: "30", label: "DNSBL / RBL Liste", icon: "🗂" },
                { val: "4", label: "Kategori", icon: "🏷" },
                { val: "Gerçek Zamanlı", label: "DNS Sorgusu", icon: "⚡" },
                { val: "~8–15sn", label: "Ortalama Süre", icon: "⏱" },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 6 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Neden önemli */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 28px", marginBottom: 32 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.text }}>Kara Liste Neden Önemlidir?</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
                {[
                  { icon: "📧", title: "Mail Teslimi", desc: "IP'niz kara listedeyse gönderdiğiniz e-postalar spam klasörüne düşer veya reddedilir." },
                  { icon: "🌐", title: "Web Reputasyonu", desc: "Mail sunucunuz veya web sunucunuzun itibarını düzenli kontrol edin." },
                  { icon: "🔒", title: "Güvenlik İhlali", desc: "Listede olmanız sisteminizin ele geçirildiğine işaret edebilir." },
                  { icon: "📊", title: "İş Sürekliliği", desc: "Kurumsal iletişiminizin kesintisiz devam etmesi için itibar takibi kritiktir." },
                ].map(item => (
                  <div key={item.title}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kategori kartları */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.sub, letterSpacing: ".08em", margin: "0 0 14px", textTransform: "uppercase" }}>Liste Kategorileri</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginBottom: 32 }}>
              {Object.entries(CAT_DESC).map(([cat, desc]) => (
                <div key={cat} style={{ background: C.card, border: `1px solid ${CAT_COLORS[cat]}30`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[cat] }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: CAT_COLORS[cat] }}>{cat}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: C.dim }}>
                      {ALL_LISTS.filter(l => l.cat === cat).length} liste
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Tüm listeler — kollapsibl kategoriler */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.sub, letterSpacing: ".08em", margin: "0 0 14px", textTransform: "uppercase" }}>Sorgulanan Tüm Listeler</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {Object.entries(catGroups).map(([cat, lists]) => (
                <div key={cat} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
                  <button className="cat-row" onClick={() => setOpenCat(openCat === cat ? null : cat)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "transparent", border: "none", color: C.text, cursor: "pointer", textAlign: "left", transition: "background .15s" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{cat}</span>
                    <span style={{ fontSize: 12, color: C.dim, marginLeft: 4 }}>{lists.length} liste</span>
                    <span style={{ marginLeft: "auto", color: C.dim, fontSize: 13, display: "inline-block", transform: openCat === cat ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
                  </button>
                  {openCat === cat && (
                    <div style={{ borderTop: `1px solid ${C.line}` }}>
                      {lists.map((l, i) => (
                        <div key={l.zone} className="list-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderTop: i > 0 ? `1px solid ${C.line}` : "none", transition: "background .1s" }}>
                          <div style={{ flex: "0 0 180px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.name}</div>
                            <div style={{ fontSize: 11, fontFamily: "monospace", color: C.dim, marginTop: 1 }}>{l.zone}</div>
                          </div>
                          <div style={{ fontSize: 12, color: C.sub, flex: 1 }}>{l.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Listeden çıkarma rehberi */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.sub, letterSpacing: ".08em", margin: "0 0 14px", textTransform: "uppercase" }}>Kara Listeden Çıkarma</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {[
                { name: "Spamhaus Çıkarma", url: "https://www.spamhaus.org/removal/", desc: "SBL, XBL, PBL listelerinden çıkarma. Genellikle otomatik işlenir.", color: "#4f7cff" },
                { name: "Barracuda Çıkarma", url: "https://www.barracudacentral.org/rbl/removal-request", desc: "BRBL listesinden manuel çıkarma talebi gönderebilirsiniz.", color: "#10b981" },
                { name: "SpamCop Bilgi", url: "https://www.spamcop.net/bl.shtml", desc: "SpamCop listesi genellikle 24 saat içinde otomatik düşer.", color: "#f59e0b" },
                { name: "SORBS Çıkarma", url: "https://www.sorbs.net/removal/", desc: "SORBS için ücretli ve ücretsiz çıkarma seçenekleri mevcuttur.", color: "#a78bfa" },
              ].map(item => (
                <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="removal-card"
                  style={{ display: "block", background: C.card, border: `1px solid ${item.color}25`, borderRadius: 14, padding: "16px 18px", textDecoration: "none", transition: "border-color .15s" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.name} →</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{item.desc}</div>
                </a>
              ))}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
