const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };

function money(n: number, cur: string) {
  return `${SYM[cur] || cur + " "}${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dt(d?: string | null) { return d ? new Date(d).toLocaleDateString("tr-TR") : "—"; }

export interface QuoteHtmlItem {
  description: string; quantity: number; unit_price: number;
  discount: number; kdv_rate: number; unit?: string;
}
export interface QuoteHtmlData {
  quote_no: string;
  customer_name?: string | null;
  customer_address?: string | null;
  tax_office?: string | null;
  tax_no?: string | null;
  contact_name?: string | null;
  company_logo?: string | null;
  quote_date?: string | null;
  valid_until?: string | null;
  currency: string;
  prepared_by?: string | null;
  description?: string | null;
  items: QuoteHtmlItem[];
  totals: { subtotal: number; discount_total: number; net_total: number; kdv_total: number; grand_total: number };
  quote_note?: string | null;
  qr?: string | null;
}

export function buildQuoteHtml(data: QuoteHtmlData): string {
  const cur = data.currency || "TL";
  const m = (n: number) => money(n, cur);
  const kdvRates = [...new Set(data.items.map(i => +i.kdv_rate || 0))];
  const kdvLabel = kdvRates.length === 1 ? `KDV (%${kdvRates[0]})` : "KDV";

  const rows = data.items.map((it, i) => {
    const gross = (+it.quantity || 0) * (+it.unit_price || 0);
    const net = gross - gross * (+it.discount || 0) / 100;
    const bg = i % 2 ? "#f5f8ff" : "#ffffff";
    return `<tr style="background:${bg};">
      <td style="padding:8px 14px;font-size:12px;color:#1f2937;"><span style="color:#0052ff;font-weight:700;">${i + 1}.</span> ${it.description || ""}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;white-space:nowrap;color:#475569;">${it.quantity} ${it.unit || ""}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;white-space:nowrap;color:#475569;">${m(it.unit_price)}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;color:#475569;">%${it.discount || 0}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;color:#475569;">%${it.kdv_rate || 0}</td>
      <td style="padding:8px 14px;font-size:12.5px;text-align:right;font-weight:800;white-space:nowrap;color:#0f172a;">${m(net)}</td>
    </tr>`;
  }).join("");

  const taxLine = (data.tax_office || data.tax_no)
    ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">VD: ${data.tax_office || "—"}  VN: ${data.tax_no || "—"}</div>` : "";
  const addrLine = data.customer_address
    ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${data.customer_address}</div>` : "";
  const attn = data.contact_name
    ? `<div style="font-weight:700;font-size:12px;margin-top:8px;color:#111827;">Sayın ${data.contact_name} dikkatine;</div>` : "";
  const logoCell = data.company_logo
    ? `<td style="border:0;width:96px;text-align:right;vertical-align:top;"><img src="${data.company_logo}" alt="" style="max-width:92px;max-height:48px;object-fit:contain;" onerror="this.style.display='none'"/></td>` : "";
  const disc = data.totals.discount_total;

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<style>
  @page { size:A4; margin:0; }
  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{ font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif; color:#1f2937; font-size:12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .band{ background:linear-gradient(120deg,#0038c7 0%,#0052ff 55%,#3b74ff 100%); padding:16px 40px; }
  .accent{ height:5px; background:#ff5e07; }
  .content{ padding:18px 40px 0; }
  .card{ background:#f8fafc; border:1px solid #e8edf3; border-radius:11px; padding:11px 15px; }
  .intro{ color:#0052ff; font-size:12.5px; margin:12px 0 5px; font-weight:500; }
  table.items{ width:100%; border-collapse:collapse; margin-top:6px; border-radius:9px; overflow:hidden; box-shadow:0 1px 4px rgba(15,23,42,.06); }
  table.items thead th{ background:#0f172a; color:#fff; font-size:10.5px; font-weight:700; padding:9px 12px; letter-spacing:.4px; }
  .totbox{ background:#eef4ff; border:1px solid #cfe0ff; border-radius:12px; padding:12px 18px; }
  .totrow{ display:flex; justify-content:space-between; padding:3px 0; font-size:12.5px; color:#475569; }
  .grand{ border-top:2px solid #0052ff; margin-top:7px; padding-top:8px; font-weight:800; font-size:17px; color:#0052ff; }
  .footer{ background:#0f172a; color:#cbd5e1; padding:14px 40px; margin-top:22px; font-size:11px; text-align:center; }
</style></head><body>

<div class="band">
  <table style="width:100%;border:0;border-collapse:collapse;"><tr>
    <td style="border:0;vertical-align:middle;">
      <span style="display:inline-block;background:#fff;border-radius:12px;padding:10px 20px;box-shadow:0 6px 18px rgba(0,0,0,.22);">
        <img src="https://www.lidernetwork.com.tr/logo.png" alt="Lider Network" style="height:64px;width:auto;display:block;" />
      </span>
      <div style="color:#eaf0ff;font-size:12px;margin-top:9px;font-weight:700;letter-spacing:.3px;">Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.</div>
    </td>
    <td style="border:0;vertical-align:middle;text-align:right;">
      <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:1px;">FİYAT TEKLİFİ</div>
      <div style="display:inline-block;background:rgba(255,255,255,.18);color:#fff;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700;margin-top:12px;">${data.quote_no}</div>
    </td>
  </tr></table>
</div>
<div class="accent"></div>

<div class="content">
  <table style="width:100%;border:0;border-collapse:separate;border-spacing:0;"><tr>
    <td style="border:0;vertical-align:top;width:58%;padding-right:14px;">
      <div class="card" style="border-left:4px solid #0052ff;">
        <table style="width:100%;border:0;border-collapse:collapse;"><tr>
          <td style="border:0;vertical-align:top;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#94a3b8;font-weight:800;margin-bottom:6px;">Müşteri</div>
            <div style="font-weight:800;font-size:14px;color:#0f172a;">${data.customer_name || "—"}</div>
            ${addrLine}${taxLine}${attn}
          </td>
          ${logoCell}
        </tr></table>
      </div>
    </td>
    <td style="border:0;vertical-align:top;width:42%;">
      <div class="card">
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Tarih</span><b style="color:#0f172a;">${dt(data.quote_date)}</b></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Geçerlilik</span><b style="color:#0f172a;">${dt(data.valid_until)}</b></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Para Birimi</span><b style="color:#0f172a;">${cur}</b></div>
        ${data.prepared_by ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#64748b;">Teklifi Veren</span><b style="color:#0f172a;">${data.prepared_by}</b></div>` : ""}
      </div>
    </td>
  </tr></table>

  <p class="intro">Yapmış olduğumuz görüşmeler sonrasında hazırlamış olduğumuz fiyat teklifimizi değerlendirmenize sunarız.</p>

  <table class="items">
    <thead><tr>
      <th style="text-align:left;">AÇIKLAMA</th>
      <th style="text-align:center;">MİKTAR</th>
      <th style="text-align:right;">FİYAT</th>
      <th style="text-align:center;">İSK.</th>
      <th style="text-align:center;">KDV</th>
      <th style="text-align:right;">TUTAR (KDV Hariç)</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;border:0;border-collapse:collapse;margin-top:16px;"><tr>
    <td style="border:0;"></td>
    <td style="border:0;width:300px;">
      <div class="totbox">
        <div class="totrow"><span>Brüt Toplam</span><span style="font-weight:600;color:#1f2937;">${m(data.totals.subtotal)}</span></div>
        ${disc ? `<div class="totrow"><span>İndirim</span><span style="color:#dc2626;font-weight:600;">- ${m(disc)}</span></div>` : ""}
        <div class="totrow"><span>Net Toplam</span><span style="font-weight:600;color:#1f2937;">${m(data.totals.net_total)}</span></div>
        <div class="totrow"><span>${kdvLabel}</span><span style="font-weight:600;color:#1f2937;">${m(data.totals.kdv_total)}</span></div>
        <div class="totrow grand"><span>GENEL TOPLAM</span><span>${m(data.totals.grand_total)}</span></div>
      </div>
    </td>
  </tr></table>

  ${data.description ? `<div style="margin-top:14px;padding:12px 15px;background:#f8fafc;border:1px solid #e8edf3;border-radius:10px;font-size:12px;color:#475569;line-height:1.55;white-space:pre-wrap;">${data.description}</div>` : ""}
  ${data.quote_note ? `<div style="margin-top:8px;padding:9px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e;line-height:1.55;white-space:pre-wrap;">📌 ${data.quote_note}</div>` : ""}

  <div style="font-size:12px;color:#374151;margin-top:18px;line-height:1.55;">
    Teklifimiz ile ilgili sorularınızı cevaplandırmaya hazır olduğumuzu belirtir, çalışmalarınızda başarılar dileriz.
    <div style="margin-top:10px;">Saygılarımızla,</div>
  </div>

  <table style="width:100%;border:0;border-collapse:collapse;margin-top:26px;"><tr>
    ${data.qr ? `<td style="border:0;width:128px;vertical-align:top;padding-right:20px;text-align:center;">
      <img src="${data.qr}" alt="Onay QR" style="width:104px;height:104px;display:block;border:1px solid #e8edf3;border-radius:8px;margin:0 auto;" />
      <div style="font-size:9.5px;color:#475569;margin-top:5px;line-height:1.4;font-weight:700;">📱 Telefonla okutup<br/>onaylayın</div>
    </td>` : ""}
    <td style="border:0;width:50%;padding-right:28px;vertical-align:top;">
      <div style="height:42px;"></div>
      <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151;">
        <div style="font-weight:800;color:#0f172a;">Teklifi Veren</div>
        <div style="margin-top:2px;">${data.prepared_by || "Lider Network"}</div>
        <div style="color:#94a3b8;font-size:11px;margin-top:3px;">Kaşe / İmza</div>
      </div>
    </td>
    <td style="border:0;width:50%;padding-left:28px;vertical-align:top;">
      <div style="height:42px;"></div>
      <div style="border-top:1.5px solid #475569;padding-top:8px;font-size:12px;color:#374151;">
        <div style="font-weight:800;color:#0f172a;">Müşteri Onayı</div>
        <div style="margin-top:2px;">${data.customer_name || "—"}</div>
        <div style="color:#94a3b8;font-size:11px;margin-top:3px;">Kaşe / İmza / Tarih</div>
      </div>
    </td>
  </tr></table>
</div>

<div class="footer">
  <strong style="color:#fff;letter-spacing:1px;">LİDER NETWORK</strong> &nbsp;·&nbsp; +90 312 232 02 88 &nbsp;·&nbsp; info@lidernetwork.com.tr &nbsp;·&nbsp; www.lidernetwork.com.tr
</div>
</body></html>`;
}
