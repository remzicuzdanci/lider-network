"use client";

import { useState, useEffect } from "react";

/**
 * Returns subdomain-aware paths for the destek portal.
 *
 * When accessed via `destek.lidernetwork.com.tr`, links use
 * short paths (/panel, /giris …) so the subdomain URL is preserved.
 * On the main site they fall back to the full locale prefix.
 */
export function useDestekPaths(locale: string) {
  const [sub, setSub] = useState(false);

  useEffect(() => {
    setSub(window.location.hostname.startsWith("destek."));
  }, []);

  return {
    landing: sub ? "/" : `/${locale}/destek`,
    giris:   sub ? "/giris"  : `/${locale}/destek/giris`,
    kayit:   sub ? "/kayit"  : `/${locale}/destek/kayit`,
    panel:   sub ? "/panel"  : `/${locale}/destek/panel`,
    yeni:    sub ? "/panel/yeni" : `/${locale}/destek/panel/yeni`,
    ticket:  (id: string) => sub ? `/panel/${id}` : `/${locale}/destek/panel/${id}`,
  };
}
