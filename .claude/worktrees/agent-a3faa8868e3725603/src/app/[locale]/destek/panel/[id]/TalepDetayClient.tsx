"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useDestekPaths } from "@/lib/destek-path";
import type { Ticket, TicketMessage } from "@/lib/supabase";
import {
  ArrowLeft, Send, Clock, CheckCircle, Activity,
  XCircle, Plus, LayoutDashboard, AlertCircle,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS = {
  open:        { label: "Açık",    color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", icon: <Clock size={13} />      },
  in_progress: { label: "İşlemde", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: <Activity size={13} />   },
  resolved:    { label: "Çözüldü", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={13} /> },
  closed:      { label: "Kapalı",  color: "#475569", bg: "#f8fafc", border: "#e2e8f0", icon: <XCircle size={13} />    },
} as const;

const PRI: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Düşük",  color: "#64748b", bg: "#f1f5f9" },
  medium: { label: "Orta",   color: "#d97706", bg: "#fffbeb" },
  high:   { label: "Yüksek", color: "#ea580c", bg: "#fff7ed" },
  urgent: { label: "ACİL",   color: "#dc2626", bg: "#fef2f2" },
};

const CAT: Record<string, string> = {
  technical: "Teknik Destek", billing: "Fatura / Lisans",
  general: "Genel Bilgi", feature_request: "Özellik İsteği",
};

export default function TalepDetayClient({
  ticket, messages: initialMessages, userEmail, fullName, company,
}: {
  ticket: Ticket; messages: TicketMessage[];
  userEmail: string; fullName: string; company?: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState("");
  const [sent, setSent]         = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const initials   = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sc         = STATUS[ticket.status as keyof typeof STATUS] || STATUS.open;
  const pri        = PRI[ticket.priority] || PRI.medium;
  const isClosed   = ticket.status === "resolved" || ticket.status === "closed";

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-family-body)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "240px", flexShrink: 0,
        background: "#fff", borderRight: "1px solid #e5e7ef",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f2f8" }}>
          <Image src="/logo.png" alt="Lider Network" width={130} height={38} style={{ objectFit: "contain" }} />
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".8px", padding: "0 12px", margin: "0 0 6px" }}>Menü</p>
          <SideLink href={paths.panel} icon={<LayoutDashboard size={16} />} label="Taleplerim" active />
          <SideLink href={paths.yeni}  icon={<Plus size={16} />}           label="Yeni Talep" />
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f8", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #0052ff, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</p>
            {company && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company}</p>}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "28px 32px", minWidth: 0, overflowY: "auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Link href={paths.panel}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#6b7280", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
            <ArrowLeft size={14} /> Taleplerim
          </Link>
          <span style={{ color: "#d1d5db" }}>/</span>
          <span style={{ fontFamily: "var(--font-family-label)", fontSize: "13px", fontWeight: 700, color: "#0052ff" }}>
            #{String(ticket.ticket_number).padStart(4, "0")}
          </span>
        </div>

        <div style={{ maxWidth: "780px" }}>
          {/* Ticket header card */}
          <div style={{ background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "16px", padding: "22px 24px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
              {/* Status */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.color, fontSize: "12px", fontWeight: 700 }}>
                {sc.icon} {sc.label}
              </span>
              {/* Priority */}
              <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: pri.bg, color: pri.color }}>
                {pri.label}
              </span>
              <span style={{ fontSize: "12px", color: "#d1d5db" }}>·</span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{CAT[ticket.category]}</span>
              <span style={{ fontSize: "12px", color: "#d1d5db" }}>·</span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{formatDate(ticket.created_at)}</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", margin: 0 }}>
              {ticket.subject}
            </h1>
          </div>

          {/* Chat thread */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {/* Original message */}
            <MessageBubble
              name={fullName}
              initial={fullName.charAt(0).toUpperCase()}
              date={formatDate(ticket.created_at)}
              content={ticket.description}
              isAdmin={false}
            />

            {/* Replies */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                name={msg.sender_type === "admin" ? "Lider Network Destek" : fullName}
                initial={msg.sender_type === "admin" ? "LN" : fullName.charAt(0).toUpperCase()}
                date={formatDate(msg.created_at)}
                content={msg.content}
                isAdmin={msg.sender_type === "admin"}
              />
            ))}
            <div ref={endRef} />
          </div>

          {/* Reply form / closed notice */}
          {isClosed ? (
            <div style={{ background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "16px", padding: "28px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={22} color="#22c55e" />
              </div>
              <p style={{ fontWeight: 700, color: "#1a1d2e", margin: "0 0 4px", fontSize: "15px" }}>
                Bu talep {ticket.status === "resolved" ? "çözüldü" : "kapatıldı"}
              </p>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 20px" }}>
                Yeni bir sorun için lütfen yeni talep oluşturun.
              </p>
              <Link href={paths.yeni}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", background: "#0052ff", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
                <Plus size={15} /> Yeni Talep Oluştur
              </Link>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <p style={{ fontFamily: "var(--font-family-headline)", fontWeight: 700, color: "#1a1d2e", fontSize: "14px", margin: "0 0 14px" }}>
                Yanıt Ekle
              </p>

              {sent && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "9px", marginBottom: "12px" }}>
                  <CheckCircle size={14} color="#22c55e" />
                  <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>Yanıtınız başarıyla gönderildi.</p>
                </div>
              )}
              {error && (
                <div style={{ display: "flex", gap: "8px", padding: "10px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "9px", marginBottom: "12px" }}>
                  <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
                </div>
              )}

              <form onSubmit={sendReply}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Ek bilgi veya güncelleme yazın..."
                  rows={4}
                  style={{
                    width: "100%", padding: "11px 14px", boxSizing: "border-box",
                    background: "#f8f9fb", border: "1.5px solid #e2e5ed",
                    borderRadius: "10px", color: "#1a1d2e", fontSize: "14px",
                    lineHeight: 1.65, resize: "vertical", outline: "none",
                    fontFamily: "inherit", transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e2e5ed")}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="submit" disabled={sending || !reply.trim()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "10px 22px",
                      background: sending || !reply.trim() ? "#d1d5db" : "#0052ff",
                      color: sending || !reply.trim() ? "#9ca3af" : "#fff",
                      border: "none", borderRadius: "10px",
                      fontSize: "14px", fontWeight: 700,
                      cursor: sending || !reply.trim() ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-family-headline)",
                      boxShadow: sending || !reply.trim() ? "none" : "0 4px 12px rgba(0,82,255,.3)",
                      transition: "all .15s",
                    }}>
                    <Send size={14} />
                    {sending ? "Gönderiliyor..." : "Gönder"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ name, initial, date, content, isAdmin }: {
  name: string; initial: string; date: string; content: string; isAdmin: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: isAdmin ? "row-reverse" : "row", gap: "12px", alignItems: "flex-start" }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: isAdmin ? "linear-gradient(135deg, #0040cc, #6366f1)" : "linear-gradient(135deg, #0052ff, #6366f1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 800, color: "#fff",
      }}>
        {initial}
      </div>

      {/* Bubble */}
      <div style={{ flex: 1, maxWidth: "82%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: isAdmin ? "#0052ff" : "#1a1d2e" }}>{name}</p>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{date}</p>
        </div>
        <div style={{
          background: isAdmin ? "#eff6ff" : "#fff",
          border: `1.5px solid ${isAdmin ? "#bfdbfe" : "#e5e7ef"}`,
          borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "14px 18px",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
        }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#1a1d2e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Link ──────────────────────────────────────────────────────────────
function SideLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 12px", borderRadius: "8px", textDecoration: "none",
      background: active ? "#eff6ff" : "transparent",
      color: active ? "#0052ff" : "#6b7280",
      fontSize: "14px", fontWeight: active ? 600 : 400,
      transition: "all .15s", marginBottom: "2px",
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8f9fb"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );
}
