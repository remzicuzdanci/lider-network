"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Ticket, TicketMessage } from "@/lib/supabase";

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s önce`;
  return `${Math.floor(diff / 86400)}g önce`;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı",
};
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  open:        { bg: "rgba(0,82,255,.12)", text: "#b7c4ff", border: "#0052ff" },
  in_progress: { bg: "rgba(124,58,237,.15)", text: "#c4b5fd", border: "#7c3aed" },
  resolved:    { bg: "rgba(22,163,74,.15)", text: "#86efac", border: "#16a34a" },
  closed:      { bg: "rgba(71,85,105,.2)", text: "#94a3b8", border: "#475569" },
};
const PRI_COLORS: Record<string, string> = {
  low: "#64748b", medium: "#d97706", high: "#ea580c", urgent: "#dc2626",
};
const PRI_LABELS: Record<string, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "ACİL",
};
const CAT_LABELS: Record<string, string> = {
  technical: "Teknik Destek", billing: "Fatura/Lisans", general: "Genel", feature_request: "Özellik İsteği",
};

export default function TicketDetailClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMode, setReplyMode] = useState<"reply" | "note">("reply");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.status === 404) { router.push("/admin/destek"); return; }
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages);
    setLoading(false);
  }, [ticketId, router]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: replyText.trim(),
        is_internal_note: replyMode === "note",
      }),
    });
    if (res.ok) {
      setReplyText("");
      fetchTicket();
    }
    setSending(false);
  }

  async function updateStatus(status: string) {
    setStatusUpdating(true);
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchTicket();
    setStatusUpdating(false);
  }

  async function updatePriority(priority: string) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) fetchTicket();
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-outline)" }}>
      Yükleniyor...
    </div>
  );
  if (!ticket) return null;

  const sc = STATUS_COLORS[ticket.status];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-outline-variant)", padding: "0 32px", display: "flex", alignItems: "center", gap: "16px", height: "60px", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
        <button
          onClick={() => router.push("/admin/destek")}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-on-surface-variant)", fontSize: "13px", cursor: "pointer" }}
        >
          ← Geri
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-family-label)", fontWeight: 700, color: "var(--color-primary)", fontSize: "13px" }}>
              #{String(ticket.ticket_number).padStart(4, "0")}
            </span>
            <span style={{ color: "var(--color-on-surface)", fontWeight: 600, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ticket.subject}
            </span>
            <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: PRI_COLORS[ticket.priority], flexShrink: 0 }}>
              ● {PRI_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <a href="https://www.lidernetwork.com.tr/tr/destek/ticket/" target="_blank" style={{ padding: "6px 12px", border: "1px solid var(--color-outline-variant)", borderRadius: "6px", background: "transparent", color: "var(--color-outline)", fontSize: "12px", textDecoration: "none" }}>
            Müşteri Görünümü ↗
          </a>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "calc(100vh - 60px)" }}>
        {/* Left — Conversation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "28px 32px" }}>
          {/* Description bubble */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0052ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {ticket.customer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-on-surface)" }}>{ticket.customer_name}</span>
                {ticket.company && <span style={{ fontSize: "12px", color: "var(--color-outline)", marginLeft: "6px" }}>· {ticket.company}</span>}
                <span style={{ fontSize: "12px", color: "var(--color-outline)", marginLeft: "6px" }}>{formatDate(ticket.created_at)}</span>
              </div>
            </div>
            <div style={{ marginLeft: "40px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "16px 20px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";
            const isNote = msg.is_internal_note;
            return (
              <div key={msg.id} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                  {!isAdmin && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0052ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ textAlign: isAdmin ? "right" : "left" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: isAdmin ? "var(--color-primary)" : "var(--color-on-surface)" }}>
                      {isAdmin ? (isNote ? "🔒 İç Not" : "Lider Network Destek") : msg.sender_name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-outline)", marginLeft: "8px" }}>
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                  {isAdmin && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isNote ? "#7c3aed" : "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      L
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%",
                    background: isNote
                      ? "rgba(124,58,237,.12)"
                      : isAdmin
                        ? "rgba(0,82,255,.12)"
                        : "var(--color-surface)",
                    border: `1px solid ${isNote ? "#7c3aed33" : isAdmin ? "#0052ff33" : "var(--color-outline-variant)"}`,
                    borderRadius: "12px",
                    padding: "14px 18px",
                  }}>
                    {isNote && (
                      <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".5px" }}>İç Not</p>
                    )}
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />

          {/* Reply Form */}
          <div style={{ marginTop: "24px", background: "var(--color-surface)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", padding: "20px" }}>
            {/* Mode tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {[["reply", "↩ Yanıt Ver"], ["note", "🔒 İç Not"]].map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => setReplyMode(m as "reply" | "note")}
                  style={{
                    padding: "6px 14px", borderRadius: "6px", border: "1px solid",
                    borderColor: replyMode === m ? (m === "note" ? "#7c3aed" : "var(--color-primary-container)") : "var(--color-outline-variant)",
                    background: replyMode === m ? (m === "note" ? "rgba(124,58,237,.15)" : "rgba(0,82,255,.12)") : "transparent",
                    color: replyMode === m ? (m === "note" ? "#c4b5fd" : "var(--color-primary)") : "var(--color-outline)",
                    fontSize: "13px", fontWeight: replyMode === m ? 700 : 400, cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <form onSubmit={sendReply}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={replyMode === "note"
                  ? "Dahili not ekle (müşteriye görünmez)..."
                  : "Müşteriye yanıt yaz..."}
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", background: "var(--color-surface-high)",
                  border: "1px solid var(--color-outline-variant)", borderRadius: "8px",
                  color: "var(--color-on-surface)", fontSize: "14px", lineHeight: 1.6,
                  resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  style={{
                    padding: "10px 20px",
                    background: sending || !replyText.trim()
                      ? "var(--color-outline-variant)"
                      : replyMode === "note" ? "#7c3aed" : "var(--color-primary-container)",
                    color: "#fff", border: "none", borderRadius: "8px",
                    fontSize: "14px", fontWeight: 700, cursor: sending || !replyText.trim() ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-family-headline)",
                  }}
                >
                  {sending ? "Gönderiliyor..." : replyMode === "note" ? "Not Ekle" : "Yanıt Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right — Sidebar */}
        <div style={{
          width: "300px", flexShrink: 0, borderLeft: "1px solid var(--color-outline-variant)",
          background: "var(--color-surface)", overflowY: "auto", padding: "24px 20px",
        }}>
          {/* Status control */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "10px" }}>Durum</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => {
                const sc2 = STATUS_COLORS[v];
                const isActive = ticket.status === v;
                return (
                  <button
                    key={v}
                    onClick={() => !isActive && updateStatus(v)}
                    disabled={isActive || statusUpdating}
                    style={{
                      padding: "8px 12px", borderRadius: "8px", border: "1px solid",
                      borderColor: isActive ? sc2.border : "var(--color-outline-variant)",
                      background: isActive ? sc2.bg : "transparent",
                      color: isActive ? sc2.text : "var(--color-on-surface-variant)",
                      fontSize: "13px", fontWeight: isActive ? 700 : 400,
                      cursor: isActive ? "default" : "pointer", textAlign: "left",
                      transition: "all .15s",
                    }}
                  >
                    {isActive ? "✓ " : ""}{l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority control */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "10px" }}>Öncelik</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(PRI_LABELS).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => ticket.priority !== v && updatePriority(v)}
                  style={{
                    padding: "5px 10px", borderRadius: "6px",
                    border: `1px solid ${ticket.priority === v ? PRI_COLORS[v] : "var(--color-outline-variant)"}`,
                    background: ticket.priority === v ? `${PRI_COLORS[v]}22` : "transparent",
                    color: ticket.priority === v ? PRI_COLORS[v] : "var(--color-outline)",
                    fontSize: "12px", fontWeight: ticket.priority === v ? 700 : 400,
                    cursor: ticket.priority === v ? "default" : "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-outline-variant)", margin: "0 0 20px" }} />

          {/* Customer info */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>Müşteri</p>
            <InfoRow label="Ad Soyad" value={ticket.customer_name} />
            <InfoRow label="E-posta" value={ticket.customer_email} href={`mailto:${ticket.customer_email}`} />
            {ticket.company && <InfoRow label="Şirket" value={ticket.company} />}
            {ticket.phone && <InfoRow label="Telefon" value={ticket.phone} href={`tel:${ticket.phone}`} />}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-outline-variant)", margin: "0 0 20px" }} />

          {/* Ticket meta */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-outline)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>Talep Bilgileri</p>
            <InfoRow label="Kategori" value={CAT_LABELS[ticket.category]} />
            <InfoRow label="Oluşturuldu" value={formatDate(ticket.created_at)} />
            {ticket.first_response_at && (
              <InfoRow
                label="İlk Yanıt"
                value={`${Math.round((new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime()) / 60000)}dk`}
              />
            )}
            {ticket.resolved_at && (
              <InfoRow label="Çözüm Tarihi" value={formatDate(ticket.resolved_at)} />
            )}
            <InfoRow label="Son Güncelleme" value={timeAgo(ticket.updated_at)} />
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {ticket.status !== "resolved" && (
              <button
                onClick={() => updateStatus("resolved")}
                disabled={statusUpdating}
                style={{
                  padding: "10px", borderRadius: "8px", border: "1px solid #16a34a",
                  background: "rgba(22,163,74,.12)", color: "#86efac",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-family-headline)",
                }}
              >
                ✓ Çözüldü Olarak İşaretle
              </button>
            )}
            {ticket.status !== "closed" && ticket.status !== "open" && (
              <button
                onClick={() => updateStatus("closed")}
                disabled={statusUpdating}
                style={{
                  padding: "10px", borderRadius: "8px", border: "1px solid var(--color-outline-variant)",
                  background: "transparent", color: "var(--color-outline)",
                  fontSize: "13px", cursor: "pointer",
                }}
              >
                Talebi Kapat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--color-outline)" }}>{label}</p>
      {href ? (
        <a href={href} style={{ fontSize: "13px", color: "var(--color-primary)", textDecoration: "none" }}>{value}</a>
      ) : (
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-on-surface)", fontWeight: 500 }}>{value}</p>
      )}
    </div>
  );
}
