"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Sayfanın başına dön"
      className="fixed bottom-24 right-6 z-40 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{
        backgroundColor: "rgba(30,34,36,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--color-on-surface-variant)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
