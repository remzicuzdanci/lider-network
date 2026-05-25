import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const isAdmin = await getAdminSession();
  if (isAdmin) redirect("/admin/destek");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--color-surface)",
          borderRadius: "16px",
          padding: "40px",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              background: "var(--color-primary-container)",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v10l9 5 9-5V7L12 2z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 12l-9-5M12 12l9-5M12 12v10"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-family-headline)",
              color: "var(--color-on-surface)",
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Lider Network
          </h1>
          <p
            style={{
              color: "var(--color-outline)",
              fontSize: "13px",
              marginTop: "6px",
            }}
          >
            Destek Merkezi — Admin Girişi
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
