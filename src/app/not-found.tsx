import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#101415", color: "#e8eaed", fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div style={{ fontSize: "6rem", fontWeight: 900, color: "#0052ff", lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
            Sayfa Bulunamadı
          </h1>
          <p style={{ color: "#8a9bb0", marginBottom: "2rem", maxWidth: 400 }}>
            Aradığınız sayfa taşınmış veya silinmiş olabilir.
          </p>
          <Link
            href="/tr"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              background: "#0052ff",
              color: "#fff",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </body>
    </html>
  );
}
