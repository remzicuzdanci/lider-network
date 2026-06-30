import type { Metadata } from "next";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr ? "FortiSwitch Yönetilebilir Switch Çözümleri" : "FortiSwitch Managed Switch Solutions",
    description: isTr
      ? "FortiSwitch ile güvenli ağ omurgası: FortiLink ile FortiGate üzerinden tek panelden yönetim, Zero Trust NAC ve PoE çözümleri. Lider Network Fortinet Yetkili Partner."
      : "Secure network backbone with FortiSwitch: single-pane management via FortiLink, Zero Trust NAC and PoE. Lider Network — Fortinet Authorized Partner.",
    alternates: {
      canonical: `${baseUrl}/${locale}/fortinet/fortiswitch`,
      languages: {
        tr: `${baseUrl}/tr/fortinet/fortiswitch`,
        en: `${baseUrl}/en/fortinet/fortiswitch`,
        "x-default": `${baseUrl}/tr/fortinet/fortiswitch`,
      },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
