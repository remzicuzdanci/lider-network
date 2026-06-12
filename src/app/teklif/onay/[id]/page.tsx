import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import OnayClient from "./OnayClient";

export const metadata: Metadata = {
  title: "Teklif Onayı | Lider Network",
  robots: { index: false, follow: false },
};

export default async function TeklifOnayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, quote_no, customer_name, items, currency, subtotal, discount_total, net_total, kdv_total, grand_total, quote_date, valid_until, description, status, created_by, approved_at")
    .eq("id", id)
    .single();

  if (!quote) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef1f6", fontFamily: "Arial, sans-serif", padding: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "40px", textAlign: "center", maxWidth: "420px", boxShadow: "0 6px 24px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔍</div>
          <h1 style={{ fontSize: "18px", color: "#0f172a", margin: "0 0 8px" }}>Teklif bulunamadı</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Bağlantı hatalı veya teklif kaldırılmış olabilir. Lütfen Lider Network ile iletişime geçin.</p>
        </div>
      </main>
    );
  }

  return <OnayClient quote={quote} />;
}
