"use client";

import { trackWhatsAppClick } from "@/lib/gtag";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/903122320288?text=Merhaba%2C%20Lider%20Network%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      onClick={() => trackWhatsAppClick()}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full transition-all duration-300 hover:scale-110 group"
      style={{
        backgroundColor: "#25D366",
        color: "white",
        boxShadow: "0 4px 24px rgba(37,211,102,0.45)",
      }}
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.107 1.519 5.836L0 24l6.336-1.492A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.371l-.36-.214-3.733.979 1.003-3.645-.234-.374A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
      </svg>
      <span
        className="text-sm font-semibold hidden sm:inline"
        style={{ fontFamily: "var(--font-family-label)" }}
      >
        WhatsApp
      </span>
    </a>
  );
}
