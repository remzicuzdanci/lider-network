import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "IP Kara Liste Sorgulama | Lider Network",
  description: "IP adresinizin 30+ spam ve kara listede (DNSBL/RBL) olup olmadığını anında kontrol edin. Spamhaus, SpamCop, Barracuda, SORBS ve daha fazlası.",
  keywords: ["ip kara liste", "blacklist sorgu", "spam liste kontrol", "DNSBL", "RBL sorgu", "ip itibar", "Spamhaus", "SpamCop", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://blacklist.lidernetwork.com.tr" },
  openGraph: {
    type: "website",
    title: "IP Kara Liste Sorgulama | Lider Network",
    description: "30+ DNSBL/RBL listesinde IP itibar kontrolü — Spamhaus, Barracuda, SpamCop ve daha fazlası.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e27",
};

export default function BlacklistLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
