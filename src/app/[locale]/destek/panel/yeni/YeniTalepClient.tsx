"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useDestekPaths } from "@/lib/destek-path";
import {
  ArrowLeft, Send, CheckCircle, Plus,
  LayoutDashboard, AlertCircle, Paperclip, X, ImageIcon, FileText, Upload,
} from "lucide-react";

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;   // data URL for images
  status: "uploading" | "done" | "error";
  url?: string;       // public URL after upload
  errorMsg?: string;
}

type Category = "technical" | "billing" | "general" | "feature_request";
type Priority  = "low" | "medium" | "high" | "urgent";

const CATEGORIES = [
  { value: "technical" as Category,       label: "Teknik Destek",   desc: "Donanım, yazılım, ağ sorunları",   icon: "🖥️" },
  { value: "billing" as Category,         label: "Fatura / Lisans", desc: "Fatura ve lisans işlemleri",        icon: "🧾" },
  { value: "general" as Category,         label: "Genel Bilgi",     desc: "Ürün ve hizmetler hakkında",        icon: "💬" },
  { value: "feature_request" as Category, label: "Özellik İsteği",  desc: "Yeni özellik veya iyileştirme",     icon: "✨" },
];
const PRIORITIES = [
  { value: "low" as Priority,    label: "Düşük",  color: "#64748b", bg: "#f1f5f9", desc: "1-2 iş günü" },
  { value: "medium" as Priority, label: "Orta",   color: "#d97706", bg: "#fffbeb", desc: "8 saat" },
  { value: "high" as Priority,   label: "Yüksek", color: "#ea580c", bg: "#fff7ed", desc: "4 saat" },
  { value: "urgent" as Priority, label: "ACİL",   color: "#dc2626", bg: "#fef2f2", desc: "2 saat" },
];

export default function YeniTalepClient({
  userId, userEmail, fullName, company, phone,
}: {
  userId: string; userEmail: string; fullName: string; company?: string | null; phone?: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const paths  = useDestekPaths(locale);
  const [category, setCategory] = useState<Category>("technical");
  const [priority, setPriority] = useState<Priority>("medium");
  const [subject, setSubject]   = useState("");
  const [desc, setDesc]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const uploadFile = useCallback(async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    const isImage = file.type.startsWith("image/");
    let preview: string | undefined;
    if (isImage) {
      preview = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    setAttachments((prev) => [...prev, { id, name: file.name, size: file.size, type: file.type, preview, status: "uploading" }]);

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/tickets/attachments", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, status: "done", url: data.url } : a));
      } else {
        setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, status: "error", errorMsg: data.error || "Yükleme hatası" } : a));
      }
    } catch {
      setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, status: "error", errorMsg: "Bağlantı hatası" } : a));
    }
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = 5 - attachments.filter((a) => a.status !== "error").length;
    arr.slice(0, remaining).forEach(uploadFile);
  }, [attachments, uploadFile]);

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.length < 5) { setError("Konu en az 5 karakter olmalıdır."); return; }
    if (desc.length < 20)   { setError("Açıklama en az 20 karakter olmalıdır."); return; }
    if (attachments.some((a) => a.status === "uploading")) {
      setError("Dosyalar henüz yükleniyor, lütfen bekleyin."); return;
    }

    setLoading(true); setError("");

    const attachment_urls = attachments.filter((a) => a.status === "done" && a.url).map((a) => a.url!);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: fullName, customer_email: userEmail,
        company: company || "", phone: phone || "",
        subject, description: desc, category, priority,
        user_id: userId,
        ...(attachment_urls.length > 0 && { attachment_urls }),
      }),
    });

    const data = await res.json();
    if (res.ok) { setDone(data.ticket_number); }
    else        { setError(data.error || "Bir hata oluştu."); }
    setLoading(false);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "#f8f9fb", border: "1.5px solid #e2e5ed",
    borderRadius: "10px", color: "#1a1d2e", fontSize: "14px",
    outline: "none", fontFamily: "inherit", transition: "border-color .15s",
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done !== null) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-family-body)" }}>
        <Sidebar paths={paths} initials={initials} fullName={fullName} company={company} locale={locale} />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
          <div style={{ background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,.06)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={30} color="#22c55e" />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-headline)", color: "#1a1d2e", fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>
              Talebiniz Oluşturuldu!
            </h2>
            <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 8px" }}>Talep numaranız:</p>
            <p style={{ fontFamily: "var(--font-family-label)", fontSize: "42px", fontWeight: 900, color: "#0052ff", margin: "0 0 24px", letterSpacing: "-1px" }}>
              #{String(done).padStart(4, "0")}
            </p>
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", marginBottom: "28px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", lineHeight: 1.6 }}>
                Onay e-postası <strong>{userEmail}</strong> adresinize gönderildi.
              </p>
            </div>
            <Link href={paths.panel}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#0052ff", color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px", boxShadow: "0 4px 12px rgba(0,82,255,.3)" }}>
              <LayoutDashboard size={15} /> Panele Dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-family-body)" }}>
      <Sidebar paths={paths} initials={initials} fullName={fullName} company={company} locale={locale} />

      <main style={{ flex: 1, padding: "28px 32px", minWidth: 0, overflowY: "auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Link href={paths.panel}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#6b7280", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
            <ArrowLeft size={14} /> Taleplerim
          </Link>
          <span style={{ color: "#d1d5db" }}>/</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1d2e" }}>Yeni Talep</span>
        </div>

        <div style={{ maxWidth: "680px" }}>
          <h1 style={{ fontFamily: "var(--font-family-headline)", fontSize: "22px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 6px" }}>
            Yeni Destek Talebi
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>
            Sorununuzu aşağıdaki formu doldurarak bize iletebilirsiniz.
          </p>

          {error && (
            <div style={{ display: "flex", gap: "8px", padding: "12px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "10px", marginBottom: "20px" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <div style={{ background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <form onSubmit={handleSubmit}>
              {/* Category */}
              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Kategori</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                      style={{
                        padding: "13px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                        border: `1.5px solid ${category === c.value ? "#0052ff" : "#e5e7ef"}`,
                        background: category === c.value ? "#eff6ff" : "#f8f9fb",
                        transition: "all .15s",
                      }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: category === c.value ? "#0052ff" : "#1a1d2e" }}>
                        <span style={{ marginRight: "6px" }}>{c.icon}</span>{c.label}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Öncelik</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PRIORITIES.map((p) => (
                    <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                      style={{
                        padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                        border: `1.5px solid ${priority === p.value ? p.color : "#e5e7ef"}`,
                        background: priority === p.value ? p.bg : "transparent",
                        transition: "all .15s",
                      }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: priority === p.value ? p.color : "#6b7280" }}>{p.label}</span>
                      <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "6px" }}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Konu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sorununuzu kısaca özetleyin" required style={inp}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e2e5ed")}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  Açıklama <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Sorununuzu ayrıntılı açıklayın. Hata mesajları, etkilenen cihaz/sistem, ne zaman başladığı gibi bilgileri ekleyin..."
                  rows={6} required
                  style={{ ...inp, resize: "vertical", lineHeight: 1.65 }}
                  onFocus={(e) => (e.target.style.borderColor = "#0052ff")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e2e5ed")}
                />
                <p style={{ textAlign: "right", fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                  {desc.length} / 5000
                </p>
              </div>

              {/* Attachments */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Paperclip size={13} /> Ekran Görüntüsü / Ek Dosya</span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "6px" }}>İsteğe bağlı — maks. 5 dosya, 10 MB</span>
                </label>

                {/* Drop zone */}
                {attachments.filter((a) => a.status !== "error").length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    style={{
                      border: `2px dashed ${dragOver ? "#0052ff" : "#d1d5db"}`,
                      borderRadius: "12px",
                      padding: "22px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: dragOver ? "#eff6ff" : "#fafafa",
                      transition: "all .15s",
                      marginBottom: attachments.length > 0 ? "12px" : 0,
                    }}
                  >
                    <Upload size={22} color={dragOver ? "#0052ff" : "#9ca3af"} style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontSize: "13px", color: dragOver ? "#0052ff" : "#6b7280", fontWeight: 500 }}>
                      Sürükleyip bırakın veya <span style={{ color: "#0052ff", fontWeight: 700 }}>dosya seçin</span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>JPG, PNG, GIF, WebP, PDF</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
                />

                {/* File list */}
                {attachments.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {attachments.map((att) => (
                      <div key={att.id} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px",
                        border: `1.5px solid ${att.status === "error" ? "#fca5a5" : att.status === "done" ? "#bbf7d0" : "#e5e7ef"}`,
                        borderRadius: "8px",
                        background: att.status === "error" ? "#fef2f2" : att.status === "done" ? "#f0fdf4" : "#f8f9fb",
                      }}>
                        {/* Thumbnail / icon */}
                        {att.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.preview} alt={att.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: "6px", background: "#e5e7ef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {att.type === "application/pdf" ? <FileText size={18} color="#6b7280" /> : <ImageIcon size={18} color="#6b7280" />}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: att.status === "error" ? "#dc2626" : att.status === "uploading" ? "#d97706" : "#6b7280" }}>
                            {att.status === "uploading" && "Yükleniyor..."}
                            {att.status === "done" && `${(att.size / 1024).toFixed(0)} KB — Yüklendi`}
                            {att.status === "error" && (att.errorMsg || "Hata")}
                          </p>
                        </div>

                        <button type="button" onClick={() => removeAttachment(att.id)}
                          style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", borderRadius: "4px", flexShrink: 0 }}>
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <Link href={paths.panel}
                  style={{ padding: "12px 20px", border: "1.5px solid #e5e7ef", borderRadius: "10px", color: "#6b7280", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center" }}>
                  İptal
                </Link>
                <button type="submit" disabled={loading}
                  style={{
                    flex: 1, padding: "12px",
                    background: loading ? "#d1d5db" : "#0052ff",
                    color: loading ? "#9ca3af" : "#fff",
                    border: "none", borderRadius: "10px",
                    fontSize: "15px", fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-family-headline)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(0,82,255,.3)",
                    transition: "all .15s",
                  }}>
                  {loading ? "Gönderiliyor..." : <><Send size={16} /> Talebi Gönder</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Shared Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ paths, initials, fullName, company, locale }: {
  paths: ReturnType<typeof useDestekPaths>;
  initials: string; fullName: string; company?: string | null; locale: string;
}) {
  return (
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
        <SideLink href={paths.panel} icon={<LayoutDashboard size={16} />} label="Taleplerim" />
        <SideLink href={paths.yeni}  icon={<Plus size={16} />}           label="Yeni Talep" active />
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
  );
}

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
