"use client";
import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/admin-toast";

interface Toast { id: number; message: string; type: ToastType; }

const COLORS: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", icon: "✕" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", icon: "⚠" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", color: "#0052ff", icon: "ℹ" },
};

export default function AdminToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setToasts(p => [...p, { id, message, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };
    window.addEventListener("admin-toast", handler);
    return () => window.removeEventListener("admin-toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "380px" }}>
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "13px 16px", background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,.10)", animation: "slideUp .2s ease" }}>
            <span style={{ fontSize: "16px", fontWeight: 900, color: c.color, flexShrink: 0, lineHeight: 1.2 }}>{c.icon}</span>
            <span style={{ fontSize: "13px", color: "#1a1d2e", lineHeight: 1.5, flex: 1 }}>{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
