"use client";

import { trackPhoneClick } from "@/lib/gtag";

interface Props {
  source?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function TrackedPhoneLink({ source = "unknown", className, style, children }: Props) {
  return (
    <a
      href="tel:+903122320288"
      className={className}
      style={style}
      onClick={() => trackPhoneClick(source)}
    >
      {children}
    </a>
  );
}
