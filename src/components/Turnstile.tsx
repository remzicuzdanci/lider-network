"use client";

import { useEffect, useRef } from "react";

/* Cloudflare Turnstile robot doğrulama widget'ı.
   NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlı değilse hiçbir şey çizmez (graceful). */

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

export const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    const SCRIPT_ID = "cf-turnstile-script";

    function render() {
      if (window.turnstile && ref.current && !ref.current.hasChildNodes()) {
        window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (t: string) => onToken(t),
          "error-callback": () => onToken(""),
          "expired-callback": () => onToken(""),
        });
      }
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} style={{ marginBottom: "20px", minHeight: "65px" }} />;
}
