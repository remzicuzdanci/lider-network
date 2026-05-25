"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin/destek");
        router.refresh();
      } else {
        setError(data.error || "Giriş başarısız");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-on-surface-variant)",
            marginBottom: "8px",
          }}
        >
          Admin Şifresi
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoFocus
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "var(--color-surface-high)",
            border: `1px solid ${error ? "#ef4444" : "var(--color-outline-variant)"}`,
            borderRadius: "8px",
            color: "var(--color-on-surface)",
            fontSize: "15px",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color .15s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "var(--color-primary-container)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = error
              ? "#ef4444"
              : "var(--color-outline-variant)")
          }
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "6px" }}>
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !password}
        style={{
          width: "100%",
          padding: "13px",
          background: loading ? "var(--color-outline-variant)" : "var(--color-primary-container)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background .15s",
          fontFamily: "var(--font-family-headline)",
        }}
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
