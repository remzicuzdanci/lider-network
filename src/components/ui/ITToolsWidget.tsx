"use client";
import { useState, useEffect, useRef } from "react";

const TOOLS = [
  {
    label: "Threat Portal",
    sub:   "USOM zararlı bağlantı feed'i",
    href:  "https://threat.lidernetwork.com.tr",
    icon:  "🛡",
    color: "#4f7cff",
    glow:  "rgba(79,124,255,.35)",
  },
  {
    label: "Blacklist Sorgu",
    sub:   "IP kara liste sorgulama",
    href:  "https://blacklist.lidernetwork.com.tr",
    icon:  "🚫",
    color: "#ff4f6d",
    glow:  "rgba(255,79,109,.3)",
  },
  {
    label: "IP Sorgu",
    sub:   "IP adresi analiz & konum",
    href:  "https://ip.lidernetwork.com.tr",
    icon:  "🌐",
    color: "#10d98a",
    glow:  "rgba(16,217,138,.3)",
  },
  {
    label: "DNS Checker",
    sub:   "DNS kayıt sorgulama",
    href:  "https://dns.lidernetwork.com.tr",
    icon:  "🔍",
    color: "#fbbf24",
    glow:  "rgba(251,191,36,.3)",
  },
];

export default function ITToolsWidget() {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      ref={wrapRef}
      style={{
        position:      "fixed",
        bottom:        "5.5rem",   // WhatsApp'ın hemen üstü
        right:         "1.5rem",
        zIndex:        49,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-end",
        gap:           8,
      }}
    >
      {/* Açılan araç butonları */}
      {TOOLS.map((t, i) => (
        <a
          key={t.href}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:        "flex",
            alignItems:     "center",
            gap:            10,
            padding:        "9px 16px 9px 12px",
            borderRadius:   99,
            background:     "#0a1228",
            border:         `1px solid ${t.color}45`,
            color:          t.color,
            textDecoration: "none",
            boxShadow:      `0 4px 20px ${t.glow}, 0 1px 4px rgba(0,0,0,.5)`,
            transform:      open
              ? "translateX(0) scale(1)"
              : "translateX(72px) scale(0.85)",
            opacity:        open ? 1 : 0,
            transition:     `transform .28s cubic-bezier(.34,1.56,.64,1) ${i * 55}ms, opacity .22s ease ${i * 55}ms`,
            pointerEvents:  open ? "auto" : "none",
            whiteSpace:     "nowrap",
          }}
        >
          <span
            style={{
              width:          32,
              height:         32,
              borderRadius:   "50%",
              background:     `${t.color}18`,
              border:         `1px solid ${t.color}35`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       16,
              flexShrink:     0,
            }}
          >
            {t.icon}
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>{t.sub}</div>
          </div>
        </a>
      ))}

      {/* Açma / kapama butonu */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="IT Araçları"
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             8,
          padding:         "12px 18px",
          borderRadius:    99,
          background:      open ? "#0f1a3a" : "#0a1228",
          border:          `1px solid ${open ? "#4f7cff80" : "#1e2f5e"}`,
          color:           "#7da4ff",
          cursor:          "pointer",
          fontSize:        13,
          fontWeight:      700,
          fontFamily:      "inherit",
          boxShadow:       open
            ? "0 4px 24px rgba(79,124,255,.4)"
            : "0 4px 16px rgba(0,0,0,.45)",
          transition:      "all .2s ease",
          userSelect:      "none",
        }}
      >
        <span
          style={{
            fontSize:   18,
            display:    "inline-block",
            transform:  open ? "rotate(30deg)" : "none",
            transition: "transform .25s ease",
          }}
        >
          {open ? "✕" : "🛠"}
        </span>
        <span
          style={{
            maxWidth:   open ? 80 : 80,
            overflow:   "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "Kapat" : "IT Araçları"}
        </span>
      </button>
    </div>
  );
}
