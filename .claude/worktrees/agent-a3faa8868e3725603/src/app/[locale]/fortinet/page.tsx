import type { Metadata } from "next";
import FortinetClient from "./FortinetClient";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Fortinet FortiGate Çözümleri | Türkiye Yetkili Partner - Lider Network",
    description:
      "Lider Network, Fortinet yetkili distribütörü olarak FortiGate NGFW, FortiSwitch, FortiAP ve tüm Fortinet ürün portföyünü sunar. SD-WAN, Zero Trust, SASE, FortiGuard hizmetleri. Türkiye'de 7/24 teknik destek.",
    keywords: [
      "FortiGate",
      "Fortinet Türkiye",
      "NGFW",
      "Next-Generation Firewall",
      "FortiGuard",
      "SD-WAN",
      "Zero Trust",
      "FortiSwitch",
      "FortiAP",
      "Fortinet yetkili partner",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/fortinet`,
      languages: {
        tr: `${baseUrl}/tr/fortinet`,
        en: `${baseUrl}/en/fortinet`,
      },
    },
    openGraph: {
      title: "Fortinet FortiGate Çözümleri | Türkiye Yetkili Partner - Lider Network",
      description:
        "Fortinet yetkili distribütörü Lider Network ile FortiGate NGFW, SD-WAN ve Zero Trust çözümleri.",
      url: `${baseUrl}/${locale}/fortinet`,
    },
  };
}

export default async function FortinetPage() {
  return <FortinetClient />;
}
