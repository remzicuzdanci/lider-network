import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lidernetwork.com.tr"),
  title: "Güçlü Şifre Oluşturucu | Lider Network",
  description: "Güvenli, rastgele ve güçlü şifreler oluşturun. Uzunluk, karakter seti ve karmaşıklık ayarları ile özelleştirilebilir şifre üretici.",
  keywords: ["şifre oluşturucu", "güvenli şifre", "rastgele şifre", "password generator", "güçlü şifre", "Lider Network"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://password.lidernetwork.com.tr" },
  openGraph: {
    type: "website",
    title: "Güçlü Şifre Oluşturucu | Lider Network",
    description: "Güvenli ve rastgele şifreler anında oluşturun.",
    siteName: "Lider Network",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070d1c",
};

export default function PasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
