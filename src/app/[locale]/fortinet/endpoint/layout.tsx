import type { Metadata } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr ? "FortiClient & FortiEDR Endpoint Güvenliği" : "FortiClient & FortiEDR Endpoint Security",
    description: isTr
      ? "FortiClient ZTNA ve FortiEDR ile uç nokta güvenliği: gelişmiş tehdit koruması, EDR/XDR ve merkezi yönetim. Lider Network Fortinet Yetkili Partner."
      : "Endpoint security with FortiClient ZTNA and FortiEDR: advanced threat protection, EDR/XDR and central management. Lider Network — Fortinet Authorized Partner.",
    alternates: {
      canonical: `${baseUrl}/${locale}/fortinet/endpoint`,
      languages: {
        tr: `${baseUrl}/tr/fortinet/endpoint`,
        en: `${baseUrl}/en/fortinet/endpoint`,
        "x-default": `${baseUrl}/tr/fortinet/endpoint`,
      },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
