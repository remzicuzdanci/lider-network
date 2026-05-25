import type { Metadata } from "next";
import { Hanken_Grotesk, Inter } from "next/font/google";
import "../globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Panel | Lider Network Destek",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${hanken.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#101415" />
      </head>
      <body style={{ fontFamily: "var(--font-family-body)" }}>
        {children}
      </body>
    </html>
  );
}
