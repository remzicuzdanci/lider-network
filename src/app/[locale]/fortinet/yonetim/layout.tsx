import type { Metadata } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr ? "FortiManager & FortiAnalyzer Merkezi Yönetim" : "FortiManager & FortiAnalyzer Central Management",
    description: isTr
      ? "FortiManager ile merkezi politika yönetimi, FortiAnalyzer ile log/analiz ve 7/24 SOC izleme. Tek panelden Fortinet altyapı yönetimi. Lider Network Yetkili Partner."
      : "Central policy management with FortiManager, logging/analytics with FortiAnalyzer and 24/7 SOC monitoring. Lider Network — Fortinet Authorized Partner.",
    alternates: { canonical: `${baseUrl}/${locale}/fortinet/yonetim` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
