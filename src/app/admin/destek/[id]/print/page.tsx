import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import type { Ticket } from "@/lib/supabase";

export const metadata = { title: "Teknik Servis Formu" };

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapalı",
};
const PRI_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "ACİL",
};
const CAT_LABELS: Record<string, string> = {
  technical: "Teknik Destek",
  billing: "Fatura / Lisans",
  general: "Genel",
  feature_request: "Özellik İsteği",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const { id } = await params;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ticket) redirect("/admin/destek");

  const t = ticket as Ticket;
  const ticketNo = `#${String(t.ticket_number).padStart(4, "0")}`;
  const techName = t.created_by_staff
    ? t.created_by_staff.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

  return (
    <html lang="tr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Teknik Servis Formu — {ticketNo}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1a1d2e;
            background: #fff;
            padding: 32px;
            font-size: 13px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #0052ff;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }
          .logo-block .logo-text {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -1px;
          }
          .logo-block .logo-sub {
            font-size: 11px;
            color: #6b7280;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .doc-info {
            text-align: right;
          }
          .doc-info .doc-title {
            font-size: 18px;
            font-weight: 800;
            color: #0052ff;
          }
          .doc-info .doc-date {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          .ticket-no-bar {
            background: #eff6ff;
            border: 2px solid #bfdbfe;
            border-radius: 10px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .ticket-no {
            font-size: 32px;
            font-weight: 900;
            color: #0052ff;
            letter-spacing: -2px;
          }
          .status-badge {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 800;
            background: #f0fdf4;
            color: #15803d;
            border: 1px solid #bbf7d0;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #0052ff;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #e0e7ff;
            padding-bottom: 6px;
            margin: 20px 0 12px;
          }
          .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .field-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .field {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
          }
          .field .field-label {
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: .8px;
            margin-bottom: 4px;
          }
          .field .field-value {
            font-size: 14px;
            font-weight: 600;
            color: #1a1d2e;
          }
          .description-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 18px;
            font-size: 13px;
            color: #374151;
            line-height: 1.7;
            white-space: pre-wrap;
            min-height: 80px;
            margin-bottom: 8px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 48px;
          }
          .signature-box {
            border-top: 2px solid #1a1d2e;
            padding-top: 12px;
          }
          .signature-box .sig-label {
            font-size: 12px;
            font-weight: 700;
            color: #374151;
          }
          .signature-box .sig-sub {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 2px;
          }
          .footer-bar {
            margin-top: 36px;
            border-top: 1px solid #e2e8f0;
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            color: #9ca3af;
            font-size: 11px;
          }
          .priority-urgent { color: #dc2626; font-weight: 800; }
          .priority-high    { color: #ea580c; font-weight: 700; }
          .priority-medium  { color: #d97706; font-weight: 700; }
          .priority-low     { color: #64748b; }
          @media print {
            body { padding: 20px; }
            @page { margin: 1.5cm; }
          }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <div className="header">
          <div className="logo-block">
            <div className="logo-text" style={{ color: "#0052ff" }}>
              LİDER <span style={{ color: "#1a1d2e", fontWeight: 400 }}>NETWORK</span>
            </div>
            <div className="logo-sub">Teknik Servis Formu / Ziyaret Raporu</div>
          </div>
          <div className="doc-info">
            <div className="doc-title">TEKNİK SERVİS FORMU</div>
            <div className="doc-date">
              Düzenlenme: {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Ticket No Bar */}
        <div className="ticket-no-bar">
          <div>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              Talep Numarası
            </div>
            <div className="ticket-no">{ticketNo}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Durum
            </div>
            <div className="status-badge">{STATUS_LABELS[t.status] || t.status}</div>
          </div>
        </div>

        {/* Müşteri / Şirket Bilgileri */}
        <div className="section-title">Müşteri / Şirket Bilgileri</div>
        <div className="field-grid">
          <div className="field">
            <div className="field-label">Müşteri / Yetkili Adı</div>
            <div className="field-value">{t.customer_name}</div>
          </div>
          <div className="field">
            <div className="field-label">Şirket</div>
            <div className="field-value">{t.company || "—"}</div>
          </div>
          <div className="field">
            <div className="field-label">E-posta</div>
            <div className="field-value" style={{ fontSize: "12px" }}>{t.customer_email}</div>
          </div>
          <div className="field">
            <div className="field-label">Telefon</div>
            <div className="field-value">{t.phone || "—"}</div>
          </div>
        </div>

        {/* Talep Detayları */}
        <div className="section-title">Talep Detayları</div>
        <div className="field-grid-3">
          <div className="field">
            <div className="field-label">Öncelik</div>
            <div className={`field-value priority-${t.priority}`}>
              {PRI_LABELS[t.priority] || t.priority}
            </div>
          </div>
          <div className="field">
            <div className="field-label">Kategori</div>
            <div className="field-value">{CAT_LABELS[t.category] || t.category}</div>
          </div>
          <div className="field">
            <div className="field-label">Talep Kaynağı</div>
            <div className="field-value">
              {t.ticket_source === "internal" ? "İç Talep (Sözleşmeli)" : "Dış Talep (Müşteri)"}
            </div>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <div className="field-label">Oluşturulma Tarihi</div>
            <div className="field-value" style={{ fontSize: "12px" }}>{formatDate(t.created_at)}</div>
          </div>
          <div className="field">
            <div className="field-label">Çözüm Tarihi</div>
            <div className="field-value" style={{ fontSize: "12px" }}>
              {t.resolved_at ? formatDate(t.resolved_at) : "—"}
            </div>
          </div>
        </div>

        {/* Konu */}
        <div className="section-title">Talep Konusu</div>
        <div className="field" style={{ marginBottom: "12px" }}>
          <div className="field-label">Konu Başlığı</div>
          <div className="field-value" style={{ fontSize: "15px" }}>{t.subject}</div>
        </div>

        {/* Açıklama */}
        <div className="section-title">Sorun Açıklaması</div>
        <div className="description-box">{t.description}</div>

        {/* Personel Bilgisi */}
        <div className="section-title">Servis Bilgisi</div>
        <div className="field-grid">
          <div className="field">
            <div className="field-label">İşlemi Yapan Teknisyen</div>
            <div className="field-value">{techName}</div>
          </div>
          <div className="field">
            <div className="field-label">Atanan Personel</div>
            <div className="field-value">
              {t.assigned_to
                ? t.assigned_to.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : "—"}
            </div>
          </div>
        </div>

        {/* Çözüm Notu (boş alan) */}
        <div className="section-title">Yapılan İşlem / Çözüm Notu</div>
        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          minHeight: "80px",
          padding: "14px 18px",
          background: "#fff",
          color: "#9ca3af",
          fontSize: "13px",
          fontStyle: "italic",
        }}>
          {/* Saha personeli bu alana yapılan işlemi yazar */}
        </div>

        {/* İmzalar */}
        <div className="signatures">
          <div className="signature-box">
            <div className="sig-label">Teknisyen İmzası</div>
            <div className="sig-sub">{techName}</div>
            <div style={{ marginTop: "40px", fontSize: "11px", color: "#9ca3af" }}>
              Ad Soyad: .......................... İmza: ..........................
            </div>
          </div>
          <div className="signature-box">
            <div className="sig-label">Müşteri Yetkili İmzası</div>
            <div className="sig-sub">{t.customer_name}{t.company ? ` — ${t.company}` : ""}</div>
            <div style={{ marginTop: "40px", fontSize: "11px", color: "#9ca3af" }}>
              Ad Soyad: .......................... İmza: ..........................
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-bar">
          <div>
            Lider Network Bilişim Hizmetleri &nbsp;|&nbsp;
            +90 312 232 02 88 &nbsp;|&nbsp;
            destek@lidernetwork.com.tr
          </div>
          <div>
            {ticketNo} — {new Date().toLocaleDateString("tr-TR")}
          </div>
        </div>

        {/* Auto-print on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.onload = () => window.print();",
          }}
        />
      </body>
    </html>
  );
}
