"use client";
import { useState, useCallback, useEffect } from "react";

const C = {
  bg: "#070d1c", card: "#0f1829", card2: "#162035", line: "#1e2d4a",
  text: "#e2e8f8", sub: "#8899bb", dim: "#4a5878",
  blue: "#4d8cf5", green: "#34d399", red: "#f87171", amber: "#fbbf24",
  purple: "#a78bfa",
};

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMS  = "0123456789";
const SYMS  = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const AMBIG = "Il1O0";

function calcStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: C.dim };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s / 7, label: "Çok Zayıf", color: C.red };
  if (s <= 3) return { score: s / 7, label: "Zayıf", color: "#f97316" };
  if (s <= 4) return { score: s / 7, label: "Orta", color: C.amber };
  if (s <= 5) return { score: s / 7, label: "Güçlü", color: C.blue };
  return { score: s / 7, label: "Çok Güçlü", color: C.green };
}

function generatePassword(opts: {
  length: number; upper: boolean; lower: boolean; nums: boolean; syms: boolean; noAmbig: boolean;
}): string {
  let pool = "";
  const required: string[] = [];

  if (opts.upper) { pool += UPPER; required.push(UPPER[Math.floor(Math.random() * UPPER.length)]); }
  if (opts.lower) { pool += LOWER; required.push(LOWER[Math.floor(Math.random() * LOWER.length)]); }
  if (opts.nums)  { pool += NUMS;  required.push(NUMS[Math.floor(Math.random() * NUMS.length)]); }
  if (opts.syms)  { pool += SYMS;  required.push(SYMS[Math.floor(Math.random() * SYMS.length)]); }
  if (!pool) pool = LOWER;

  if (opts.noAmbig) pool = [...pool].filter(c => !AMBIG.includes(c)).join("");

  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  const chars = required.slice(0, opts.length);
  for (let i = chars.length; i < opts.length; i++) {
    chars.push(pool[arr[i] % pool.length]);
  }
  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function PasswordClient() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(false);
  const [noAmbig, setNoAmbig] = useState(false);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    const opts = { length, upper, lower, nums, syms, noAmbig };
    const pws = Array.from({ length: count }, () => generatePassword(opts));
    setPasswords(pws);
    setHistory(prev => [...pws, ...prev].slice(0, 10));
    setCopied(null);
  }, [length, upper, lower, nums, syms, noAmbig, count]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function copy(pw: string) {
    await navigator.clipboard.writeText(pw);
    setCopied(pw);
    setTimeout(() => setCopied(c => c === pw ? null : c), 2000);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(passwords.join("\n"));
    setCopied("__all__");
    setTimeout(() => setCopied(c => c === "__all__" ? null : c), 2000);
  }

  const strength = calcStrength(passwords[0] ?? "");

  const Toggle = ({ label, val, set }: { label: string; val: boolean; set: (v: boolean) => void }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <span onClick={() => set(!val)}
        style={{ width: 42, height: 24, borderRadius: 12, background: val ? C.blue : C.line, position: "relative", transition: "background .2s", flexShrink: 0, cursor: "pointer" }}>
        <span style={{ position: "absolute", top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
      </span>
      <span style={{ fontSize: 13, color: val ? C.text : C.sub }}>{label}</span>
    </label>
  );

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse 1400px 700px at 50% -5%, #0d1d3d 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;background:${C.line};outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${C.blue};cursor:pointer;box-shadow:0 0 0 3px rgba(77,140,245,.25)}
        .pw-card:hover{border-color:rgba(77,140,245,.4)!important}
        .copy-btn:hover{background:rgba(77,140,245,.2)!important}
        a:hover{opacity:.8}
        .gen-btn:hover{filter:brightness(1.1)}
        .hist-row:hover{background:rgba(77,140,245,.07)!important}
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <a href="https://www.lidernetwork.com.tr" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <span style={{ background: "#fff", borderRadius: 11, padding: "6px 14px", display: "inline-flex", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: 36 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.purple, background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.3)", padding: "4px 12px", borderRadius: 20 }}>
              ŞİFRE OLUŞTURUCU
            </span>
          </a>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://blacklist.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>Kara Liste ↗</a>
            <a href="https://ip.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>IP Sorgu ↗</a>
            <a href="https://www.lidernetwork.com.tr" style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}>lidernetwork.com.tr ↗</a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "8px 0 28px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Güvenli Şifre Oluşturucu</h1>
          <p style={{ margin: 0, color: C.sub, fontSize: 14 }}>
            Kriptografik olarak güvenli rastgele şifreler — tamamen tarayıcınızda üretilir, sunucuya gönderilmez.
          </p>
        </section>

        {/* Password display */}
        {passwords.length > 0 && (
          <div style={{ marginBottom: 20, animation: "fadein .3s ease" }}>
            {passwords.map((pw, i) => (
              <div key={i} className="pw-card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, transition: "border-color .15s" }}>
                <span style={{ flex: 1, fontFamily: "monospace", fontSize: passwords.length === 1 ? 20 : 15, fontWeight: 600, color: C.text, wordBreak: "break-all", letterSpacing: ".05em" }}>{pw}</span>
                <button className="copy-btn" onClick={() => copy(pw)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${copied === pw ? C.green : C.line}`, background: copied === pw ? "rgba(52,211,153,.12)" : "transparent", color: copied === pw ? C.green : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s", flexShrink: 0 }}>
                  {copied === pw ? "✓ Kopyalandı" : "Kopyala"}
                </button>
              </div>
            ))}
            {passwords.length === 1 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ flex: 1, height: 6, background: C.line, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${strength.score * 100}%`, background: strength.color, borderRadius: 999, transition: "width .4s, background .4s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: strength.color, minWidth: 80, textAlign: "right" }}>{strength.label}</span>
                </div>
                <div style={{ fontSize: 11, color: C.dim }}>
                  Entropi: ~{Math.round(Math.log2(Math.pow(
                    (upper ? 26 : 0) + (lower ? 26 : 0) + (nums ? 10 : 0) + (syms ? 28 : 0) || 26,
                    length
                  )))} bit
                </div>
              </div>
            )}
            {passwords.length > 1 && (
              <button onClick={copyAll} className="copy-btn"
                style={{ width: "100%", marginTop: 4, padding: "10px", borderRadius: 10, border: `1px solid ${copied === "__all__" ? C.green : C.line}`, background: copied === "__all__" ? "rgba(52,211,153,.1)" : C.card2, color: copied === "__all__" ? C.green : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                {copied === "__all__" ? "✓ Tümü kopyalandı" : `Tümünü kopyala (${passwords.length})`}
              </button>
            )}
          </div>
        )}

        {/* Options + Generate */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 24px 20px", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>Seçenekler</h3>

          {/* Length */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Uzunluk</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{length}</span>
            </div>
            <input type="range" min={6} max={64} value={length} onChange={e => setLength(+e.target.value)}
              style={{ width: "100%", accentColor: C.blue }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.dim }}>6</span>
              <span style={{ fontSize: 11, color: C.dim }}>64</span>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <Toggle label="Büyük harf (A–Z)" val={upper} set={setUpper} />
            <Toggle label="Küçük harf (a–z)" val={lower} set={setLower} />
            <Toggle label="Rakam (0–9)" val={nums} set={setNums} />
            <Toggle label="Sembol (!@#$…)" val={syms} set={setSyms} />
            <Toggle label="Belirsiz karakterleri hariç tut (Il1O0)" val={noAmbig} set={setNoAmbig} />
          </div>

          {/* Count */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Adet</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 3, 5, 10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${count === n ? C.blue : C.line}`, background: count === n ? "rgba(77,140,245,.15)" : "transparent", color: count === n ? C.text : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} className="gen-btn"
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, #3b6fd4, ${C.blue})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(77,140,245,.3)", transition: "filter .15s" }}>
            🔄 Yeni Şifre Oluştur
          </button>
        </div>

        {/* Tips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "🎲", title: "Tarayıcıda Üretilir", desc: "Şifreler sunucuya gönderilmez. Web Crypto API kullanılır." },
            { icon: "📏", title: "12+ Karakter Öneririz", desc: "Uzun şifreler kaba kuvvet saldırılarına karşı çok daha güvenlidir." },
            { icon: "🔁", title: "Her Hesap Farklı", desc: "Aynı şifreyi birden fazla yerde kullanmayın." },
            { icon: "🔑", title: "Şifre Yöneticisi", desc: "Oluşturduğunuz şifreleri bir şifre yöneticisinde saklayın." },
          ].map(t => (
            <div key={t.title} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.sub, letterSpacing: ".06em", textTransform: "uppercase" }}>Son Oluşturulanlar</h3>
              <button onClick={() => setHistory([])}
                style={{ fontSize: 11, color: C.dim, background: "transparent", border: "none", cursor: "pointer", padding: "2px 6px" }}>
                Temizle
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {history.map((pw, i) => (
                <div key={i} className="hist-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, transition: "background .1s" }}>
                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 13, color: C.sub, wordBreak: "break-all" }}>{pw}</span>
                  <button className="copy-btn" onClick={() => copy(pw)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${copied === pw ? C.green : C.line}`, background: "transparent", color: copied === pw ? C.green : C.dim, fontSize: 11, cursor: "pointer", flexShrink: 0, transition: "all .15s" }}>
                    {copied === pw ? "✓" : "Kopyala"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
