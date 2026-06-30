import type { Metadata } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr ? "FortiAP Güvenli Kablosuz Ağ (Secure Wi-Fi)" : "FortiAP Secure Wireless (Wi-Fi)",
    description: isTr
      ? "FortiAP ile güvenli kablosuz ağ: FortiGate üzerinden merkezi yönetim, AI tabanlı radyo optimizasyonu ve Zero Trust güvenlik. Lider Network Fortinet Yetkili Partner."
      : "Secure wireless with FortiAP: central management via FortiGate, AI-driven radio optimization and Zero Trust security. Lider Network — Fortinet Authorized Partner.",
    alternates: {
      canonical: `${baseUrl}/${locale}/fortinet/fortiap`,
      languages: {
        tr: `${baseUrl}/tr/fortinet/fortiap`,
        en: `${baseUrl}/en/fortinet/fortiap`,
        "x-default": `${baseUrl}/tr/fortinet/fortiap`,
      },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
