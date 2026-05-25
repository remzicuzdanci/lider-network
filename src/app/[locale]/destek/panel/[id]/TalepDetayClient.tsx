"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { Ticket, TicketMessage } from "@/lib/supabase";
import { ArrowLeft, Send, Clock, CheckCircle, Activity, XCircle } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS = {
  open:        { label: "Açık",    color: "#93c5fd", bg: "rgba(0,82,255,.12)",    border: "#0052ff",  icon: <Clock size={16} />      },
  in_progress: { label: "İşlemde", color: "#c4b5fd", bg: "rgba(124,58,237,.12)",  border: "#7c3aed",  icon: <Activity size={16} />   },
  resolved:    { label: "Çözüldü", color: "#86efac", bg: "rgba(22,163,74,.12)",   border: "#16a34a",  icon: <CheckCircle size={16} /> },
  closed:      { label: "Kapalı",  color: "#94a3b8", bg: "rgba(71,85,105,.2)",    border: "#475569",  icon: <XCircle size={16} />     },
} as const;

const PRI: Record<string, { label: string; color: string }> = {
  low: { label: "Düşük", color: "#64748b" }, medium: { label: "Orta", color: "#d97706" },
  high: { label: "Yüksek", color: "#ea580c" }, urgent: { label: "ACİL", color: "#dc2626" },
};

const CAT: Record<string, string> = {
  technical: "Teknik Destek", billing: "Fatura / Lisans",
  general: "Genel Bilgi", feature_request: "Özellik İsteği",
};

export default function TalepDetayClient({
  ticket, messages: initialMessages, userEmail, fullName,
}: {
  ticket: Ticket; messages: TicketMessage[];
  userEmail: string; fullName: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState("");
  const [sent, setSent]         = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true); setError(""); setSent(false);

    const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: reply.trim(),
        sender_name: fullName,
        sender_email: userEmail,
        is_internal_note: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
      setReply("");
      setSent(true);
      router.refresh();
    } else {
      setError("Yanıt gönderilemedi.");
    }
    setSending(false);
  }

  const sc  = STATUS[ticket.status as keyof typeof STATUS] || STATUS.open;
  const pri = PRI[ticket.priority] || PRI.medium;
  const isClosed = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div style={{ background: "var(--color-background)", minHeight: "calc(100vh - 80px)" }}>
      {/* Panel header */}
      <div style={{ background: "#1d2022", borderBottom: "1px solid #434656", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href={`/${locale}/destek/panel`}
          style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8d90a2", textDecoration: "none", fontSize: "13px" }}>
          <ArrowLeft size={14} /> Taleplerim
        </Link>
        <span style={{ color: "#434656" }}>/</span>
        <span style={{ fontFamily: "var(--font-family-label)", fontSize: "12px", fontWeight: 700, color: "#b7c4ff" }}>
          #{String(ticket.ticket_number).padStart(4, "0")}
        </span>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Ticket header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "20px",
              background: sc.bg, border: `1px solid ${sc.border}40`,
              color: sc.color, fontSize: "12px", fontWeight: 700,
            }}>
              {sc.icon} {sc.label}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: pri.color }}>● {pri.label}</span>
            <span style={{ fontSize: "12px", color: "#8d90a2" }}>·</span>
            <span style={{ fontSize: "12px", color: "#8d90a2" }}>{CAT[ticket.category]}</span>
            <span style={{ fontSize: "12px", color: "#8d90a2" }}>·</span>
            <span style={{ fontSize: "12px", color: "#8d90a2" }}>{formatDate(ticket.created_at)}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "20px", fontWeight: 800, color: "#e0e3e5", margin: 0 }}>
            {ticket.subject}
          </h1>
        </div>

        {/* Original message */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0052ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#e0e3e5" }}>{fullName}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#8d90a2" }}>{formatDate(ticket.created_at)}</p>
            </div>
          </div>
          <div style={{ marginLeft: "42px", background: "#1d2022", border: "1px solid #434656", borderRadius: "12px", padding: "16px 18px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#e0e3e5", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Messages */}
        {messages.map((msg) => {
          const isAdmin = msg.sender_type === "admin";
          return (
            <div key={msg.id} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                {!isAdmin && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0052ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ textAlign: isAdmin ? "right" : "left" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: isAdmin ? "#b7c4ff" : "#e0e3e5" }}>
                    {isAdmin ? "Lider Network Destek" : fullName}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#8d90a2" }}>{formatDate(msg.created_at)}</p>
                </div>
                {isAdmin && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,82,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#b7c4ff", flexShrink: 0 }}>
                    LN
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", marginLeft: isAdmin ? 0 : "38px", marginRight: isAdmin ? "38px" : 0 }}>
                <div style={{
                  maxWidth: "80%",
                  background: isAdmin ? "rgba(0,82,255,.1)" : "#1d2022",
                  border: `1px solid ${isAdmin ? "rgba(0,82,255,.25)" : "#434656"}`,
                  borderRadius: "12px", padding: "13px 16px",
                }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#e0e3e5", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />

        {/* Reply form or closed notice */}
        {isClosed ? (
          <div style={{ marginTop: "24px", padding: "20px", background: "#1d2022", border: "1px solid #434656", borderRadius: "12px", textAlign: "center" }}>
            <CheckCircle size={22} color="#22c55e" style={{ marginBottom: "8px" }} />
            <p style={{ fontWeight: 700, color: "#e0e3e5", margin: "0 0 4px" }}>
              Bu talep {ticket.status === "resolved" ? "çözüldü" : "kapatıldı"}
            </p>
            <p style={{ color: "#8d90a2", fontSize: "13px", margin: "0 0 14px" }}>Yeni bir sorun için yeni talep oluşturun</p>
            <Link href={`/${locale}/destek/panel/yeni`}
              style={{ padding: "9px 20px", background: "#0052ff", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
              Yeni Talep
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: "24px", background: "#1d2022", border: "1px solid #434656", borderRadius: "12px", padding: "20px" }}>
            <p style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "#e0e3e5", fontSize: "14px", margin: "0 0 12px" }}>
              Yanıt Ekle
            </p>
            {sent && (
              <div style={{ padding: "10px 12px", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "7px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={14} color="#22c55e" />
                <p style={{ margin: 0, fontSize: "13px", color: "#86efac" }}>Yanıtınız gönderildi.</p>
              </div>
            )}
            {error && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}
            <form onSubmit={sendReply}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Ek bilgi veya güncelleme yazın..."
                rows={4}
                style={{ width: "100%", padding: "11px 14px", background: "#272a2c", border: "1px solid #434656", borderRadius: "8px", color: "#e0e3e5", fontSize: "14px", lineHeight: 1.65, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                onBlur={(e)  => (e.target.style.borderColor = "#434656")}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="submit" disabled={sending || !reply.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    padding: "10px 20px",
                    background: sending || !reply.trim() ? "#434656" : "#0052ff",
                    color: "#fff", border: "none", borderRadius: "8px",
                    fontSize: "14px", fontWeight: 700,
                    cursor: sending || !reply.trim() ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-family-headline)",
                  }}>
                  <Send size={14} />{sending ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
