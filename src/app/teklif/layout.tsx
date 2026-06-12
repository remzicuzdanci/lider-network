import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Teklif | Lider Network",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0052ff",
};

export default function TeklifLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
