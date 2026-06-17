import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "Servis Durumu | Lider Network",
  description: "Lider Network servislerinin anlık durumunu takip edin. Tehdit feed, destek portalı, IP sorgu ve diğer servislerin erişilebilirliği.",
  keywords: ["servis durumu", "uptime", "sistem durumu", "status page", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://uptime.lidernetwork.com.tr" },
  openGraph: {
    type: "website",
    title: "Servis Durumu | Lider Network",
    description: "Lider Network servislerinin anlık erişilebilirlik durumu.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070d1c",
};

export default function UptimeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
