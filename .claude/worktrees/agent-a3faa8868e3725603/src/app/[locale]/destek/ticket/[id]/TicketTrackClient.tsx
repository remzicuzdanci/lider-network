"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, Activity, Send } from "lucide-react";
import type { Ticket, TicketMessage } from "@/lib/supabase";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  open:        { label: "Açık — İnceleniyor",     color: "#93c5fd", bg: "rgba(0,82,255,.12)",     border: "#0052ff",  icon: <Clock size={20} /> },
  in_progress: { label: "İşlemde — Yanıt Verildi", color: "#c4b5fd", bg: "rgba(124,58,237,.12)",  border: "#7c3aed",  icon: <Activity size={20} /> },
  resolved:    { label: "Çözüldü",                 color: "#86efac", bg: "rgba(22,163,74,.12)",   border: "#16a34a",  icon: <CheckCircle size={20} /> },
  closed:      { label: "Kapalı",                  color: "#94a3b8", bg: "rgba(71,85,105,.15)",   border: "#475569",  icon: <XCircle size={20} /> },
};
const PRI_LABELS: Record<string, { label: string; color: string }> = {
  low:    { label: "Düşük",   color: "#64748b" },
  medium: { label: "Orta",    color: "#d97706" },
  high:   { label: "Yüksek",  color: "#ea580c" },
  urgent: { label: "ACİL",    color: "#dc2626" },
};
const CAT_LABELS: Record<string, string> = {
  technical: "Teknik Destek", billing: "Fatura / Lisans",
  general: "Genel Bilgi", feature_request: "Özellik İsteği",
};

export default function TicketTrackClient({
  ticket: initialTicket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: TicketMessage[];
}) {
  const locale = useLocale();
  const router = useRouter();
  const [ticket] = useState(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);

  const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const pri = PRI_LABELS[ticket.priority];

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    setReplyError("");
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          sender_name: ticket.customer_name,
          sender_email: ticket.customer_email,
          is_internal_note: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((m) => [...m, data.message]);
        setReplyText("");
        setReplySuccess(true);
        setTimeout(() => setReplySuccess(false), 3000);
        router.refresh();
      } else {
        setReplyError("Yanıt gönderilemedi. Lütfen tekrar deneyin.");
      }
    } catch {
      setReplyError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <>
      {/* Hero status banner */}
      <section style={{ background: sc.bg, borderBottom: `1px solid ${sc.border}40`, padding: "32px 0" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ color: sc.color, flexShrink: 0, marginTop: "2px" }}>{sc.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-family-label)", fontWeight: 700, color: sc.color, fontSize: "13px" }}>
                  #{String(ticket.ticket_number).padStart(4, "0")}
                </span>
                <span style={{ padding: "2px 10px", borderRadius: "20px", background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontSize: "12px", fontWeight: 700 }}>
                  {sc.label}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: pri.color }}>
                  ● {pri.label} Öncelik
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)", fontSize: "22px", fontWeight: 800, margin: "0 0 4px" }}>
                {ticket.subject}
              </h1>
              <p style={{ color: "var(--color-outline)", fontSize: "13px", margin: 0 }}>
                {CAT_LABELS[ticket.category]} · Oluşturuldu: {formatDate(ticket.created_at)}
              </p>
            </div>
            <Link
              href={`/${locale}/destek`}
              style={{ padding: "8px 16px", border: "1px solid var(--color-outline-variant)", borderRadius: "8px", color: "var(--color-on-surface-variant)", textDecoration: "none", fontSize: "13px", flexShrink: 0 }}
            >
              + Yeni Talep
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "760px" }}>
            {/* Original description */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {ticket.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-on-surface)" }}>{ticket.customer_name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-outline)" }}>{formatDate(ticket.created_at)}</p>
                </div>
              </div>
              <div style={{ marginLeft: "46px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "16px 20px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Messages */}
            {messages.map((msg) => {
              const isAdmin = msg.sender_type === "admin";
              return (
                <div key={msg.id} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                    {!isAdmin && (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ textAlign: isAdmin ? "right" : "left" }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: isAdmin ? "var(--color-primary)" : "var(--color-on-surface)" }}>
                        {isAdmin ? "Lider Network Destek" : msg.sender_name}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-outline)" }}>{formatDate(msg.created_at)}</p>
                    </div>
                    {isAdmin && (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,82,255,.2)", border: "1px solid rgba(0,82,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "var(--color-primary)", flexShrink: 0 }}>
                        LN
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", marginLeft: isAdmin ? 0 : "46px", marginRight: isAdmin ? "46px" : 0 }}>
                    <div style={{
                      maxWidth: "85%",
                      background: isAdmin ? "rgba(0,82,255,.1)" : "var(--color-surface)",
                      border: `1px solid ${isAdmin ? "rgba(0,82,255,.25)" : "var(--color-outline-variant)"}`,
                      borderRadius: "12px", padding: "14px 18px",
                    }}>
                      <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Status info */}
            {isClosed ? (
              <div style={{ padding: "20px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", textAlign: "center", marginTop: "24px" }}>
                <CheckCircle size={24} color="#22c55e" style={{ marginBottom: "8px" }} />
                <p style={{ fontWeight: 700, color: "var(--color-on-surface)", margin: "0 0 4px" }}>
                  Bu talep {ticket.status === "resolved" ? "çözüldü" : "kapatıldı"}
                </p>
                <p style={{ color: "var(--color-outline)", fontSize: "13px", margin: 0 }}>
                  Yeni bir sorun için yeni talep oluşturun
                </p>
                <Link href={`/${locale}/destek`} style={{ display: "inline-block", marginTop: "14px", padding: "10px 20px", background: "var(--color-primary-container)", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
                  Yeni Talep Oluştur
                </Link>
              </div>
            ) : (
              /* Reply form */
              <div style={{ marginTop: "28px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "var(--color-on-surface)", fontSize: "15px", margin: "0 0 14px" }}>
                  Yanıt Ekle
                </p>
                {replySuccess && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.3)", borderRadius: "8px", marginBottom: "12px" }}>
                    <CheckCircle size={16} color="#22c55e" />
                    <p style={{ color: "#86efac", fontSize: "13px", margin: 0 }}>Yanıtınız gönderildi</p>
                  </div>
                )}
                {replyError && (
                  <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{replyError}</p>
                )}
                <form onSubmit={sendReply}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ek bilgi veya güncelleme ekleyin..."
                    rows={4}
                    style={{
                      width: "100%", padding: "12px 14px",
                      background: "var(--color-surface-high)",
                      border: "1px solid var(--color-outline-variant)",
                      borderRadius: "8px", color: "var(--color-on-surface)",
                      fontSize: "14px", lineHeight: 1.6, resize: "vertical",
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px",
                        background: sending || !replyText.trim() ? "var(--color-outline-variant)" : "var(--color-primary-container)",
                        color: "#fff", border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: 700,
                        cursor: sending || !replyText.trim() ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-family-headline)",
                      }}
                    >
                      <Send size={15} />
                      {sending ? "Gönderiliyor..." : "Gönder"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Help */}
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-outline)", marginTop: "32px" }}>
              Acil durumlarda:{" "}
              <a href="tel:+903122320288" style={{ color: "var(--color-primary)", textDecoration: "none" }}>+90 312 232 02 88</a>
              {" "}·{" "}
              <a href={`mailto:info@lidernetwork.com.tr?subject=Talep%20${String(ticket.ticket_number).padStart(4,"0")}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                info@lidernetwork.com.tr
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
