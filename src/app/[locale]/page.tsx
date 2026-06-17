import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import ClientMarquee from "@/components/home/ClientMarquee";
import FortinetHighlight from "@/components/home/FortinetHighlight";
import FortinetProducts from "@/components/home/FortinetProducts";
import Services from "@/components/home/Services";
import Industries from "@/components/home/Industries";
import Expertise from "@/components/home/Expertise";
import LatestPosts from "@/components/home/LatestPosts";
import DnsCheckerCTA from "@/components/home/DnsCheckerCTA";
import SupportPortal from "@/components/home/SupportPortal";
import ITTools from "@/components/home/ITTools";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isTr = locale === "tr";

  return {
    title: isTr
      ? "Lider Network - Fortinet Yetkili Partner | Siber Güvenlik ve BT Altyapı Çözümleri"
      : "Lider Network - Fortinet Authorized Partner | Cybersecurity & IT Infrastructure",
    description: isTr
      ? "Fortinet Yetkili Partner Lider Network ile altyapınızı güçlendirin. NGFW, SD-WAN, siber güvenlik ve 7/24 destek. 2006'dan beri 500+ başarılı proje, İstanbul."
      : "Strengthen your infrastructure with Lider Network, Fortinet Authorized Partner. NGFW, SD-WAN, cybersecurity and 24/7 support. 500+ projects since 2006.",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        tr: `${baseUrl}/tr`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: isTr
        ? "Lider Network - Fortinet Yetkili Partner | Enterprise BT Çözümleri"
        : "Lider Network - Fortinet Authorized Partner | Enterprise IT Solutions",
      description: isTr
        ? "Enterprise düzeyde siber güvenlik, ağ altyapısı ve veri depolama çözümleri. Fortinet uzman mühendisler. 2006'dan beri güvenilir çözümler."
        : "Enterprise-grade cybersecurity, network infrastructure and data storage solutions. Fortinet expert engineers. Trusted solutions since 2006.",
      url: `${baseUrl}/${locale}`,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <ClientMarquee />
      <FortinetHighlight />
      <FortinetProducts />
      <Services />
      <SupportPortal />
      <Industries />
      <Expertise />
      <LatestPosts />
      <ITTools />
      <DnsCheckerCTA />
    </>
  );
}
