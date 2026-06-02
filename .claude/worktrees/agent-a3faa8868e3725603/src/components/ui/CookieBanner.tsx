"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "ln_cookie_consent";

export default function CookieBanner() {
  const locale = useLocale();
  const isTr = locale === "tr";
  const [show, setShow] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setShow(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] px-4 py-4 sm:px-6"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
        style={{
          backgroundColor: "rgba(22,26,28,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
          pointerEvents: "auto",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(0,82,255,0.12)", border: "1px solid rgba(0,82,255,0.25)" }}
        >
          <Cookie className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-family-label)" }}>
            {isTr ? "Çerez Politikası" : "Cookie Policy"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Web sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Analitik ve pazarlama çerezleri için onayınızı istiyoruz. Daha fazla bilgi için "
              : "We use cookies to improve your experience. We request your consent for analytical and marketing cookies. For more information see our "}
            <Link
              href={`/${locale}/kvkk`}
              className="underline underline-offset-2 hover:text-white transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              {isTr ? "KVKK & Gizlilik Politikamızı" : "Privacy Policy"}
            </Link>
            {isTr ? " inceleyin." : "."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--color-outline)",
              fontFamily: "var(--font-family-label)",
            }}
          >
            {isTr ? "Reddet" : "Reject"}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0052ff, #0040cc)",
              color: "white",
              fontFamily: "var(--font-family-label)",
              boxShadow: "0 2px 12px rgba(0,82,255,0.35)",
            }}
          >
            {isTr ? "Tümünü Kabul Et" : "Accept All"}
          </button>
          <button
            onClick={reject}
            aria-label="Kapat"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--color-outline)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
