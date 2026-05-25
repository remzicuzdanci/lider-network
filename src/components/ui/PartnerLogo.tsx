"use client";

import { useState } from "react";

const SI = "https://cdn.simpleicons.org";

interface PartnerLogoProps {
  /** Direct image URL — takes priority (e.g. Wix CDN) */
  url?: string | null;
  /** Simple Icons slug — used when no url (e.g. "fortinet") */
  slug?: string | null;
  /** 2-4 letter abbreviation shown when everything fails */
  abbr: string;
  /** Brand hex colour — border accent & fallback bg */
  color: string;
  /** Square size in px (default 48) */
  size?: number;
  /**
   * Card background colour override.
   * Use "#ffffff" (default) for light logos, a dark hex for white/light SVG logos
   * so they remain visible (e.g. "#1a3050" for Pantech).
   */
  bgColor?: string;
}

export function PartnerLogo({ url, slug, abbr, color, size = 48, bgColor = "#ffffff" }: PartnerLogoProps) {
  const [failed, setFailed] = useState(false);

  const r   = Math.round(size * 0.22);
  const pad = Math.round(size * 0.17);

  // Resolve image source: direct url > Simple Icons slug > nothing
  const src = failed ? null : (url ?? (slug ? `${SI}/${slug}` : null));

  /* ── Fallback: brand-colour abbr badge ─────────────────────────────────── */
  if (!src) {
    return (
      <div
        style={{
          width: size, height: size, minWidth: size, flexShrink: 0,
          backgroundColor: color, borderRadius: r,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, color: "#ffffff",
          fontSize: Math.round(size * 0.22),
          fontFamily: "var(--font-family-headline)",
          letterSpacing: "-0.02em",
        }}
      >
        {abbr}
      </div>
    );
  }

  /* ── Card + image ───────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        width: size, height: size, minWidth: size, flexShrink: 0,
        backgroundColor: bgColor, borderRadius: r,
        border: `1.5px solid ${color}45`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: pad, boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={abbr}
        onError={() => setFailed(true)}
        style={{ objectFit: "contain", width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
