"use client";
import { useState } from "react";

interface Item { description: string; quantity: number; unit_price: number; discount: number; kdv_rate: number; unit?: string }
interface Quote {
  id: string; quote_no: string; customer_name: string | null;
  items: Item[]; currency: string;
  subtotal: number; discount_total: number; net_total: number; kdv_total: number; grand_total: number;
  quote_date: string | null; valid_until: string | null; description: string | null;
  status: string; created_by: string | null; approved_at: string | null;
}

const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };

export default function OnayClient({ quote }: { quote: Quote }) {
  const decided0 = quote.status === "accepted" || quote.status === "rejected" || quote.status === "ordered";
  const [status, setStatus] = useState(quote.status);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "accepted" | "rejected">(decided0 ? (quote.status === "rejected" ? "rejected" : "accepted") : null);

  const cur = quote.currency || "TL";
  const m = (n: number) => `${SYM[cur] || cur} ${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dt = (s: string | null) => s ? new Date(s).toLocaleDateString("tr-TR") : "—";

  async function decide(action: "accept" | "reject") {
    if (busy) return;
    if (action === "reject" && !confirm("Bu teklifi reddetmek istediğinize emin misiniz?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/teklif/${quote.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) { alert("Hata: " + (d.error || "işlem yapılamadı")); return; }
      const ns = d.status || (action === "accept" ? "accepted" : "rejected");
      setStatus(ns);
      setDone(ns === "rejected" ? "rejected" : "accepted");
    } catch { alert("Bağlantı hatası, tekrar deneyin."); }
    finally { setBusy(false); }
  }

  const items = Array.isArray(quote.items) ? quote.items : [];

  return (
    <main style={{ minHeight: "100vh", background: "#eef1f6", fontFamily: "Arial, Helvetica, sans-serif", padding: "24px 14px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 6px 28px rgba(15,23,42,.10)" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style={{ height: "38px" }} />
          <div style={{ textAlign: "right", fontSize: "12px", color: "#94a3b8" }}>
            Fiyat Teklifi<br /><b style={{ color: "#0052ff", fontSize: "14px" }}>{quote.quote_no}</b>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#94a3b8" }}>Sayın</p>
          <h1 style={{ margin: "0 0 18px", fontSize: "20px", color: "#0f172a" }}>{quote.customer_name || "Müşterimiz"}</h1>

          {done ? (
            <div style={{ textAlign: "center", padding: "26px 20px", borderRadius: "12px", background: done === "accepted" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${done === "accepted" ? "#bbf7d0" : "#fecaca"}`, marginBottom: "20px" }}>
              <div style={{ fontSize: "44px", marginBottom: "6px" }}>{done === "accepted" ? "✅" : "↩️"}</div>
              <h2 style={{ margin: "0 0 6px", fontSize: "19px", color: done === "accepted" ? "#15803d" : "#b91c1c" }}>
                {done === "accepted" ? "Teklif Onaylandı" : "Teklif Reddedildi"}
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
                {done === "accepted"
                  ? "Teşekkür ederiz! Ekibimiz en kısa sürede sizinle iletişime geçecek."
                  : "Geri bildiriminiz için teşekkürler. Dilerseniz revize bir teklif hazırlayabiliriz."}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: "0 0 18px" }}>
              Aşağıdaki fiyat teklifimizi değerlendirmenize sunarız. İncelemenizin ardından teklifi onaylayabilir veya reddedebilirsiniz.
            </p>
          )}

          {/* Kalemler */}
          <div style={{ border: "1px solid #e6ebf2", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase" }}>Açıklama</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: "11px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Miktar</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const gross = (+it.quantity || 0) * (+it.unit_price || 0);
                  const net = gross - gross * (+it.discount || 0) / 100;
                  return (
                    <tr key={i} style={{ background: i % 2 ? "#f6f8fc" : "#fff" }}>
                      <td style={{ padding: "10px 12px", color: "#1f2937", borderBottom: "1px solid #eef2f7" }}><b style={{ color: "#0052ff" }}>{i + 1}.</b> {it.description}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#475569", borderBottom: "1px solid #eef2f7", whiteSpace: "nowrap" }}>{it.quantity} {it.unit || ""}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #eef2f7", whiteSpace: "nowrap" }}>{m(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Toplam */}
          <div style={{ background: "#eef4ff", border: "1px solid #cfe0ff", borderRadius: "12px", padding: "14px 18px", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", padding: "2px 0" }}><span>Net Toplam</span><span>{m(quote.net_total)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", padding: "2px 0" }}><span>KDV</span><span>{m(quote.kdv_total)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #0052ff", marginTop: "6px", paddingTop: "8px", fontWeight: 800, fontSize: "17px", color: "#0052ff" }}><span>GENEL TOPLAM</span><span>{m(quote.grand_total)}</span></div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#94a3b8", marginBottom: "20px" }}>
            <span>Tarih: <b style={{ color: "#475569" }}>{dt(quote.quote_date)}</b></span>
            {quote.valid_until && <span>Geçerlilik: <b style={{ color: "#475569" }}>{dt(quote.valid_until)}</b></span>}
            {quote.created_by && <span>Teklifi Veren: <b style={{ color: "#475569" }}>{quote.created_by}</b></span>}
          </div>

          {/* Aksiyonlar */}
          {!done && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => decide("accept")} disabled={busy}
                style={{ flex: 1, minWidth: "160px", padding: "15px", background: busy ? "#9ca3af" : "#15803d", color: "#fff", border: "none", borderRadius: "11px", fontSize: "15px", fontWeight: 800, cursor: busy ? "default" : "pointer" }}>
                ✅ {busy ? "İşleniyor…" : "Teklifi Onaylıyorum"}
              </button>
              <button onClick={() => decide("reject")} disabled={busy}
                style={{ padding: "15px 20px", background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: "11px", fontSize: "14px", fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                Reddet
              </button>
            </div>
          )}
        </div>

        <div style={{ background: "#0f172a", color: "#cbd5e1", padding: "14px 28px", textAlign: "center", fontSize: "11px" }}>
          <b style={{ color: "#fff", letterSpacing: "1px" }}>LİDER NETWORK</b> &nbsp;·&nbsp; +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: "11px", color: "#9aa4b2", marginTop: "12px" }}>Bu sayfa Lider Network tarafından oluşturulmuştur.</p>
    </main>
  );
}
