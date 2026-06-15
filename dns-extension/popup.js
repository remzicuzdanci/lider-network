/* Lider Network DNS Checker — popup */
const API = "https://www.lidernetwork.com.tr/api/dns";
const FULL = "https://dns.lidernetwork.com.tr";
const TABS = [
  ["records", "🗂️ DNS"],
  ["mail", "✉️ Mail"],
  ["whois", "🔎 WHOIS"],
  ["ssl", "🔒 SSL"],
  ["propagation", "🌍 Propagasyon"],
];

let domain = "";
let tab = "records";
const cache = {};

const $ = (id) => document.getElementById(id);
const el = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d; };
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function clean(raw) {
  return (raw || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "");
}
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1100);
}
function copy(v) { navigator.clipboard && navigator.clipboard.writeText(v); toast("Kopyalandı ✓"); }

function renderTabs() {
  const c = $("tabs"); c.innerHTML = "";
  TABS.forEach(([id, label]) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (id === tab) b.className = "active";
    b.onclick = () => { tab = id; renderTabs(); load(); };
    c.appendChild(b);
  });
}

async function load() {
  if (!domain) return;
  const k = tab + ":" + domain;
  const res = $("result");
  if (cache[k]) return render(cache[k]);
  res.innerHTML = '<p class="muted">Sorgulanıyor…</p>';
  try {
    const r = await fetch(`${API}?domain=${encodeURIComponent(domain)}&type=${tab}`);
    const j = await r.json();
    if (!r.ok) { cache[k] = { error: j.error || "Sorgu başarısız" }; }
    else { cache[k] = { data: j.data }; }
  } catch (e) { cache[k] = { error: "Bağlantı hatası" }; }
  render(cache[k]);
}

function render(state) {
  const res = $("result");
  if (state.error) { res.innerHTML = `<div class="err">⚠ ${esc(state.error)}</div>`; return; }
  const d = state.data;
  if (tab === "records") res.innerHTML = recordsHtml(d);
  else if (tab === "mail") res.innerHTML = mailHtml(d);
  else if (tab === "whois") res.innerHTML = whoisHtml(d);
  else if (tab === "ssl") res.innerHTML = sslHtml(d);
  else if (tab === "propagation") res.innerHTML = propHtml(d);
  // kopyalanabilir kayıtlar
  res.querySelectorAll(".rec").forEach(n => n.addEventListener("click", () => copy(n.dataset.v)));
}

function recordsHtml(d) {
  const order = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "CAA"];
  const has = order.filter(t => (d[t] || []).length);
  if (!has.length) return '<p class="muted">DNS kaydı bulunamadı.</p>';
  return has.map(t => `<div class="grp"><h4>${t}</h4>${d[t].map(r =>
    `<div class="rec" data-v="${esc(r.value)}">${r.priority !== undefined ? `<span class="pri">${r.priority}</span>` : ""}<span class="v">${esc(r.value)}</span><span class="ttl">${r.ttl}</span></div>`
  ).join("")}</div>`).join("");
}
function pill(ok, txt) { return `<span class="pill ${ok ? "ok" : "no"}">${txt}</span>`; }
function provCard(title, p, max) {
  if (!p) return "";
  return `<div class="pcard"><div class="h">${esc(title)} ${p.detected ? pill(true, "AKTİF") : ""} <span style="margin-left:auto;color:${p.score === max ? "var(--green)" : "var(--amber)"}">${p.score}/${max}</span></div>${
    p.items.map(it => `<div class="item"><span class="ic">${it.ok ? "✅" : "❌"}</span><div><div class="lab">${esc(it.label)}</div><div class="fnd">${esc(it.found)}</div>${!it.ok ? `<div class="exp">Beklenen: ${esc(it.expected)}</div>` : ""}</div></div>`).join("")
  }</div>`;
}
function mailHtml(d) {
  return `<div class="grp"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
    <b>${esc(d.provider)}</b>${pill(d.hasMx, "MX")}${pill(!!d.spf, "SPF")}${pill(!!d.dmarc, "DMARC")}${pill(d.dkim.length > 0, "DKIM")}
  </div>
  <div class="row"><span class="l">MX</span><span class="r">${d.mx.length ? d.mx.map(m => esc(m.host)).join("<br>") : "—"}</span></div>
  <div class="row"><span class="l">SPF</span><span class="r" style="font-family:ui-monospace,monospace;font-size:11px">${d.spf ? esc(d.spf) : '<span style="color:var(--red)">yok</span>'}</span></div>
  <div class="row"><span class="l">DMARC</span><span class="r" style="font-family:ui-monospace,monospace;font-size:11px">${d.dmarc ? esc(d.dmarc) : '<span style="color:var(--red)">yok</span>'}</span></div>
  ${provCard("🟦 Google Workspace", d.google, 4)}
  ${provCard("🟧 Microsoft 365 / Exchange", d.microsoft, 5)}</div>`;
}
function fmtDate(s) { if (!s) return "—"; const x = new Date(s); return isNaN(x) ? s : x.toLocaleDateString("tr-TR"); }
function whoisHtml(d) {
  if (d.error) return `<div class="err">⚠ ${esc(d.error)}</div>`;
  return `<div style="text-align:right;margin-bottom:4px"><span class="pill" style="color:var(--sub);border:1px solid var(--line)">kaynak: ${esc(d.source || "—")}</span></div>
  <div class="row"><span class="l">Alan adı</span><span class="r">${esc(d.domain)}</span></div>
  <div class="row"><span class="l">Registrar</span><span class="r">${esc(d.registrar || "—")}</span></div>
  <div class="row"><span class="l">Oluşturma</span><span class="r">${fmtDate(d.created)}</span></div>
  <div class="row"><span class="l">Bitiş</span><span class="r">${fmtDate(d.expires)}</span></div>
  <div class="row"><span class="l">Durum</span><span class="r">${esc((d.status || []).join(", ") || "—")}</span></div>
  <div class="row"><span class="l">Name server</span><span class="r" style="font-family:ui-monospace,monospace;font-size:11px">${esc((d.nameservers || []).join("  ·  ") || "—")}</span></div>
  ${d.raw ? `<details style="margin-top:10px"><summary>Ham WHOIS</summary><pre>${esc(d.raw)}</pre></details>` : ""}`;
}
function sslHtml(d) {
  if (d.error) return `<div class="err">⚠ ${esc(d.error)}</div>`;
  const dr = d.daysRemaining, col = dr <= 0 ? "var(--red)" : dr <= 14 ? "var(--amber)" : "var(--green)";
  return `<div class="row"><span class="l">Durum</span><span class="r" style="color:${col};font-weight:700">${dr <= 0 ? "Süresi dolmuş" : "Geçerli · " + dr + " gün kaldı"}</span></div>
  <div class="row"><span class="l">Sahip</span><span class="r">${esc(d.subject)}</span></div>
  <div class="row"><span class="l">Veren (CA)</span><span class="r">${esc(d.issuer)}</span></div>
  <div class="row"><span class="l">Bitiş</span><span class="r">${fmtDate(d.valid_to)}</span></div>
  <div class="row"><span class="l">SAN</span><span class="r" style="font-size:11px">${esc((d.san || []).join("  ·  "))}</span></div>`;
}
function propHtml(d) {
  return `<div style="font-size:12px;margin-bottom:8px;color:${d.consistent ? "var(--green)" : "var(--amber)"}">${d.consistent ? "✓ Tutarlı (tüm çözücüler aynı IP)" : "⚠ Farklı IP'ler — yayılma sürüyor olabilir"}</div>` +
    d.results.map(r => `<div class="rec" style="cursor:default" data-v="${esc(r.ips.join(", "))}"><span>${r.flag}</span><b style="min-width:78px">${esc(r.name)}</b><span class="v">${esc(r.ips.join(", ") || "—")}</span>${pill(r.ok, r.ok ? "✓" : "✗")}</div>`).join("");
}

/* başlat */
renderTabs();
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = clean($("domain").value);
  if (!d) return;
  domain = d; tab = "records";
  $("openFull").href = `${FULL}/?d=${encodeURIComponent(d)}`;
  renderTabs(); load();
});
$("openFull").href = FULL;

/* aktif sekmenin domain'ini otomatik doldur */
try {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs && tabs[0] && tabs[0].url;
    if (url) { try { const h = new URL(url).hostname; if (h && !/^chrome|^extension/.test(h)) { $("domain").value = h.replace(/^www\./, ""); } } catch (e) {} }
  });
} catch (e) {}
